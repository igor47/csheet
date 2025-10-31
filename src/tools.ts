import type { Tool } from "ai"
import type { SQL } from "bun"
import {
  addLevelTool,
  addLevelToolName,
  executeAddLevel,
  formatAddLevelApproval,
} from "./services/addLevel"
import {
  addTraitTool,
  addTraitToolName,
  executeAddTrait,
  formatAddTraitApproval,
} from "./services/addTrait"
import {
  castSpellTool,
  castSpellToolName,
  executeCastSpell,
  formatCastSpellApproval,
} from "./services/castSpell"
import type { ComputedCharacter } from "./services/computeCharacter"
import {
  equipItemTool,
  equipItemToolName,
  executeEquipItem,
  formatEquipItemApproval,
} from "./services/equipItem"
import {
  executeLearnSpell,
  formatLearnSpellApproval,
  learnSpellTool,
  learnSpellToolName,
} from "./services/learnSpell"
import {
  executeLongRest,
  formatLongRestApproval,
  longRestTool,
  longRestToolName,
} from "./services/longRest"
import {
  executePrepareSpell,
  formatPrepareSpellApproval,
  prepareSpellTool,
  prepareSpellToolName,
} from "./services/prepareSpell"
import {
  executeRestoreCharge,
  formatRestoreChargeApproval,
  restoreChargeTool,
  restoreChargeToolName,
} from "./services/restoreCharge"
import {
  executeUpdateCoins,
  formatUpdateCoinsApproval,
  updateCoinsTool,
  updateCoinsToolName,
} from "./services/updateCoins"
import {
  executeRestoreHitDie,
  executeUseHitDie,
  formatRestoreHitDieApproval,
  formatUseHitDieApproval,
  restoreHitDieTool,
  restoreHitDieToolName,
  useHitDieTool,
  useHitDieToolName,
} from "./services/updateHitDice"
import {
  executeUpdateHitPoints,
  formatUpdateHitPointsApproval,
  updateHitPointsTool,
  updateHitPointsToolName,
} from "./services/updateHitPoints"
import {
  executeUpdateSpellSlots,
  formatUpdateSpellSlotsApproval,
  updateSpellSlotsTool,
  updateSpellSlotsToolName,
} from "./services/updateSpellSlots"
import {
  executeUseCharge,
  formatUseChargeApproval,
  useChargeTool,
  useChargeToolName,
} from "./services/useCharge"

/**
 * Result type for tool executors
 * Matches the ToolResult schema from database
 */
export type ToolExecutorResult =
  | { status: "rejected" }
  | { status: "failed"; error?: string }
  // biome-ignore lint/suspicious/noExplicitAny: Tool result data can be any valid JSON
  | { status: "success"; data?: Record<string, any> }

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
  // Resource Management
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
  {
    name: useHitDieToolName,
    tool: useHitDieTool,
    executor: executeUseHitDie,
    formatApprovalMessage: formatUseHitDieApproval,
  },
  {
    name: restoreHitDieToolName,
    tool: restoreHitDieTool,
    executor: executeRestoreHitDie,
    formatApprovalMessage: formatRestoreHitDieApproval,
  },
  {
    name: longRestToolName,
    tool: longRestTool,
    executor: executeLongRest,
    formatApprovalMessage: formatLongRestApproval,
  },

  // Spellcasting
  {
    name: prepareSpellToolName,
    tool: prepareSpellTool,
    executor: executePrepareSpell,
    formatApprovalMessage: formatPrepareSpellApproval,
  },
  {
    name: castSpellToolName,
    tool: castSpellTool,
    executor: executeCastSpell,
    formatApprovalMessage: formatCastSpellApproval,
  },
  {
    name: learnSpellToolName,
    tool: learnSpellTool,
    executor: executeLearnSpell,
    formatApprovalMessage: formatLearnSpellApproval,
  },
  {
    name: updateSpellSlotsToolName,
    tool: updateSpellSlotsTool,
    executor: executeUpdateSpellSlots,
    formatApprovalMessage: formatUpdateSpellSlotsApproval,
  },

  // Items
  {
    name: equipItemToolName,
    tool: equipItemTool,
    executor: executeEquipItem,
    formatApprovalMessage: formatEquipItemApproval,
  },
  {
    name: useChargeToolName,
    tool: useChargeTool,
    executor: executeUseCharge,
    formatApprovalMessage: formatUseChargeApproval,
  },
  {
    name: restoreChargeToolName,
    tool: restoreChargeTool,
    executor: executeRestoreCharge,
    formatApprovalMessage: formatRestoreChargeApproval,
  },

  // Character Advancement
  {
    name: addLevelToolName,
    tool: addLevelTool,
    executor: executeAddLevel,
    formatApprovalMessage: formatAddLevelApproval,
  },
  {
    name: addTraitToolName,
    tool: addTraitTool,
    executor: executeAddTrait,
    formatApprovalMessage: formatAddTraitApproval,
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
