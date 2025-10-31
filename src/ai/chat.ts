import { type ChatMessage, create as saveChatMessage } from "@src/db/chat_messages"
import { getChatModel } from "@src/lib/ai"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { ComputedChat } from "@src/services/computeChat"
import { executeTool } from "@src/services/toolExecution"
import { TOOL_DEFINITIONS, TOOLS } from "@src/tools"
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
 * Auto-execute read-only tools in a newly created assistant message
 * Finds tool calls that don't require approval and executes them immediately
 */
async function autoExecuteReadOnlyTools(
  db: SQL,
  character: ComputedCharacter,
  assistantMsg: ChatMessage
): Promise<void> {
  // Check if message has tool calls
  if (!assistantMsg.tool_calls || !assistantMsg.tool_results) {
    return
  }

  // Find read-only tools that haven't been executed yet
  for (const [toolCallId, call] of Object.entries(assistantMsg.tool_calls)) {
    // Skip if already executed
    if (assistantMsg.tool_results[toolCallId]) {
      continue
    }

    // Check if this tool is read-only (doesn't require approval)
    const toolRegistration = TOOLS.find((t) => t.name === call.name)
    if (toolRegistration && toolRegistration.requiresApproval === false) {
      try {
        // Execute the tool immediately
        await executeTool(db, character, {
          messageId: assistantMsg.id,
          toolCallId,
          toolName: call.name,
          parameters: call.parameters,
        })
      } catch (error) {
        // Log errors but don't throw - tool execution is best-effort
        logger.error("Auto-execution of read-only tool failed", error as Error, {
          character_id: character.id,
          message_id: assistantMsg.id,
          tool_name: call.name,
          tool_call_id: toolCallId,
        })
      }
    }
  }
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

    // Auto-execute any read-only tools immediately
    await autoExecuteReadOnlyTools(db, character, assistantMsg)

    return assistantMsg.id
  } catch (err) {
    logger.error("AI stream error", err as Error, {
      chatId: computedChat.chatId,
      character_id: character.id,
    })
    throw err
  }
}
