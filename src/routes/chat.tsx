import { processUserMessage, saveToolResult } from "@src/ai/chat"
import { CharacterInfo } from "@src/components/CharacterInfo"
import { ChatBox, ChatConfirmModal, type ChatMessage } from "@src/components/ChatBox"
import { CurrentStatus } from "@src/components/CurrentStatus"
import { InventoryPanel } from "@src/components/panels/InventoryPanel"
import { isAiEnabled } from "@src/config"
import { findByCharacterId as getChatHistory } from "@src/db/chat_messages"
import { getDb } from "@src/db"
import { logger } from "@src/lib/logger"
import { computeCharacter } from "@src/services/computeCharacter"
import { updateCoins } from "@src/services/updateCoins"
import { Hono } from "hono"

export const chatRoutes = new Hono()

/**
 * POST /characters/:id/chat
 * Process a user message and return AI response
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

  // Get user message from form
  const body = await c.req.parseBody()
  const userMessage = body.message as string

  if (!userMessage || typeof userMessage !== "string" || userMessage.trim() === "") {
    return c.json({ error: "Message is required" }, 400)
  }

  try {
    // Process message with AI
    const response = await processUserMessage(db, char, userMessage.trim())

    logger.info("Chat response", {
      hasToolCall: !!response.tool_call,
      toolName: response.tool_call?.tool_name,
      message: response.message
    })

    // Load recent chat history
    const history = await getChatHistory(db, characterId, 20)
    const messages: ChatMessage[] = history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // If there's a tool call, trigger the modal to open
    if (response.tool_call) {
      c.header("HX-Trigger", "openEditModal")
      logger.info("Setting HX-Trigger header to openEditModal")

      // Return ChatBox + modal
      return c.html(
        <>
          <ChatBox character={char} messages={messages} />
          <ChatConfirmModal
            characterId={characterId}
            toolName={response.tool_call.tool_name}
            parameters={response.tool_call.parameters}
            swapOob={true}
          />
        </>
      )
    }

    // No tool call, just return updated ChatBox
    return c.html(<ChatBox character={char} messages={messages} />)
  } catch (error) {
    logger.error("Error processing chat message", error as Error, {
      characterId,
      userId: user.id,
    })
    return c.json({ error: "Failed to process message. Please try again." }, 500)
  }
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
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Invalid parameters JSON</div>
        </div>
      </div>,
      400
    )
  }

  try {
    // Execute the appropriate service based on tool name
    if (toolName === "update_coins") {
      // Convert parameters to string format for service
      const data: Record<string, string> = {
        ...parameters,
        make_change: "true", // Always enable make_change for AI tool calls
      }

      logger.info("Calling updateCoins with data", { data })

      const result = await updateCoins(db, char, data)

      if (!result.complete) {
        // Save error result
        await saveToolResult(db, characterId, toolName, {
          success: false,
          error: Object.values(result.errors).join(", "),
        })

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

      // Save success result
      await saveToolResult(db, characterId, toolName, {
        success: true,
        message: "Coins updated successfully",
      })

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
    }

    // Unknown tool
    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Unknown tool: {toolName}</div>
        </div>
      </div>,
      400
    )
  } catch (error) {
    logger.error("Error executing tool", error as Error, {
      toolName,
      characterId,
      userId: user.id,
    })

    await saveToolResult(db, characterId, toolName, {
      success: false,
      error: "Execution failed",
    })

    return c.html(
      <div class="modal-content" id="editModalContent">
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Failed to execute tool. Please try again.</div>
        </div>
      </div>,
      500
    )
  }
})
