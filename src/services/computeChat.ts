import type { ChatMessage as DbChatMessage } from "@src/db/chat_messages"
import { findByChatId as getChatHistory } from "@src/db/chat_messages"
import type { JSONValue, ModelMessage, TextPart, ToolCallPart, ToolResultPart } from "ai"
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
  toolCallId: string
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
  llmMessages: ModelMessage[]
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
 * Includes tool messages for resolved tool calls
 */
function toLlmMessages(dbMessages: DbChatMessage[]): ModelMessage[] {
  const messages: ModelMessage[] = []

  for (const msg of dbMessages) {
    if (msg.role === "assistant") {
      const content: (TextPart | ToolCallPart)[] = []
      if (msg.content) {
        content.push({ type: "text", text: msg.content })
      }

      for (const [id, call] of Object.entries(msg.tool_calls || {})) {
        content.push({
          type: "tool-call" as const,
          toolCallId: id,
          toolName: call.name,
          input: call.parameters,
        })
      }

      messages.push({
        role: "assistant",
        content,
      })

      if (hasAllToolResults(msg)) {
        const content: ToolResultPart[] = []

        for (const [id, call] of Object.entries(msg.tool_calls || {})) {
          // must be present due to hasAllToolResults check
          const result = msg.tool_results?.[id]!

          // compute the output
          let output: ToolResultPart["output"]
          if (result.status === "rejected") {
            output = {
              type: "error-text",
              value: "User declined this action",
            }
          } else if (result.status === "failed") {
            output = {
              type: "error-text",
              value: result.error || "Failed with unknown error",
            }
          } else {
            if (result.data) {
              output = {
                type: "json",
                value: { ...result.data, success: true } as JSONValue,
              }
            } else {
              output = {
                type: "text",
                value: "Completed successfully",
              }
            }
          }

          // add the tool result to the message
          content.push({
            type: "tool-result" as const,
            toolCallId: id,
            toolName: call.name,
            output,
          })
        }

        // add message to messages
        messages.push({
          role: "tool" as const,
          content,
        })
      }
    } else if (msg.role === "system") {
      messages.push({
        role: "system",
        content: msg.content,
      })
    } else {
      messages.push({
        role: "user" as const,
        content: msg.content,
      })
    }
  }

  return messages
}

/**
 * If a message has tool calls, check if all have results
 */
function hasAllToolResults(msg: DbChatMessage) {
  if (!msg.tool_calls) return false
  if (!msg.tool_results) return false

  for (const id of Object.keys(msg.tool_calls)) {
    if (!msg.tool_results[id]) {
      return false
    }
  }

  return true
}

/**
 * Detect if streaming should be initiated
 * Requirements:
 * 1. Last message is from user
 * 2. No unresolved tool calls in any message
 */
function shouldInitiateStream(dbMessages: DbChatMessage[]): boolean {
  if (dbMessages.length === 0) return false

  // last message is from the user, so we can ask LLM to respond
  const lastMessage = dbMessages[dbMessages.length - 1]
  if (lastMessage?.role === "user") return true

  // Check if there are any unresolved tool calls
  if (lastMessage?.role === "assistant" && hasAllToolResults(lastMessage)) return true

  return false
}

/**
 * Find unresolved tool calls (tool calls where tool_results[id] is null)
 */
function findUnresolvedToolCalls(dbMessages: DbChatMessage[]): UnresolvedToolCall[] {
  const unresolved: UnresolvedToolCall[] = []

  for (const msg of dbMessages) {
    if (!msg) continue

    // Check if this is an assistant message with tool calls
    if (msg.role === "assistant" && msg.tool_calls && msg.tool_results) {
      // Find IDs where tool_results is null
      for (const [id, call] of Object.entries(msg.tool_calls)) {
        if (!msg.tool_results[id]) {
          unresolved.push({
            messageId: msg.id,
            toolCallId: id,
            toolName: call.name,
            parameters: call.parameters,
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
