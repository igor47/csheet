import type { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs"
import {
  findByCharacterId as getChatHistory,
  create as saveChatMessage,
} from "@src/db/chat_messages"
import { chatModel, getAnthropic } from "@src/lib/anthropic"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { SQL } from "bun"
import { buildSystemPrompt } from "./prompts"
import { updateCoinsTool } from "./tools/updateCoins"

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

/**
 * Process a user message and get AI response
 */
export async function processUserMessage(
  db: SQL,
  character: ComputedCharacter,
  userMessage: string
): Promise<ChatResponse> {
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

  // Load chat history (excluding the message we just saved)
  const history = await getChatHistory(db, character.id, 20)
  const previousMessages = history.slice(0, -1)

  // Format previous messages for Anthropic
  const messages: MessageParam[] = previousMessages.map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
  }))

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage,
  })

  // Get Anthropic client and call API
  const anthropic = await getAnthropic()

  const requestBody = {
    model: chatModel,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools: [updateCoinsTool],
  }

  // Log the request for debugging
  console.log("Anthropic request:", JSON.stringify(requestBody, null, 2))

  const response = await anthropic.messages.create(requestBody)

  // Log the response for debugging
  console.log("Anthropic response:", JSON.stringify(response, null, 2))

  // Check if there are tool use blocks in the response
  const toolUseBlock = response.content.find((block) => block.type === "tool_use")

  if (toolUseBlock && toolUseBlock.type === "tool_use") {
    // Extract text content (if any) before the tool use
    const textBlocks = response.content.filter((block) => block.type === "text")
    const messageText =
      textBlocks.length > 0
        ? textBlocks.map((block) => (block.type === "text" ? block.text : "")).join(" ")
        : "I'd like to help you with that."

    // Save assistant message with tool call
    await saveChatMessage(db, {
      character_id: character.id,
      role: "assistant",
      content: messageText,
      tool_calls: {
        tool_name: toolUseBlock.name,
        // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
        parameters: toolUseBlock.input as Record<string, any>,
      },
      tool_results: null,
    })

    return {
      message: messageText,
      tool_call: {
        tool_name: toolUseBlock.name,
        // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
        parameters: toolUseBlock.input as Record<string, any>,
      },
    }
  }

  // No tool call, just a text response
  const textContent = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join(" ")

  await saveChatMessage(db, {
    character_id: character.id,
    role: "assistant",
    content: textContent,
    tool_calls: null,
    tool_results: null,
  })

  return {
    message: textContent,
  }
}

/**
 * Save tool execution result to chat history
 */
export async function saveToolResult(
  db: SQL,
  characterId: string,
  _toolName: string,
  result: { success: boolean; message?: string; error?: string }
): Promise<void> {
  // Find the last assistant message with this tool call
  const history = await getChatHistory(db, characterId, 5)
  const lastMessage = history[history.length - 1]

  if (lastMessage && lastMessage.role === "assistant" && lastMessage.tool_calls) {
    // Update the message with tool results
    await db`
      UPDATE chat_messages
      SET tool_results = ${JSON.stringify(result)}
      WHERE id = ${lastMessage.id}
    `
  }
}
