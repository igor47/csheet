import { deleteById as deleteItemEffectDb, findById } from "@src/db/item_effects"
import { logger } from "@src/lib/logger"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export type DeleteItemEffectResult = ServiceResult<object>

/**
 * Deletes an item effect after verifying it belongs to the specified item
 */
export async function deleteItemEffect(
  db: SQL,
  _char: ComputedCharacter,
  data: Record<string, string>,
  isCheck?: boolean
): Promise<DeleteItemEffectResult> {
  const errors: Record<string, string> = {}
  const itemId = data.item_id ?? ""
  const effectId = data.effect_id ?? ""

  // Validate required fields
  if (!itemId) {
    if (!isCheck) {
      errors.item_id = "Item ID is required"
    }
  }

  if (!effectId) {
    if (!isCheck) {
      errors.effect_id = "Effect ID is required"
    }
  }

  // Early return if validation errors or check mode
  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  try {
    // Verify the effect exists and belongs to this item
    const effect = await findById(db, effectId)

    if (!effect) {
      return {
        complete: false,
        values: data,
        errors: { effect_id: "Effect not found" },
      }
    }

    if (effect.item_id !== itemId) {
      return {
        complete: false,
        values: data,
        errors: { effect_id: "Effect does not belong to this item" },
      }
    }

    // Delete the effect
    await deleteItemEffectDb(db, effectId)

    return { complete: true, result: {} }
  } catch (error) {
    logger.error("Error deleting item effect:", error as Error)
    return {
      complete: false,
      values: data,
      errors: { general: "Failed to delete effect. Please try again." },
    }
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

export const deleteItemEffectToolName = "delete_item_effect" as const

const DeleteItemEffectToolSchema = z.object({
  item_id: z.string().describe("The ID of the item that owns the effect"),
  effect_id: z.string().describe("The ID of the effect to delete"),
})

/**
 * Vercel AI SDK tool definition for deleting item effects
 * This tool requires approval before execution
 */
export const deleteItemEffectTool = tool({
  name: deleteItemEffectToolName,
  description: [
    "Delete an effect from an item.",
    "This removes a magical or special effect that was previously added to an item.",
    "Both the item_id and effect_id must be provided.",
  ].join(" "),
  inputSchema: DeleteItemEffectToolSchema,
})

/**
 * Execute the delete_item_effect tool from AI assistant
 * Converts AI parameters to service format and calls deleteItemEffect
 */
export async function executeDeleteItemEffect(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to the format expected by deleteItemEffect service
  const data: Record<string, string> = {}

  for (const [key, value] of Object.entries(parameters)) {
    if (value !== null && value !== undefined) {
      data[key] = value.toString()
    }
  }

  // Call the existing deleteItemEffect service and return its result directly
  return deleteItemEffect(db, char, data, isCheck)
}

/**
 * Format approval message for delete_item_effect tool calls
 */
export function formatDeleteItemEffectApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { effect_id } = parameters
  return `Delete item effect ${effect_id}`
}
