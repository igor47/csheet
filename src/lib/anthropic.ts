import Anthropic from "@anthropic-ai/sdk"
import { config } from "@src/config"
import { logger } from "./logger"

/**
 * Model to use for chat
 * Using Claude Haiku 3 for cost-effective chat interactions
 */
export const chatModel = "claude-3-haiku-20240307"

/**
 * Cached Anthropic client instance
 */
let cachedClient: Anthropic | null = null
let modelsValidated = false

/**
 * Get or create Anthropic client
 * Validates that the configured model is available on first call
 */
export async function getAnthropic(): Promise<Anthropic> {
  // Return cached client if already initialized
  if (cachedClient && modelsValidated) {
    return cachedClient
  }

  // Initialize client if needed
  if (!cachedClient) {
    cachedClient = new Anthropic({
      apiKey: config.anthropicApiKey,
    })
  }

  // Validate model availability on first call
  if (!modelsValidated) {
    try {
      const modelsList = await cachedClient.models.list()
      const availableModels = modelsList.data.map((m) => m.id)

      logger.info("Available Anthropic models:", { models: availableModels })

      if (!availableModels.includes(chatModel)) {
        throw new Error(
          `Configured model "${chatModel}" is not available. Available models: ${availableModels.join(", ")}`
        )
      }

      logger.info(`Model "${chatModel}" is available and validated`)
      modelsValidated = true
    } catch (error) {
      logger.error("Failed to validate Anthropic model", error as Error)
      throw error
    }
  }

  return cachedClient
}
