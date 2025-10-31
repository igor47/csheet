import type { ChatMessage as DbChatMessage } from "@src/db/chat_messages"
import { findByChatId as getChatHistory } from "@src/db/chat_messages"
import type { AssistantModelMessage, CoreMessage, SystemModelMessage, UserModelMessage } from "ai"
import type { SQL } from "bun"

/**
 * UI representation of a chat message for ChatBox component
 */
export interface UiChatMessage {
  id: string
  chatRole: "user" | "assistant"
  content: string
}

/**
 * Represents an unresolved tool call awaiting user confirmation
 */
export interface UnresolvedToolCall {
  messageId: string
  toolName: string
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
}

/**
 * Computed chat data structure containing processed messages and metadata
 */
export interface ComputedChat {
  chatId: string
  messages: UiChatMessage[]
  llmMessages: CoreMessage[]
  shouldStream: boolean
  unresolvedToolCalls: UnresolvedToolCall[]
}

/**
 * Convert database messages to UI messages for ChatBox display
 */
function toUiMessages(dbMessages: DbChatMessage[]): UiChatMessage[] {
  return dbMessages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      id: msg.id,
      chatRole: msg.role as "user" | "assistant",
      content: msg.content,
    }))
}

/**
 * Convert database messages to LLM-compatible message format
 */
function toLlmMessages(dbMessages: DbChatMessage[]): CoreMessage[] {
  return dbMessages.map((msg) => {
    if (msg.role === "assistant") {
      const toolsCalled = msg.tool_calls ? Object.keys(msg.tool_calls).join(",") : null
      const assistantMsg: AssistantModelMessage = {
        role: "assistant",
        content:
          msg.content || msg.tool_calls
            ? `requested tool calls to ${toolsCalled}`
            : "<empty response>",
      }
      return assistantMsg
    } else if (msg.role === "system") {
      const systemMsg: SystemModelMessage = {
        role: "system",
        content: msg.content,
      }
      return systemMsg
    } else {
      const userMsg: UserModelMessage = {
        role: "user" as const,
        content: msg.content,
      }
      return userMsg
    }
  })
}

/**
 * Detect if streaming should be initiated (last message is user without assistant response)
 */
function shouldInitiateStream(dbMessages: DbChatMessage[]): boolean {
  if (dbMessages.length === 0) return false
  const lastMessage = dbMessages[dbMessages.length - 1]
  return lastMessage?.role === "user"
}

/**
 * Find unresolved tool calls (assistant messages with tool_calls but no subsequent user response)
 */
function findUnresolvedToolCalls(dbMessages: DbChatMessage[]): UnresolvedToolCall[] {
  const unresolved: UnresolvedToolCall[] = []

  for (let i = 0; i < dbMessages.length; i++) {
    const msg = dbMessages[i]
    if (!msg) continue

    // Check if this is an assistant message with tool calls
    if (msg.role === "assistant" && msg.tool_calls && Object.keys(msg.tool_calls).length > 0) {
      // Check if there's a subsequent user message (which would mean it's been resolved)
      const hasSubsequentUserMessage = dbMessages
        .slice(i + 1)
        .some((m) => m.role === "user" || m.role === "assistant")

      if (!hasSubsequentUserMessage) {
        // This tool call is unresolved - extract all tool calls from this message
        for (const [toolName, parameters] of Object.entries(msg.tool_calls)) {
          unresolved.push({
            messageId: msg.id,
            toolName,
            // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
            parameters: parameters as Record<string, any>,
          })
        }
      }
    }
  }

  return unresolved
}

/**
 * Compute chat data structure from database messages
 * Transforms raw database messages into a format suitable for UI and LLM consumption
 */
export async function computeChat(db: SQL, chatId: string): Promise<ComputedChat> {
  // Load chat history from database (last 50 messages in chronological order)
  const dbMessages = await getChatHistory(db, chatId, 50)

  return {
    chatId,
    messages: toUiMessages(dbMessages),
    llmMessages: toLlmMessages(dbMessages),
    shouldStream: shouldInitiateStream(dbMessages),
    unresolvedToolCalls: findUnresolvedToolCalls(dbMessages),
  }
}
