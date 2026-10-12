import { type ChatMessage, create as saveChatMessage, type Usage } from "@src/db/chat_messages"
import { getChatModel } from "@src/lib/ai"
import { ulid } from "@src/lib/ids"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { ComputedChat } from "@src/services/computeChat"
import { advanceToolCalls } from "@src/services/toolExecution"
import { TOOL_DEFINITIONS } from "@src/tools"
import { streamText } from "ai"
import type { SQL } from "bun"
import { buildSystemPrompt } from "./prompts"

export interface ChatResponse {
  message: string
}

type StreamChunk = { type: "text"; text: string }
type ChatModel = ReturnType<typeof getChatModel>
type StreamHandler = (chunk: StreamChunk) => Promise<void> | void

/**
 * Overrides for the model request; the evals use these to compare models and settings
 */
export interface ChatRequestOptions {
  model?: ChatModel
  maxOutputTokens?: number
}

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

  // save system message if this is a new chat
  if (!chatId) {
    const systemPrompt = buildSystemPrompt(character)
    await saveChatMessage(db, {
      character_id: character.id,
      chat_id: finalChatId,
      role: "system",
      content: systemPrompt,
      tool_calls: null,
      tool_results: null,
      error: null,
      usage: null,
    })
  }

  // Save user message
  await saveChatMessage(db, {
    character_id: character.id,
    chat_id: finalChatId,
    role: "user",
    content: userMessage,
    tool_calls: null,
    tool_results: null,
    error: null,
    usage: null,
  })

  return { chatId: finalChatId }
}

/**
 * Execute a chat request by streaming AI response and creating assistant message
 * Always returns the ID of the newly created assistant message (with content or error)
 */
export async function executeChatRequest(
  db: SQL,
  character: ComputedCharacter,
  computedChat: ComputedChat,
  onMessage?: StreamHandler,
  options: ChatRequestOptions = {}
): Promise<string> {
  // Only execute if the chat is ready to stream
  if (!computedChat.shouldStream) {
    throw new Error("Chat is not ready to stream - shouldStream flag is false")
  }

  // First try-catch: Prep phase (building request)
  let requestBody: Parameters<typeof streamText>[0]
  let model: ChatModel
  try {
    model = options.model ?? getChatModel()
    requestBody = {
      model,
      maxOutputTokens: options.maxOutputTokens ?? 1024,
      instructions: computedChat.llmInstructions,
      messages: computedChat.llmMessages,
      tools: TOOL_DEFINITIONS,
      onError: ({ error }: { error: unknown }) => {
        logger.error("AI streaming error", error as Error, {
          character_id: character.id,
        })
      },
    }
  } catch (err) {
    logger.error("AI prep error", err as Error, {
      chatId: computedChat.chatId,
      character_id: character.id,
    })

    // Create assistant message with prep error
    const assistantMsg = await saveChatMessage(db, {
      character_id: character.id,
      chat_id: computedChat.chatId,
      role: "assistant",
      content: "",
      tool_calls: null,
      tool_results: null,
      error: {
        type: "prep",
        message: err instanceof Error ? err.message : "Unknown prep error",
      },
      usage: null,
    })

    return assistantMsg.id
  }

  // Second try-catch: Streaming phase
  const messageAggregator: string[] = []
  try {
    const result = streamText(requestBody)
    for await (const data of result.textStream) {
      messageAggregator.push(data)
      const streamChunk: StreamChunk = { type: "text", text: messageAggregator.join("") }
      onMessage?.(streamChunk)
    }

    const toolCalls: NonNullable<ChatMessage["tool_calls"]> = []
    const toolResults: ChatMessage["tool_results"] = {}

    for (const toolCall of await result.toolCalls) {
      const id = toolCall.toolCallId
      toolCalls.push({
        id,
        name: toolCall.toolName,
        // biome-ignore lint/suspicious/noExplicitAny: Tool input can be any valid JSON
        parameters: toolCall.input as Record<string, any>,
      })
      // Initialize result as null (pending approval)
      toolResults[id] = null
    }

    // Capture usage data from AI SDK
    const usageData = await result.usage
    const usage: Usage | null = usageData
      ? {
          provider: model.provider,
          modelId: model.modelId,
          inputTokens: usageData.inputTokens || 0,
          outputTokens: usageData.outputTokens || 0,
          cachedInputTokens: usageData.inputTokenDetails.cacheReadTokens,
          cacheWriteInputTokens: usageData.inputTokenDetails.cacheWriteTokens,
          totalTokens: usageData.totalTokens || 0,
        }
      : null

    // Create assistant message with final content after streaming completes
    const assistantMsg = await saveChatMessage(db, {
      character_id: character.id,
      chat_id: computedChat.chatId,
      role: "assistant",
      content: messageAggregator.join(""),
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
      tool_results: Object.keys(toolResults).length > 0 ? toolResults : null,
      error: null,
      usage,
    })

    // Run read-only tools and validate the first one that needs approval, in order
    await advanceToolCalls(db, character, assistantMsg.id)

    return assistantMsg.id
  } catch (err) {
    logger.error("AI stream error", err as Error, {
      chatId: computedChat.chatId,
      character_id: character.id,
    })

    // Create assistant message with stream error
    const assistantMsg = await saveChatMessage(db, {
      character_id: character.id,
      chat_id: computedChat.chatId,
      role: "assistant",
      content: "",
      tool_calls: null,
      tool_results: null,
      usage: null,
      error: {
        type: "stream",
        message: err instanceof Error ? err.message : "Unknown stream error",
      },
    })

    return assistantMsg.id
  }
}
