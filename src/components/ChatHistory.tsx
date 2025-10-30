import type { ChatPreview } from "@src/db/chat_messages"
import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface ChatHistoryProps {
  character: ComputedCharacter
  chats: ChatPreview[]
}

export const ChatHistory = ({ character, chats }: ChatHistoryProps) => {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return "Today"
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const truncateMessage = (message: string, maxLength = 100) => {
    if (message.length <= maxLength) {
      return message
    }
    return `${message.substring(0, maxLength)}...`
  }

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="bi bi-clock-history me-2"></i>
          Chat History
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {chats.length === 0 ? (
          <div class="text-center py-4">
            <p class="text-muted">No previous conversations found.</p>
            <p class="text-muted">
              <small>Start a new conversation by sending a message!</small>
            </p>
          </div>
        ) : (
          <div class="list-group">
            {chats.map((chat) => (
              <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-start">
                <div
                  class="flex-grow-1 me-2"
                  style="cursor: pointer;"
                  hx-get={`/characters/${character.id}/chat/${chat.chat_id}/load`}
                  hx-target="#chat-box-card"
                  hx-swap="outerHTML"
                  data-bs-dismiss="modal"
                >
                  <p class="mb-1">{truncateMessage(chat.last_message)}</p>
                  <small class="text-muted">
                    {formatDate(chat.last_message_at)} • {chat.message_count}{" "}
                    {chat.message_count === 1 ? "message" : "messages"}
                  </small>
                </div>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  hx-delete={`/characters/${character.id}/chat/${chat.chat_id}`}
                  hx-target="#editModalContent"
                  hx-confirm="Are you sure you want to delete this conversation? This cannot be undone."
                  onclick="event.preventDefault(); event.stopPropagation();"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-primary"
          hx-get={`/characters/${character.id}/chat/new`}
          hx-target="#chat-box-card"
          hx-swap="outerHTML"
          data-bs-dismiss="modal"
        >
          <i class="bi bi-plus-lg me-1"></i>
          New Chat
        </button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </>
  )
}
