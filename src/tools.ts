import type { Tool } from "ai"
import type { SQL } from "bun"
import type { ComputedCharacter } from "./services/computeCharacter"
import {
  executeUpdateCoins,
  formatUpdateCoinsApproval,
  updateCoinsTool,
  updateCoinsToolName,
} from "./services/updateCoins"
import {
  executeUpdateHitPoints,
  formatUpdateHitPointsApproval,
  updateHitPointsTool,
  updateHitPointsToolName,
} from "./services/updateHitPoints"

/**
 * Result type for tool executors
 */
export interface ToolExecutorResult {
  success: boolean
  errors?: Record<string, string>
}

/**
 * Function signature for tool executors
 */
export type ToolExecutor = (
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
) => Promise<ToolExecutorResult>

/**
 * Function signature for tool approval message formatters
 */
export type ToolFormatter = (
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
) => string

/**
 * Complete tool registration containing all components
 */
export interface ToolRegistration {
  /** Unique tool name (e.g., "update_coins") */
  name: string
  /** Vercel AI SDK tool definition for the LLM */
  tool: Tool
  /** Executor function that performs the tool action */
  executor: ToolExecutor
  /** Formatter function that generates user-friendly approval messages */
  formatApprovalMessage: ToolFormatter
}

/**
 * Centralized registry of all available tools
 * Add new tools here to make them available throughout the application
 */
export const TOOLS: ToolRegistration[] = [
  {
    name: updateCoinsToolName,
    tool: updateCoinsTool,
    executor: executeUpdateCoins,
    formatApprovalMessage: formatUpdateCoinsApproval,
  },
  {
    name: updateHitPointsToolName,
    tool: updateHitPointsTool,
    executor: executeUpdateHitPoints,
    formatApprovalMessage: formatUpdateHitPointsApproval,
  },
]

/**
 * Map of tool names to Vercel AI SDK tool definitions
 * Used by the AI chat system to provide tools to the LLM
 */
export const TOOL_DEFINITIONS: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t.tool])
)

/**
 * Map of tool names to executor functions
 * Used when executing approved tool calls
 */
export const TOOL_EXECUTORS: Record<string, ToolExecutor> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t.executor])
)

/**
 * Map of tool names to approval message formatters
 * Used to display user-friendly tool call approval messages
 */
export const TOOL_FORMATTERS: Record<string, ToolFormatter> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t.formatApprovalMessage])
)
