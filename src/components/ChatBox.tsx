import { isAiEnabled } from "@src/config"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { ComputedChat } from "@src/services/computeChat"

export interface ChatBoxProps {
  character: ComputedCharacter
  computedChat: ComputedChat
  swapOob?: boolean
}

export const ChatBox = ({ character, computedChat, swapOob = false }: ChatBoxProps) => {
  // Don't render if AI is not enabled
  if (!isAiEnabled()) {
    return null
  }

  return (
    <div
      class="card shadow-sm mb-3"
      id="chat-box-card"
      {...(swapOob ? { "hx-swap-oob": "true" } : {})}
    >
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="bi bi-robot me-2"></i>
          AI Assistant
        </h5>
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            hx-get={`/characters/${character.id}/chat/new`}
            hx-target="#chat-box-card"
            hx-swap="outerHTML"
          >
            <i class="bi bi-plus-lg"></i> New
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/chats`}
            hx-target="#editModalContent"
            data-bs-toggle="modal"
            data-bs-target="#editModal"
          >
            <i class="bi bi-clock-history"></i> History
          </button>
        </div>
      </div>
      <div class="card-body">
        {/* Chat messages container */}
        <div
          id="chat-messages"
          class="mb-3"
          style="max-height: 300px; overflow-y: auto; min-height: 100px;"
        >
          {computedChat.messages.length === 0 ? (
            <div class="text-muted text-center py-3">
              <small>Ask me to help manage your character sheet!</small>
            </div>
          ) : (
            computedChat.messages.map((msg) => (
              <ChatMessageBubble id={msg.id} chatRole={msg.chatRole} content={msg.content} />
            ))
          )}

          {/* Response box - shown when waiting for AI response */}
          {computedChat.shouldStream && (
            <div class="row mb-2">
              <div class="col-10">
                <div class="rounded px-3 py-2 bg-secondary text-white">
                  <i class="bi bi-robot me-1"></i>
                  <span
                    id={`response-box-${computedChat.chatId}`}
                    hx-ext="sse"
                    sse-connect={`/characters/${character.id}/chat/${computedChat.chatId}/stream`}
                    sse-swap="message"
                  >
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        <form
          id="chat-form"
          hx-post={`/characters/${character.id}/chat`}
          hx-target="#chat-box-card"
          hx-swap="outerHTML"
        >
          {computedChat.chatId && (
            <input type="hidden" name="chat_id" value={computedChat.chatId} />
          )}
          <div class="input-group">
            <input
              type="text"
              name="message"
              id="chat-input"
              class="form-control"
              placeholder="e.g., I spent 50 gold on a sword"
              required
              autocomplete="off"
              {...(computedChat.shouldStream ? { disabled: true } : {})}
            />
            <button
              type="submit"
              class="btn btn-primary"
              {...(computedChat.shouldStream ? { disabled: true } : {})}
            >
              {computedChat.shouldStream ? (
                <output class="spinner-border spinner-border-sm" aria-hidden="true" />
              ) : (
                <i class="bi bi-send"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component for displaying a single chat message bubble
 */
export interface ChatMessageBubbleProps {
  id: string
  chatRole: "user" | "assistant"
  content: string
}

export const ChatMessageBubble = ({ id, chatRole, content }: ChatMessageBubbleProps) => {
  const isUser = chatRole === "user"

  return (
    <div class="row mb-2" id={`msg-${id}`}>
      <div class={isUser ? "col-10 offset-2" : "col-10"}>
        <div
          class={`rounded px-3 py-2 ${isUser ? "bg-primary text-white" : "bg-secondary text-white"}`}
        >
          {!isUser && <i class="bi bi-robot me-1"></i>}
          <span>{content}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Confirmation modal for tool execution
 */
export interface ChatConfirmModalProps {
  characterId: string
  toolName: string
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
  swapOob?: boolean
  errors?: Record<string, string>
}

export const ChatConfirmModal = ({
  characterId,
  toolName,
  parameters,
  swapOob,
  errors,
}: ChatConfirmModalProps) => {
  // Format tool name for display
  const displayName = toolName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  // Format parameters for display
  const paramEntries = Object.entries(parameters).filter(
    ([_key, value]) => value !== undefined && value !== null && value !== ""
  )

  return (
    <div
      class="modal-content"
      id="editModalContent"
      data-show-modal="true"
      {...(swapOob && { "hx-swap-oob": "true" })}
    >
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="bi bi-check-circle me-2"></i>
          Confirm Action
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {errors && Object.keys(errors).length > 0 && (
          <div class="alert alert-danger mb-3">
            <strong>Errors:</strong>
            <ul class="mb-0 mt-2">
              {Object.entries(errors).map(([field, error]) => (
                <li>
                  <strong>{field}:</strong> {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p>
          The AI wants to <strong>{displayName}</strong>:
        </p>

        <div class="bg-dark border border-secondary p-3 rounded mb-3">
          {paramEntries.map(([key, value]) => (
            <div class="mb-1">
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>

        <p class="text-muted mb-0">
          <small>Review the details above and confirm to proceed.</small>
        </p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          hx-post={`/characters/${characterId}/chat/execute-tool`}
          hx-vals={JSON.stringify({
            tool_name: toolName,
            parameters: JSON.stringify(parameters),
          })}
          hx-target="#editModalContent"
        >
          <i class="bi bi-check-lg me-1"></i>
          Confirm
        </button>
      </div>
    </div>
  )
}
