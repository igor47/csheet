import {
  type CreateChatMessage,
  findByCharacterId as getChatHistory,
  create as saveChatMessage,
} from "@src/db/chat_messages"
import { getChatModel } from "@src/lib/ai"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { updateCoinsTool, updateCoinsToolName } from "@src/services/updateCoins"
import type {
  AssistantModelMessage,
  StreamTextOnChunkCallback,
  StreamTextOnFinishCallback,
  SystemModelMessage,
  UserModelMessage,
} from "ai"
import { streamText } from "ai"
import type { SQL } from "bun"
import { buildSystemPrompt } from "./prompts"

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

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
}

type StreamChunk = { type: "text"; text: string } | ({ type: "tool" } & ToolCall)
type StreamHandler = (chunk: StreamChunk) => Promise<void> | void

/**
 * Process a user message and get AI response
 * Returns a Promise that resolves when streaming is complete and message is saved to DB
 */
export async function processUserMessage(
  db: SQL,
  character: ComputedCharacter,
  userMessage: string,
  onMessage?: StreamHandler
): Promise<void> {
  // Save user message to database
  await saveChatMessage(db, {
    character_id: character.id,
    role: "user",
    content: userMessage,
    tool_calls: null,
    tool_results: null,
  })

  // Build system prompt with character context
  const systemPrompt = buildSystemPrompt(character)

  // Load chat history (including the message we just saved)
  const history = await getChatHistory(db, character.id, 10)

  // Format previous messages for Vercel AI SDK
  const messages = history.map((msg) => {
    if (msg.role === "assistant") {
      const assistantMsg: AssistantModelMessage = {
        role: "assistant",
        content: msg.content,
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
  return new Promise<void>((resolve, reject) => {
    const requestBody = {
      model,
      maxOutputTokens: 1024,
      system: systemPrompt,
      messages,
      tools: ALL_TOOLS,
      onChunk: makeOnChunk(onMessage),
      onFinish: makeOnFinish(db, character, resolve, reject),
      onError: ({ error }: { error: unknown }) => {
        // Handle errors that occur during streaming (before onFinish)
        logger.error("AI streaming error", error as Error, {
          character_id: character.id,
        })
        reject(error as Error)
      },
    }

    // Log the request for debugging
    logger.info("AI request", { requestBody })
    streamText(requestBody)
  })
}

function makeOnFinish(
  db: SQL,
  character: ComputedCharacter,
  resolve: () => void,
  reject: (error: Error) => void
): StreamTextOnFinishCallback<typeof ALL_TOOLS> {
  const onFinish: StreamTextOnFinishCallback<typeof ALL_TOOLS> = async (result) => {
    try {
      // Log the finish result for debugging
      logger.info("AI stream finished", { result })

      const msg: CreateChatMessage = {
        role: "assistant",
        character_id: character.id,
        content: result.text,
        tool_calls: {},
        tool_results: {},
      }

      for (const toolCall of result.toolCalls) {
        msg.tool_calls![toolCall.toolName] = toolCall.input
      }

      await saveChatMessage(db, msg)

      // Resolve the promise only after successful DB save
      resolve()
    } catch (error) {
      logger.error("Error saving AI response to database", error as Error, {
        character_id: character.id,
      })
      reject(error as Error)
    }
  }
  return onFinish
}

function makeOnChunk(onMessage?: StreamHandler): StreamTextOnChunkCallback<typeof ALL_TOOLS> {
  const messageAggregator: string[] = []

  const wrappedOnChunk: StreamTextOnChunkCallback<typeof ALL_TOOLS> = async ({ chunk }) => {
    let streamChunk: StreamChunk | null = null
    if (chunk.type === "text-delta") {
      messageAggregator.push(chunk.text)
      streamChunk = { type: "text", text: messageAggregator.join("") }
    } else if (chunk.type === "tool-call") {
      streamChunk = {
        type: "tool",
        tool_name: chunk.toolName,
        parameters: chunk.input as ToolCall["parameters"],
      }
    }

    // call onChunk callback
    logger.info("AI stream chunk", { streamChunk })
    onMessage && streamChunk && onMessage(streamChunk)
  }

  return wrappedOnChunk
}
