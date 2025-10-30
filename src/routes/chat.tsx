import { processUserMessage } from "@src/ai/chat"
import { CharacterInfo } from "@src/components/CharacterInfo"
import {
  ChatBox,
  ChatConfirmModal,
  type ChatMessage,
  ChatMessageBubble,
} from "@src/components/ChatBox"
import { CurrentStatus } from "@src/components/CurrentStatus"
import { InventoryPanel } from "@src/components/panels/InventoryPanel"
import { isAiEnabled } from "@src/config"
import { getDb } from "@src/db"
import { findByCharacterId as getChatHistory } from "@src/db/chat_messages"
import { logger } from "@src/lib/logger"
import { computeCharacter } from "@src/services/computeCharacter"
import { updateCoins } from "@src/services/updateCoins"
import { Hono } from "hono"
import { streamSSE } from "hono/streaming"
import { ulid } from "ulid"

export const chatRoutes = new Hono()

/**
 * POST /characters/:id/chat
 * Process a user message and stream AI response via SSE
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

  // Generate unique message ID for this response
  const messageId = ulid()

  // Load chat history (not including the message we're about to process)
  const history = await getChatHistory(db, characterId, 20)
  const messages: ChatMessage[] = history.map((msg) => ({
    id: ulid(),
    chatRole: msg.role as "user" | "assistant",
    content: msg.content,
  }))

  // Add user message to display
  messages.push({
    id: ulid(),
    chatRole: "user",
    content: userMessage.trim(),
  })

  // Add processing message with generated ID
  messages.push({
    id: messageId,
    chatRole: "assistant",
    content: "Processing...",
  })

  return streamSSE(c, async (stream) => {
    try {
      // Send initial response: ChatBox with all messages including processing message
      await stream.writeSSE({
        event: "message",
        data: (<ChatBox character={char} messages={messages} />).toString(),
      })

      // Process message with AI and stream updates
      await processUserMessage(db, char, userMessage.trim(), async (chunk) => {
        if (chunk.type === "text") {
          // Stream text updates - replace the processing message by ID
          await stream.writeSSE({
            event: "message",
            data: (
              <ChatMessageBubble
                id={messageId}
                chatRole="assistant"
                content={chunk.text}
                hx-swap-oob="true"
              />
            ).toString(),
          })
        } else if (chunk.type === "tool") {
          // Send tool confirmation modal
          await stream.writeSSE({
            event: "tool",
            data: (
              <>
                <ChatConfirmModal
                  characterId={characterId}
                  toolName={chunk.tool_name}
                  parameters={chunk.parameters}
                  swapOob={true}
                />
                <script type="text/javascript" hx-swap-oob="true">
                  {`
                    const modal = new bootstrap.Modal(document.getElementById('editModal'));
                    modal.show();
                  `}
                </script>
              </>
            ).toString(),
          })

          logger.info("Sent tool call modal", {
            toolName: chunk.tool_name,
            messageId,
          })
        }
      })

      logger.info("Chat stream completed", { characterId, userId: user.id, messageId })
    } catch (error) {
      logger.error("Error processing chat message", error as Error, {
        characterId,
        userId: user.id,
        messageId,
      })

      // Send error message
      await stream.writeSSE({
        event: "message",
        data: (
          <ChatMessageBubble
            id={messageId}
            chatRole="assistant"
            content="Sorry, I encountered an error processing your message. Please try again."
            hx-swap-oob="true"
          />
        ).toString(),
      })
    }
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
    }

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
      </div>,
      400
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
      </div>,
      500
    )
  }
})
