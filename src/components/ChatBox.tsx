import { isAiEnabled } from "@src/config"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { ComputedChat, UnresolvedToolCall } from "@src/services/computeChat"
import { TOOL_FORMATTERS } from "@src/tools"
import { clsx } from "clsx"
import { marked, type Tokens } from "marked"

/**
 * Convert markdown to sanitized HTML
 * Marked handles sanitization by default in modern versions
 */
function markdownToHtml(markdown: string, icon?: string): string {
  let isFirstParagraph = true
  const renderer = new marked.Renderer()

  if (icon) {
    renderer.paragraph = function (tokens: Tokens.Paragraph) {
      const text = this.parser.parseInline(tokens.tokens)

      if (isFirstParagraph) {
        isFirstParagraph = false
        return `<p>${icon} ${text}</p>`
      }
      return `<p>${text}</p>`
    }
  }

  return marked.parse(markdown, {
    renderer,
    async: false,
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  }) as string
}

export interface ChatBoxProps {
  character: ComputedCharacter
  computedChat: ComputedChat
  swapOob?: boolean
}

export interface ToolCallApprovalProps {
  characterId: string
  chatId: string
  toolCall: UnresolvedToolCall
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
          <i class="bi bi-book me-2"></i>
          Reed
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
          class="container-fluid mb-3"
          style="max-height: 300px; overflow-y: auto; min-height: 100px;"
          data-scroll-bottom="true"
        >
          {computedChat.messages.length === 0 ? (
            <div class="text-muted text-center py-3">
              <small>Reed here! What can I help you with today?</small>
            </div>
          ) : (
            computedChat.messages.map((msg) => (
              <>
                <ChatMessageBubble id={msg.id} chatRole={msg.chatRole} content={msg.content} />
                {/* Show tool approvals after assistant messages */}
                {msg.chatRole === "assistant" &&
                  computedChat.unresolvedToolCalls
                    .filter((tc) => tc.messageId === msg.id)
                    .map((tc) => (
                      <ToolCallApproval
                        characterId={character.id}
                        chatId={computedChat.chatId}
                        toolCall={tc}
                      />
                    ))}
              </>
            ))
          )}

          {/* Response box - shown when waiting for AI response */}
          {computedChat.shouldStream && (
            <div class="row g-0 mb-2 chat-message">
              <div class="col-10">
                <div class="rounded px-3 py-2 bg-secondary text-white">
                  <i class="bi bi-book me-1"></i>
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
  const isAssistant = chatRole === "assistant"
  if (isAssistant && !content.trim()) {
    return null
  }

  // Convert markdown to HTML for rendering
  const htmlContent = markdownToHtml(
    content,
    isAssistant ? `<i class="bi bi-book me-1"></i>` : undefined
  )

  const divClass = clsx("rounded px-3 py-2", {
    "bg-primary text-white": !isAssistant,
    "bg-secondary text-white": isAssistant,
  })

  return (
    <div class="row g-0 mb-2 chat-message" id={`msg-${id}`}>
      <div class={isAssistant ? "col-10" : "col-10 offset-2"}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: this HTML is sanitized */}
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} class={divClass} />
      </div>
    </div>
  )
}

/**
 * Inline tool call approval component
 * Shows a pending tool call with approve/reject buttons
 */
export const ToolCallApproval = ({ characterId, chatId, toolCall }: ToolCallApprovalProps) => {
  // Get formatter for this tool and generate user-friendly message
  const formatter = TOOL_FORMATTERS[toolCall.toolName]

  // If no formatter exists, this tool doesn't require approval (shouldn't show UI)
  if (!formatter) {
    return null
  }

  const approvalMessage = formatter(toolCall.parameters)

  return (
    <div class="row g-0 mb-2 chat-message" id={`tool-${toolCall.messageId}-${toolCall.toolCallId}`}>
      <div class="col-10">
        <div class="card border-warning">
          <div class="card-body p-2">
            <div class="d-flex align-items-start">
              <i class="bi bi-exclamation-triangle text-warning me-2 mt-1"></i>
              <div class="flex-grow-1" style="white-space: pre-line;">
                {approvalMessage}
              </div>
              <div class="btn-group btn-group-sm ms-2">
                <button
                  type="button"
                  class="btn btn-success"
                  hx-post={`/characters/${characterId}/chat/${chatId}/tool/${toolCall.toolCallId}/approve`}
                  hx-target="#chat-box-card"
                  hx-swap="outerHTML"
                >
                  <i class="bi bi-check-lg"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  hx-post={`/characters/${characterId}/chat/${chatId}/tool/${toolCall.toolCallId}/reject`}
                  hx-target="#chat-box-card"
                  hx-swap="outerHTML"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
