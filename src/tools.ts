import { zodToFormErrors } from "@src/lib/formErrors"
import type { ToolExecutor, ToolFormatter, ToolSpec } from "@src/lib/toolSpec"
import { type Tool, tool } from "ai"
import type { z } from "zod"
import {
  activateWildShapeTool,
  activateWildShapeToolName,
  executeActivateWildShape,
  formatActivateWildShapeApproval,
} from "./services/activateWildShape"
import {
  addBeastTool,
  addBeastToolName,
  executeAddBeast,
  formatAddBeastApproval,
} from "./services/addBeast"
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
  characterBeastsTool,
  characterBeastsToolName,
  executeCharacterBeasts,
} from "./services/characterBeasts"
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
import {
  createItemTool,
  createItemToolName,
  executeCreateItem,
  formatCreateItemApproval,
} from "./services/createItem"
import {
  createItemEffectTool,
  createItemEffectToolName,
  executeCreateItemEffect,
  formatCreateItemEffectApproval,
} from "./services/createItemEffect"
import {
  executeRecordDeathSave,
  executeRestoreToLife,
  formatRecordDeathSaveApproval,
  formatRestoreToLifeApproval,
  recordDeathSaveTool,
  recordDeathSaveToolName,
  restoreToLifeTool,
  restoreToLifeToolName,
} from "./services/deathSaves"
import {
  deleteItemEffectTool,
  deleteItemEffectToolName,
  executeDeleteItemEffect,
  formatDeleteItemEffectApproval,
} from "./services/deleteItemEffect"
import {
  endWildShapeTool,
  endWildShapeToolName,
  executeEndWildShape,
  formatEndWildShapeApproval,
} from "./services/endWildShape"
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
import { executeLookupBeast, lookupBeastTool, lookupBeastToolName } from "./services/lookupBeast"
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
import { executeReadRule, readRuleTool, readRuleToolName } from "./services/readRule"
import { executeSearchRules, searchRulesTool, searchRulesToolName } from "./services/searchRules"
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
  executeUpdateProficiencies,
  formatUpdateProficienciesApproval,
  updateProficienciesTool,
  updateProficienciesToolName,
} from "./services/updateProficiencies"
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
 * Complete tool registration containing all components
 * The executor and formatter take parameters as stored, and parse them with the tool's schema
 */
export interface ToolRegistration {
  /** Unique tool name (e.g., "update_coins") */
  name: string
  /** Vercel AI SDK tool definition for the LLM */
  tool: Tool
  /** Executor function that performs the tool action */
  executor: ToolExecutor<unknown>
  /**
   * Optional formatter function that generates user-friendly approval messages.
   * If provided, the tool requires user approval before execution.
   * If omitted (undefined), the tool is read-only and executes immediately.
   */
  formatApprovalMessage?: ToolFormatter<unknown>
}

/**
 * Register a tool, typing its executor and formatter by its input schema
 * Stored parameters are parsed with that schema before either sees them
 */
function registerTool<S extends z.ZodType>(registration: {
  name: string
  tool: ToolSpec<S>
  executor: ToolExecutor<NoInfer<z.output<S>>>
  formatApprovalMessage?: ToolFormatter<NoInfer<z.output<S>>>
}): ToolRegistration {
  const { name, tool: spec, executor, formatApprovalMessage } = registration

  return {
    name,
    tool: tool(spec),
    executor: async (db, char, parameters, isCheck) => {
      const parsed = spec.inputSchema.safeParse(parameters)
      if (!parsed.success) {
        return { complete: false, values: {}, errors: zodToFormErrors(parsed.error) }
      }
      return executor(db, char, parsed.data, isCheck)
    },
    formatApprovalMessage:
      formatApprovalMessage &&
      ((parameters, char) => {
        const parsed = spec.inputSchema.safeParse(parameters)
        return parsed.success
          ? formatApprovalMessage(parsed.data, char)
          : `${name} (invalid parameters)`
      }),
  }
}

/**
 * Centralized registry of all available tools
 * Add new tools here to make them available throughout the application
 */
export const TOOLS: ToolRegistration[] = [
  // Resource Management
  registerTool({
    name: updateCoinsToolName,
    tool: updateCoinsTool,
    executor: executeUpdateCoins,
    formatApprovalMessage: formatUpdateCoinsApproval,
  }),
  registerTool({
    name: updateHitPointsToolName,
    tool: updateHitPointsTool,
    executor: executeUpdateHitPoints,
    formatApprovalMessage: formatUpdateHitPointsApproval,
  }),
  registerTool({
    name: recordDeathSaveToolName,
    tool: recordDeathSaveTool,
    executor: executeRecordDeathSave,
    formatApprovalMessage: formatRecordDeathSaveApproval,
  }),
  registerTool({
    name: restoreToLifeToolName,
    tool: restoreToLifeTool,
    executor: executeRestoreToLife,
    formatApprovalMessage: formatRestoreToLifeApproval,
  }),
  registerTool({
    name: useHitDieToolName,
    tool: useHitDieTool,
    executor: executeUseHitDie,
    formatApprovalMessage: formatUseHitDieApproval,
  }),
  registerTool({
    name: restoreHitDieToolName,
    tool: restoreHitDieTool,
    executor: executeRestoreHitDie,
    formatApprovalMessage: formatRestoreHitDieApproval,
  }),
  registerTool({
    name: longRestToolName,
    tool: longRestTool,
    executor: executeLongRest,
    formatApprovalMessage: formatLongRestApproval,
  }),
  registerTool({
    name: shortRestToolName,
    tool: shortRestTool,
    executor: executeShortRest,
    formatApprovalMessage: formatShortRestApproval,
  }),

  // Character Info (Read-only)
  registerTool({
    name: characterStatusToolName,
    tool: characterStatusTool,
    executor: executeCharacterStatus,
  }),
  registerTool({
    name: characterTraitsToolName,
    tool: characterTraitsTool,
    executor: executeCharacterTraits,
  }),

  // Rules reference (Read-only)
  registerTool({
    name: searchRulesToolName,
    tool: searchRulesTool,
    executor: executeSearchRules,
  }),
  registerTool({
    name: readRuleToolName,
    tool: readRuleTool,
    executor: executeReadRule,
  }),

  // Spellcasting
  registerTool({
    name: lookupSpellToolName,
    tool: lookupSpellTool,
    executor: executeLookupSpell,
  }),
  registerTool({
    name: prepareSpellToolName,
    tool: prepareSpellTool,
    executor: executePrepareSpell,
    formatApprovalMessage: formatPrepareSpellApproval,
  }),
  registerTool({
    name: castSpellToolName,
    tool: castSpellTool,
    executor: executeCastSpell,
    formatApprovalMessage: formatCastSpellApproval,
  }),
  registerTool({
    name: learnSpellToolName,
    tool: learnSpellTool,
    executor: executeLearnSpell,
    formatApprovalMessage: formatLearnSpellApproval,
  }),
  registerTool({
    name: updateSpellSlotsToolName,
    tool: updateSpellSlotsTool,
    executor: executeUpdateSpellSlots,
    formatApprovalMessage: formatUpdateSpellSlotsApproval,
  }),

  // Wild Shape (Druid)
  registerTool({
    name: lookupBeastToolName,
    tool: lookupBeastTool,
    executor: executeLookupBeast,
  }),
  registerTool({
    name: characterBeastsToolName,
    tool: characterBeastsTool,
    executor: executeCharacterBeasts,
  }),
  registerTool({
    name: addBeastToolName,
    tool: addBeastTool,
    executor: executeAddBeast,
    formatApprovalMessage: formatAddBeastApproval,
  }),
  registerTool({
    name: activateWildShapeToolName,
    tool: activateWildShapeTool,
    executor: executeActivateWildShape,
    formatApprovalMessage: formatActivateWildShapeApproval,
  }),
  registerTool({
    name: endWildShapeToolName,
    tool: endWildShapeTool,
    executor: executeEndWildShape,
    formatApprovalMessage: formatEndWildShapeApproval,
  }),

  // Items
  registerTool({
    name: lookupItemTemplateToolName,
    tool: lookupItemTemplateTool,
    executor: executeLookupItemTemplate,
  }),
  registerTool({
    name: createItemToolName,
    tool: createItemTool,
    executor: executeCreateItem,
    formatApprovalMessage: formatCreateItemApproval,
  }),
  registerTool({
    name: equipItemToolName,
    tool: equipItemTool,
    executor: executeEquipItem,
    formatApprovalMessage: formatEquipItemApproval,
  }),
  registerTool({
    name: manageChargeToolName,
    tool: manageChargeTool,
    executor: executeManageCharge,
    formatApprovalMessage: formatManageChargeApproval,
  }),
  registerTool({
    name: createItemEffectToolName,
    tool: createItemEffectTool,
    executor: executeCreateItemEffect,
    formatApprovalMessage: formatCreateItemEffectApproval,
  }),
  registerTool({
    name: deleteItemEffectToolName,
    tool: deleteItemEffectTool,
    executor: executeDeleteItemEffect,
    formatApprovalMessage: formatDeleteItemEffectApproval,
  }),

  // Character Advancement
  registerTool({
    name: addLevelToolName,
    tool: addLevelTool,
    executor: executeAddLevel,
    formatApprovalMessage: formatAddLevelApproval,
  }),
  registerTool({
    name: addTraitToolName,
    tool: addTraitTool,
    executor: executeAddTrait,
    formatApprovalMessage: formatAddTraitApproval,
  }),
  registerTool({
    name: updateProficienciesToolName,
    tool: updateProficienciesTool,
    executor: executeUpdateProficiencies,
    formatApprovalMessage: formatUpdateProficienciesApproval,
  }),
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
export const TOOL_EXECUTORS: Record<string, ToolExecutor<unknown>> = Object.fromEntries(
  TOOLS.map((t) => [t.name, t.executor])
)

/**
 * Map of tool names to approval message formatters
 * Used to display user-friendly tool call approval messages
 * Only includes tools that have formatters (require approval)
 */
export const TOOL_FORMATTERS: Record<string, ToolFormatter<unknown>> = Object.fromEntries(
  TOOLS.filter((t) => t.formatApprovalMessage).map((t) => [t.name, t.formatApprovalMessage!])
)

/**
 * Whether a tool is read-only, so it runs without asking the user
 * A tool is read-only when it has no approval formatter; tools that change the character
 * have one, so the user can see and approve the change
 */
export function isReadOnly(toolName: string): boolean {
  return !(toolName in TOOL_FORMATTERS)
}
