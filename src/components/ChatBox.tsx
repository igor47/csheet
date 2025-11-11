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

  let inputPlaceholder = "e.g. I spent 50 gold on a sword"
  if (computedChat.unresolvedToolCalls.length > 0) {
    inputPlaceholder = "Accept or decline Reed's edit"
  } else if (computedChat.erroredMessage || computedChat.shouldStream) {
    inputPlaceholder = "Hold on a second..."
  }

  const inputDisabled =
    computedChat.shouldStream ||
    computedChat.unresolvedToolCalls.length > 0 ||
    !!computedChat.erroredMessage

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
          class="container-fluid mb-3 px-0"
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

          {/* Show error retry UI if last message has unretried error */}
          {computedChat.erroredMessage?.error && (
            <StreamErrorRetry
              characterId={character.id}
              chatId={computedChat.chatId}
              error={computedChat.erroredMessage.error}
              consecutiveErrorCount={computedChat.consecutiveErrorCount}
            />
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
                    sse-close="close"
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
              placeholder={inputPlaceholder}
              required
              autocomplete="off"
              disabled={inputDisabled}
            />
            <button
              type="submit"
              class="btn btn-primary"
              {...(computedChat.shouldStream ||
              computedChat.unresolvedToolCalls.length > 0 ||
              computedChat.erroredMessage
                ? { disabled: true }
                : {})}
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

export interface StreamErrorRetryProps {
  characterId: string
  chatId: string
  error: { type: "prep" | "stream"; message: string }
  consecutiveErrorCount: number
}

/**
 * Stream error retry component
 * Shows an error message with a retry button (for stream errors)
 * or a message to start a new chat (for prep errors or too many retries)
 */
export const StreamErrorRetry = ({
  characterId,
  chatId,
  error,
  consecutiveErrorCount,
}: StreamErrorRetryProps) => {
  const isPrep = error.type === "prep"
  const tooManyRetries = consecutiveErrorCount > 3

  // Show "having problems" message for prep errors or too many retries
  const showProblemsMessage = isPrep || tooManyRetries

  return (
    <div class="row g-0 mb-2 chat-message">
      <div class="col-10">
        <div class={`card ${showProblemsMessage ? "border-danger" : "border-warning"}`}>
          <div class="card-body p-3">
            <p class="mb-0">
              <i class="bi bi-exclamation-circle me-2"></i>
              {showProblemsMessage
                ? "Reed is having some problems right now. Ask him again later, or start a new chat."
                : "Reed couldn't hear you. Mind repeating that?"}
            </p>
          </div>
          <div class="card-footer d-flex justify-content-end gap-2 p-2">
            {!showProblemsMessage && (
              <button
                type="button"
                class="btn btn-primary btn-sm"
                hx-post={`/characters/${characterId}/chat/${chatId}/retry`}
                hx-target="#chat-box-card"
                hx-swap="outerHTML"
              >
                <i class="bi bi-volume-up me-1"></i>
                Repeat Louder
              </button>
            )}
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              hx-get={`/characters/${characterId}/chat/new`}
              hx-target="#chat-box-card"
              hx-swap="outerHTML"
            >
              <i class="bi bi-plus-lg me-1"></i>
              New Chat
            </button>
          </div>
        </div>
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
          <div class="card-header bg-warning text-dark py-2">
            <h6 class="mb-0">
              <i class="bi bi-question-circle me-2"></i>
              Accept Reed's Action
            </h6>
          </div>
          <div class="card-body p-3">{approvalMessage}</div>
          <div class="card-footer d-flex justify-content-end gap-2 p-2">
            <button
              type="button"
              class="btn btn-success btn-sm"
              hx-post={`/characters/${characterId}/chat/${chatId}/tool/${toolCall.toolCallId}/approve`}
              hx-target="#chat-box-card"
              hx-swap="outerHTML"
            >
              <i class="bi bi-check-lg me-1"></i>
              Confirm
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm"
              hx-post={`/characters/${characterId}/chat/${chatId}/tool/${toolCall.toolCallId}/reject`}
              hx-target="#chat-box-card"
              hx-swap="outerHTML"
            >
              <i class="bi bi-x-lg me-1"></i>
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
