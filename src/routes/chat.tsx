import { executeChatRequest, prepareChatRequest } from "@src/ai/chat"
import { CharacterInfo } from "@src/components/CharacterInfo"
import { ChatBox } from "@src/components/ChatBox"
import { CurrentStatus } from "@src/components/CurrentStatus"
import { AbilitiesPanel } from "@src/components/panels/AbilitiesPanel"
import { InventoryPanel } from "@src/components/panels/InventoryPanel"
import { SkillsPanel } from "@src/components/panels/SkillsPanel"
import { SpellsPanel } from "@src/components/panels/SpellsPanel"
import { isAiEnabled } from "@src/config"
import { getDb } from "@src/db"
import { clearChat, getChatsByCharacterId } from "@src/db/chat_messages"
import { logger } from "@src/lib/logger"
import { computeCharacter } from "@src/services/computeCharacter"
import { computeChat } from "@src/services/computeChat"
import { executeTool, rejectTool } from "@src/services/toolExecution"
import { Hono } from "hono"
import { streamSSE } from "hono/streaming"

export const chatRoutes = new Hono()

/**
 * POST /characters/:id/chat
 * Save user message and create empty assistant message, return updated ChatBox
 */
chatRoutes.post("/characters/:id/chat", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Get user message and optional chat_id from form
  const body = await c.req.parseBody()
  const userMessage = body.message as string
  const chatId = (body.chat_id as string) || null

  if (!userMessage || typeof userMessage !== "string" || userMessage.trim() === "") {
    return c.json({ error: "Message is required" }, 400)
  }

  // Prepare chat request: save user message only
  const { chatId: finalChatId } = await prepareChatRequest(db, char, userMessage.trim(), chatId)

  // Compute chat data structure
  const computedChat = await computeChat(db, finalChatId)

  // Return updated ChatBox - will auto-initiate streaming since shouldStream will be true
  return c.html(<ChatBox character={char} computedChat={computedChat} />)
})

/**
 * GET /characters/:id/chat/:chatId/stream
 * Stream AI response for a chat via SSE
 */
chatRoutes.get("/characters/:id/chat/:chatId/stream", async (c) => {
  if (!isAiEnabled()) {
    logger.error("AI not enabled for SSE stream")
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const chatId = c.req.param("chatId")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Compute chat data structure
  const computedChat = await computeChat(db, chatId)

  // Check if chat is ready to stream
  if (!computedChat.shouldStream) {
    return c.json({ error: "Chat is not ready to stream" }, 400)
  }

  return streamSSE(c, async (stream) => {
    try {
      // Execute chat request and stream updates
      await executeChatRequest(db, char, computedChat, async (chunk) => {
        if (chunk.type === "text") {
          // Stream text updates as "message" events
          await stream.writeSSE({
            event: "message",
            data: chunk.text,
          })
        }
      })
    } catch (error) {
      logger.error("Error processing chat message", error as Error, {
        characterId,
        userId: user.id,
        chatId,
      })

      // Send error message as response event
      await stream.writeSSE({
        event: "message",
        data: "Sorry, I encountered an error processing your message. Please try again.",
      })
    }

    // After streaming completes, reload chat and return complete ChatBox
    const updatedChat = await computeChat(db, chatId)

    await stream.writeSSE({
      data: (<ChatBox character={char} computedChat={updatedChat} swapOob={true} />).toString(),
    })
  })
})

/**
 * POST /characters/:id/chat/:chatId/tool/:toolCallId/approve
 * Approve and execute a specific tool call
 */
chatRoutes.post("/characters/:id/chat/:chatId/tool/:toolCallId/approve", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const chatId = c.req.param("chatId")
  const toolCallId = c.req.param("toolCallId")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Get computed chat to find the unresolved tool call
  const computedChat = await computeChat(db, chatId)
  const unresolvedTool = computedChat.unresolvedToolCalls.find((tc) => tc.toolCallId === toolCallId)

  if (!unresolvedTool) {
    return c.json({ error: "Tool call not found or already resolved" }, 404)
  }

  try {
    await executeTool(db, char, unresolvedTool)

    // Get updated character and chat
    const updatedChar = (await computeCharacter(db, characterId))!
    const updatedChat = await computeChat(db, chatId)

    // Return updated UI components with OOB swaps
    return c.html(
      <>
        <CharacterInfo character={updatedChar} swapOob={true} />
        <SpellsPanel character={updatedChar} swapOob={true} />
        <AbilitiesPanel character={updatedChar} swapOob={true} />
        <SkillsPanel character={updatedChar} swapOob={true} />
        <CurrentStatus character={updatedChar} swapOob={true} />
        <InventoryPanel character={updatedChar} swapOob={true} />
        <ChatBox character={updatedChar} computedChat={updatedChat} swapOob={true} />
      </>
    )
  } catch (error) {
    logger.error("Error executing tool", error as Error, {
      toolName: unresolvedTool.toolName,
      characterId,
      userId: user.id,
    })

    return c.json({ error: "Failed to execute tool" }, 500)
  }
})

/**
 * POST /characters/:id/chat/:chatId/tool/:toolCallId/reject
 * Reject a specific tool call
 */
chatRoutes.post("/characters/:id/chat/:chatId/tool/:toolCallId/reject", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const chatId = c.req.param("chatId")
  const toolCallId = c.req.param("toolCallId")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Get computed chat to find the unresolved tool call
  const computedChat = await computeChat(db, chatId)
  const unresolvedTool = computedChat.unresolvedToolCalls.find((tc) => tc.toolCallId === toolCallId)

  if (!unresolvedTool) {
    return c.json({ error: "Tool call not found or already resolved" }, 404)
  }

  // Reject the tool via service
  await rejectTool(db, unresolvedTool)

  // Get updated chat
  const updatedChat = await computeChat(db, chatId)

  // Return updated ChatBox
  return c.html(<ChatBox character={char} computedChat={updatedChat} />)
})

/**
 * GET /characters/:id/chat/new
 * Create a new empty chat (return ChatBox with no messages and null chatId)
 */
chatRoutes.get("/characters/:id/chat/new", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Create empty computed chat for new conversation
  const emptyChat = {
    chatId: "",
    messages: [],
    llmMessages: [],
    shouldStream: false,
    unresolvedToolCalls: [],
  }

  // Return empty ChatBox
  return c.html(<ChatBox character={char} computedChat={emptyChat} />)
})

/**
 * GET /characters/:id/chat/:chatId/load
 * Load an existing chat conversation
 */
chatRoutes.get("/characters/:id/chat/:chatId/load", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const chatId = c.req.param("chatId")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Compute chat data structure
  const computedChat = await computeChat(db, chatId)

  // Return ChatBox with loaded chat
  return c.html(<ChatBox character={char} computedChat={computedChat} />)
})

/**
 * GET /characters/:id/chats
 * Get list of chats for a character with preview info
 */
chatRoutes.get("/characters/:id/chats", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Get chat previews
  const chats = await getChatsByCharacterId(db, characterId)

  // Return ChatHistory component (will create this next)
  const { ChatHistory } = await import("@src/components/ChatHistory")
  return c.html(<ChatHistory character={char} chats={chats} />)
})

/**
 * DELETE /characters/:id/chat/:chatId
 * Delete an entire chat conversation
 */
chatRoutes.delete("/characters/:id/chat/:chatId", async (c) => {
  if (!isAiEnabled()) {
    return c.json({ error: "AI features are not enabled" }, 503)
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const chatId = c.req.param("chatId")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  // Delete the chat
  await clearChat(db, chatId)

  // Return updated chat list
  const chats = await getChatsByCharacterId(db, characterId)
  const { ChatHistory } = await import("@src/components/ChatHistory")
  return c.html(<ChatHistory character={char} chats={chats} />)
})
