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
    if (toolRegistration?.formatApprovalMessage) {
      continue
    }

    // Execute the tool immediately
    await executeTool(db, character, {
      messageId: assistantMsg.id,
      toolCallId,
      toolName: call.name,
      parameters: call.parameters,
    })
  }
}

/**
 * Auto-validate tool parameters for tools that require approval
 * Runs validation checks before user sees approval UI, allowing LLM to self-correct
 */
async function validateApprovalTools(
  db: SQL,
  character: ComputedCharacter,
  assistantMsg: ChatMessage
): Promise<void> {
  // Check if message has tool calls
  if (!assistantMsg.tool_calls || !assistantMsg.tool_results) {
    return
  }

  // Find tools that require approval and haven't been executed yet
  for (const [toolCallId, call] of Object.entries(assistantMsg.tool_calls)) {
    // Skip if already executed
    if (assistantMsg.tool_results[toolCallId]) {
      continue
    }

    // read-only tools will be executed automatically anyway
    const toolRegistration = TOOLS.find((t) => t.name === call.name)
    if (!toolRegistration?.formatApprovalMessage) {
      continue
    }

    // Execute the tool in validation mode
    await executeTool(
      db,
      character,
      {
        messageId: assistantMsg.id,
        toolCallId,
        toolName: call.name,
        parameters: call.parameters,
      },
      true // isCheck = true for validation mode
    )
  }
}

/**
 * Execute a chat request by streaming AI response and creating assistant message
 * Always returns the ID of the newly created assistant message (with content or error)
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

  // First try-catch: Prep phase (building request)
  let requestBody: Parameters<typeof streamText>[0]
  try {
    const model = getChatModel()
    requestBody = {
      model,
      maxOutputTokens: 1024,
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
      error: null,
    })

    // Auto-execute any read-only tools immediately
    await autoExecuteReadOnlyTools(db, character, assistantMsg)

    // Validate parameters for tools that require approval
    await validateApprovalTools(db, character, assistantMsg)

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
      error: {
        type: "stream",
        message: err instanceof Error ? err.message : "Unknown stream error",
      },
    })

    return assistantMsg.id
  }
}
