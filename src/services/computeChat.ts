import type { ChatMessage as DbChatMessage } from "@src/db/chat_messages"
import { findSystemMessage, findByChatId as getChatHistory } from "@src/db/chat_messages"
import { isReadOnly } from "@src/tools"
import type {
  JSONValue,
  ModelMessage,
  SystemModelMessage,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from "ai"
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
  llmInstructions?: SystemModelMessage
  llmMessages: ModelMessage[]
  shouldStream: boolean
  unresolvedToolCalls: UnresolvedToolCall[]
  erroredMessage?: DbChatMessage
  consecutiveErrorCount: number
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
 * Excludes messages with errors (failed streaming/prep attempts)
 */
function toLlmMessages(dbMessages: DbChatMessage[]): ModelMessage[] {
  const messages: ModelMessage[] = []

  for (const msg of dbMessages) {
    // Skip messages that have errors
    if (msg.error !== null) {
      continue
    }
    if (msg.role === "assistant") {
      const content: (TextPart | ToolCallPart)[] = []
      if (msg.content) {
        content.push({ type: "text", text: msg.content })
      }

      for (const call of msg.tool_calls || []) {
        content.push({
          type: "tool-call" as const,
          toolCallId: call.id,
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

        for (const call of msg.tool_calls || []) {
          const result = msg.tool_results?.[call.id]
          // hasAllToolResults guarantees this; the API would reject a tool call without a result
          if (!result) throw new Error(`Missing result for tool call ${call.id}`)

          // compute the output
          let output: ToolResultPart["output"]
          if (result.status === "rejected") {
            output = {
              type: "error-text",
              value: "This tool call was rejected (not approved) by the user.",
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
            toolCallId: call.id,
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
      // the system prompt is sent separately, as instructions
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

  for (const call of msg.tool_calls) {
    if (!msg.tool_results[call.id]) {
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
 * 3. If last message is assistant with error and no retryAt, don't stream
 * 4. If last message is assistant with error.retryAt set, stream (retry initiated)
 */
function shouldInitiateStream(dbMessages: DbChatMessage[]): boolean {
  if (dbMessages.length === 0) return false

  const lastMessage = dbMessages[dbMessages.length - 1]

  // If last message is assistant with unretried error, don't stream
  if (lastMessage?.role === "assistant" && lastMessage.error && !lastMessage.error.retryAt) {
    return false
  }

  // last message is from the user, so we can ask LLM to respond
  if (lastMessage?.role === "user") return true

  // If assistant message has error.retryAt set, stream (retry initiated)
  if (lastMessage?.role === "assistant" && lastMessage.error?.retryAt) {
    return true
  }

  // Check if there are any unresolved tool calls
  if (lastMessage?.role === "assistant" && hasAllToolResults(lastMessage)) return true

  return false
}

/**
 * Find unresolved tool calls (tool calls where tool_results[id] is null)
 * Only returns tools that require approval - read-only tools are filtered out
 * Returned in the order the model made them; they must be resolved in that order
 */
function findUnresolvedToolCalls(dbMessages: DbChatMessage[]): UnresolvedToolCall[] {
  const unresolved: UnresolvedToolCall[] = []

  for (const msg of dbMessages) {
    if (!msg) continue

    // Check if this is an assistant message with tool calls
    if (msg.role === "assistant" && msg.tool_calls && msg.tool_results) {
      // Find IDs where tool_results is null
      for (const call of msg.tool_calls) {
        if (!msg.tool_results[call.id]) {
          // Only include tools that require approval
          if (!isReadOnly(call.name)) {
            unresolved.push({
              messageId: msg.id,
              toolCallId: call.id,
              toolName: call.name,
              parameters: call.parameters,
            })
          }
        }
      }
    }
  }

  return unresolved
}

/**
 * Find the errored message if last message has unretried error
 */
function findErroredMessage(dbMessages: DbChatMessage[]): DbChatMessage | undefined {
  if (dbMessages.length === 0) return undefined

  const lastMessage = dbMessages[dbMessages.length - 1]

  // Check if last message is assistant with unretried error
  if (lastMessage?.role === "assistant" && lastMessage.error && !lastMessage.error.retryAt) {
    return lastMessage
  }

  return undefined
}

/**
 * Count consecutive errored assistant messages from the end of the chat
 */
function countConsecutiveErrors(dbMessages: DbChatMessage[]): number {
  let count = 0

  // Count backwards from the end
  for (let i = dbMessages.length - 1; i >= 0; i--) {
    const msg = dbMessages[i]!

    // Stop if we hit a non-assistant message
    if (msg.role !== "assistant") break

    // Count if this assistant message has an error
    if (msg.error) {
      count++
    } else {
      // Stop if we hit a successful assistant message
      break
    }
  }

  return count
}

/**
 * The chat's system prompt, marked for prompt caching
 */
function toLlmInstructions(systemMsg: DbChatMessage | null): SystemModelMessage | undefined {
  if (!systemMsg) return undefined

  return {
    role: "system",
    content: systemMsg.content,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  }
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
    llmInstructions: toLlmInstructions(await findSystemMessage(db, chatId)),
    llmMessages: toLlmMessages(dbMessages),
    shouldStream: shouldInitiateStream(dbMessages),
    unresolvedToolCalls: findUnresolvedToolCalls(dbMessages),
    erroredMessage: findErroredMessage(dbMessages),
    consecutiveErrorCount: countConsecutiveErrors(dbMessages),
  }
}
