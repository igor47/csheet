import type { Tool } from "ai"
import type { SQL } from "bun"
import type { ServiceResult } from "./lib/serviceResult"
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
import {
  characterStatusTool,
  characterStatusToolName,
  executeCharacterStatus,
} from "./services/characterStatus"
import {
  characterTraitsTool,
  characterTraitsToolName,
  executeCharacterTraits,
} from "./services/characterTraits"
import type { ComputedCharacter } from "./services/computeCharacter"
import {
  createItemTool,
  createItemToolName,
  executeCreateItem,
  formatCreateItemApproval,
} from "./services/createItem"
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
  executeLookupItemTemplate,
  lookupItemTemplateTool,
  lookupItemTemplateToolName,
} from "./services/lookupItemTemplate"
import { executeLookupSpell, lookupSpellTool, lookupSpellToolName } from "./services/lookupSpell"
import {
  executeManageCharge,
  formatManageChargeApproval,
  manageChargeTool,
  manageChargeToolName,
} from "./services/manageCharge"
import {
  executePrepareSpell,
  formatPrepareSpellApproval,
  prepareSpellTool,
  prepareSpellToolName,
} from "./services/prepareSpell"
import {
  executeShortRest,
  formatShortRestApproval,
  shortRestTool,
  shortRestToolName,
} from "./services/shortRest"
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
  parameters: Record<string, any>,
  isCheck?: boolean
  // biome-ignore lint/suspicious/noExplicitAny: Service results can be any valid JSON
) => Promise<ServiceResult<Record<string, any>>>

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
  /**
   * Optional formatter function that generates user-friendly approval messages.
   * If provided, the tool requires user approval before execution.
   * If omitted (undefined), the tool is read-only and executes immediately.
   */
  formatApprovalMessage?: ToolFormatter
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
  {
    name: shortRestToolName,
    tool: shortRestTool,
    executor: executeShortRest,
    formatApprovalMessage: formatShortRestApproval,
  },

  // Character Info (Read-only)
  {
    name: characterStatusToolName,
    tool: characterStatusTool,
    executor: executeCharacterStatus,
  },
  {
    name: characterTraitsToolName,
    tool: characterTraitsTool,
    executor: executeCharacterTraits,
  },

  // Spellcasting
  {
    name: lookupSpellToolName,
    tool: lookupSpellTool,
    executor: executeLookupSpell,
  },
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
    name: lookupItemTemplateToolName,
    tool: lookupItemTemplateTool,
    executor: executeLookupItemTemplate,
  },
  {
    name: createItemToolName,
    tool: createItemTool,
    executor: executeCreateItem,
    formatApprovalMessage: formatCreateItemApproval,
  },
  {
    name: equipItemToolName,
    tool: equipItemTool,
    executor: executeEquipItem,
    formatApprovalMessage: formatEquipItemApproval,
  },
  {
    name: manageChargeToolName,
    tool: manageChargeTool,
    executor: executeManageCharge,
    formatApprovalMessage: formatManageChargeApproval,
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
 * Only includes tools that have formatters (require approval)
 */
export const TOOL_FORMATTERS: Record<string, ToolFormatter> = Object.fromEntries(
  TOOLS.filter((t) => t.formatApprovalMessage).map((t) => [t.name, t.formatApprovalMessage!])
)
