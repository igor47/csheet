import {
  type ChatMessage,
  findByChatId as getChatHistory,
  create as saveChatMessage,
} from "@src/db/chat_messages"
import { getChatModel } from "@src/lib/ai"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import {
  executeUpdateCoins,
  type ToolExecutorResult,
  updateCoinsTool,
  updateCoinsToolName,
} from "@src/services/updateCoins"
import {
  executeUpdateHitPoints,
  updateHitPointsTool,
  updateHitPointsToolName,
} from "@src/services/updateHitPoints"
import type { AssistantModelMessage, SystemModelMessage, UserModelMessage } from "ai"
import { streamText } from "ai"
import type { SQL } from "bun"
import { ulid } from "ulid"
import { buildSystemPrompt } from "./prompts"

export interface ToolCall {
  tool_name: string
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
}

export interface ChatResponse {
  message: string
  tool_call?: ToolCall
}

const ALL_TOOLS = {
  [updateCoinsToolName]: updateCoinsTool,
  [updateHitPointsToolName]: updateHitPointsTool,
}

type ToolExecutor = (
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
) => Promise<ToolExecutorResult>

export const ALL_TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  [updateCoinsToolName]: executeUpdateCoins,
  [updateHitPointsToolName]: executeUpdateHitPoints,
}

type StreamChunk = { type: "text"; text: string } | ({ type: "tool" } & ToolCall)
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
  chatId: string,
  onMessage?: StreamHandler
): Promise<string> {
  // Build system prompt with character context
  const systemPrompt = buildSystemPrompt(character)

  // Load full chat history for this chat
  const history = await getChatHistory(db, chatId, 50)

  // Format previous messages for Vercel AI SDK
  const messages = history.map((msg) => {
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

  const model = getChatModel()

  // Wrap streamText in a Promise that resolves when streaming completes
  const requestBody = {
    model,
    maxOutputTokens: 1024,
    system: systemPrompt,
    messages,
    tools: ALL_TOOLS,
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
    for (const toolCall of await result.toolCalls) {
      const streamChunk: StreamChunk = {
        type: "tool",
        tool_name: toolCall.toolName,
        parameters: toolCall.input as ToolCall["parameters"],
      }
      onMessage && Object.keys(toolCalls).length === 0 && onMessage(streamChunk)

      toolCalls[toolCall.toolName] = toolCall.input
    }

    // Create assistant message with final content after streaming completes
    const assistantMsg = await saveChatMessage(db, {
      character_id: character.id,
      chat_id: chatId,
      role: "assistant",
      content: messageAggregator.join(""),
      tool_calls: Object.keys(toolCalls).length > 0 ? toolCalls : null,
      tool_results: null,
    })

    return assistantMsg.id
  } catch (err) {
    logger.error("AI stream error", err as Error, { chatId, character_id: character.id })
    throw err
  }
}
