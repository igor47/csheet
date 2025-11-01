import { createAnthropic } from "@ai-sdk/anthropic"
import { config } from "@src/config"

/**
 * Get the AI model instance for chat
 * Uses Anthropic's Claude via Vercel AI SDK
 */
export function getChatModel() {
  const client = createAnthropic({
    apiKey: config.anthropicApiKey,
  })
  return client(config.aiModelName)
}
