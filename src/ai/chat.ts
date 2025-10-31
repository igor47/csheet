import { type ChatMessage, create as saveChatMessage } from "@src/db/chat_messages"
import { getChatModel } from "@src/lib/ai"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { ComputedChat } from "@src/services/computeChat"
import { TOOL_DEFINITIONS } from "@src/tools"
import { streamText } from "ai"
import type { SQL } from "bun"
import { ulid } from "ulid"
import { buildSystemPrompt } from "./prompts"

export interface ChatResponse {
  message: string
}

type StreamChunk = { type: "text"; text: string }
type StreamHandler = (chunk: StreamChunk) => Promise<void> | void

/**
 * Prepare a chat request by saving user message
 * Returns the chat ID
 */
export async function prepareChatRequest(
  db: SQL,
  character: ComputedCharacter,
  userMessage: string,
  chatId?: string | null
): Promise<{ chatId: string }> {
  // Generate new chat ID if not provided
  const finalChatId = chatId || ulid()

  // Save user message
  await saveChatMessage(db, {
    character_id: character.id,
    chat_id: finalChatId,
    role: "user",
    content: userMessage,
    tool_calls: null,
    tool_results: null,
  })

  return { chatId: finalChatId }
}

/**
 * Execute a chat request by streaming AI response and creating assistant message after completion
 * Returns the ID of the newly created assistant message
 */
export async function executeChatRequest(
  db: SQL,
  character: ComputedCharacter,
  computedChat: ComputedChat,
  onMessage?: StreamHandler
): Promise<string> {
  // Only execute if the chat is ready to stream
  if (!computedChat.shouldStream) {
    throw new Error("Chat is not ready to stream - shouldStream flag is false")
  }

  // Build system prompt with character context
  const systemPrompt = buildSystemPrompt(character)

  const model = getChatModel()

  // Wrap streamText in a Promise that resolves when streaming completes
  const requestBody = {
    model,
    maxOutputTokens: 1024,
    system: systemPrompt,
    messages: computedChat.llmMessages,
    tools: TOOL_DEFINITIONS,
    onError: ({ error }: { error: unknown }) => {
      // Handle errors that occur during streaming (before onFinish)
      logger.error("AI streaming error", error as Error, {
        character_id: character.id,
      })
    },
  }

  // Log the request for debugging
  logger.info("AI request", { requestBody })

  // Start streaming - result is returned synchronously, streaming happens via callbacks
  const messageAggregator: string[] = []
  try {
    const result = streamText(requestBody)
    for await (const data of result.textStream) {
      messageAggregator.push(data)
      const streamChunk: StreamChunk = { type: "text", text: messageAggregator.join("") }
      onMessage?.(streamChunk)
    }

    const toolCalls: ChatMessage["tool_calls"] = {}
    const toolResults: ChatMessage["tool_results"] = {}

    for (const toolCall of await result.toolCalls) {
      const id = toolCall.toolCallId
      toolCalls[id] = {
        name: toolCall.toolName,
        // biome-ignore lint/suspicious/noExplicitAny: Tool input can be any valid JSON
        parameters: toolCall.input as Record<string, any>,
      }
      // Initialize result as null (pending approval)
      toolResults[id] = null
    }

    // Create assistant message with final content after streaming completes
    const assistantMsg = await saveChatMessage(db, {
      character_id: character.id,
      chat_id: computedChat.chatId,
      role: "assistant",
      content: messageAggregator.join(""),
      tool_calls: Object.keys(toolCalls).length > 0 ? toolCalls : null,
      tool_results: Object.keys(toolResults).length > 0 ? toolResults : null,
    })

    return assistantMsg.id
  } catch (err) {
    logger.error("AI stream error", err as Error, {
      chatId: computedChat.chatId,
      character_id: character.id,
    })
    throw err
  }
}
