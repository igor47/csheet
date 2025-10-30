import { createAnthropic } from "@ai-sdk/anthropic"
import { config } from "@src/config"

/**
 * Model to use for chat
 * Using Claude Haiku 3 for cost-effective chat interactions
 */
export const chatModel = "claude-3-haiku-20240307"

/**
 * Get the AI model instance for chat
 * Uses Anthropic's Claude via Vercel AI SDK
 */
export function getChatModel() {
  const client = createAnthropic({
    apiKey: config.anthropicApiKey,
  })
  return client(chatModel)
}
