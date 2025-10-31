import { ALL_TOOL_EXECUTORS, executeChatRequest, prepareChatRequest } from "@src/ai/chat"
import { CharacterInfo } from "@src/components/CharacterInfo"
import { ChatBox, ChatConfirmModal, type ChatMessage } from "@src/components/ChatBox"
import { CurrentStatus } from "@src/components/CurrentStatus"
import { InventoryPanel } from "@src/components/panels/InventoryPanel"
import { isAiEnabled } from "@src/config"
import { getDb } from "@src/db"
import {
  clearChat,
  findByChatId as getChatHistory,
  getChatsByCharacterId,
} from "@src/db/chat_messages"
import { logger } from "@src/lib/logger"
import { computeCharacter } from "@src/services/computeCharacter"
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

  logger.info("Prepared chat request", {
    characterId,
    userId: user.id,
    chatId: finalChatId,
  })

  // Load updated chat history (just the user message at this point)
  const history = await getChatHistory(db, finalChatId, 50)
  const messages: ChatMessage[] = history.map((msg) => ({
    id: msg.id,
    chatRole: msg.role as "user" | "assistant",
    content: msg.content,
  }))

  // Return updated ChatBox - will auto-initiate streaming since last message is from user
  return c.html(<ChatBox character={char} messages={messages} chatId={finalChatId} />)
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

  logger.info("SSE stream request received", { characterId, chatId, userId: user.id })

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.json({ error: "Character not found" }, 404)
  }

  return streamSSE(c, async (stream) => {
    try {
      // Execute chat request and stream updates
      await executeChatRequest(db, char, chatId, async (chunk) => {
        logger.info("Processing chat chunk", { chunk })
        if (chunk.type === "text") {
          // Stream text updates as "message" events
          await stream.writeSSE({
            event: "message",
            data: chunk.text,
          })
        } else if (chunk.type === "tool") {
          // Send tool confirmation modal (will be opened by htmx:afterSwap listener)
          await stream.writeSSE({
            data: (
              <ChatConfirmModal
                characterId={characterId}
                toolName={chunk.tool_name}
                parameters={chunk.parameters}
                swapOob={true}
              />
            ).toString(),
          })

          logger.info("Sent tool call modal", {
            toolName: chunk.tool_name,
            chatId,
          })
        }
      })

      logger.info("Chat stream completed", { characterId, userId: user.id, chatId })
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

    // After streaming completes, load full chat history and return complete ChatBox
    const history = await getChatHistory(db, chatId, 50)
    const messages: ChatMessage[] = history.map((msg) => ({
      id: msg.id,
      chatRole: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    await stream.writeSSE({
      data: (
        <ChatBox character={char} messages={messages} chatId={chatId} swapOob={true} />
      ).toString(),
    })
  })
})

/**
 * POST /characters/:id/chat/execute-tool
 * Execute a tool after user confirmation
 */
chatRoutes.post("/characters/:id/chat/execute-tool", async (c) => {
  if (!isAiEnabled()) {
    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">AI features are not enabled</div>
        </div>
      </div>,
      503
    )
  }

  const user = c.var.user!
  const characterId = c.req.param("id")
  const db = getDb(c)

  // Verify character belongs to user
  const char = await computeCharacter(db, characterId)
  if (!char || char.user_id !== user.id) {
    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </div>,
      404
    )
  }

  // Get tool details from request
  const body = await c.req.parseBody()
  const toolName = body.tool_name as string
  const parametersJson = body.parameters as string

  if (!toolName || !parametersJson) {
    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Invalid tool call data</div>
        </div>
      </div>,
      400
    )
  }

  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  let parameters: Record<string, any>
  try {
    parameters = JSON.parse(parametersJson)
  } catch {
    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Invalid parameters JSON</div>
        </div>
      </div>,
      400
    )
  }

  try {
    // Look up the tool executor
    const executor = ALL_TOOL_EXECUTORS[toolName]

    if (!executor) {
      // Unknown tool
      return c.html(
        <div class="modal-content" id="editModalContent">
          <div class="modal-header">
            <h5 class="modal-title">Error</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger">Unknown tool: {toolName}</div>
          </div>
        </div>
      )
    }

    // Execute the tool
    logger.info("Executing tool", { toolName, parameters })
    const result = await executor(db, char, parameters)

    if (!result.success) {
      // Re-render modal with errors
      return c.html(
        <ChatConfirmModal
          characterId={characterId}
          toolName={toolName}
          parameters={parameters}
          errors={result.errors}
        />
      )
    }

    // Get updated character
    const updatedChar = (await computeCharacter(db, characterId))!

    // Return updated UI components with OOB swaps and close modal
    c.header("HX-Trigger", "closeEditModal")
    return c.html(
      <>
        <CharacterInfo character={updatedChar} swapOob={true} />
        <CurrentStatus character={updatedChar} swapOob={true} />
        <InventoryPanel character={updatedChar} swapOob={true} />
      </>
    )
  } catch (error) {
    logger.error("Error executing tool", error as Error, {
      toolName,
      characterId,
      userId: user.id,
    })

    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Failed to execute tool. Please try again.</div>
        </div>
      </div>
    )
  }
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

  // Return empty ChatBox with no messages and null chatId
  return c.html(<ChatBox character={char} messages={[]} chatId={null} />)
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

  // Load chat messages
  const history = await getChatHistory(db, chatId, 50)
  const messages: ChatMessage[] = history.map((msg) => ({
    id: msg.id,
    chatRole: msg.role as "user" | "assistant",
    content: msg.content,
  }))

  // Return ChatBox with loaded messages
  return c.html(<ChatBox character={char} messages={messages} chatId={chatId} />)
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

  logger.info("Deleted chat", { characterId, userId: user.id, chatId })

  // Return updated chat list
  const chats = await getChatsByCharacterId(db, characterId)
  const { ChatHistory } = await import("@src/components/ChatHistory")
  return c.html(<ChatHistory character={char} chats={chats} />)
})
