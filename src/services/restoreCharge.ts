import { create as createChargeDb } from "@src/db/item_charges"
import { NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const RestoreChargeApiSchema = z.object({
  item_id: z.string().describe("The ID of the item to restore charges to"),
  amount: NumberField(
    z
      .number()
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must restore at least 1 charge" })
      .default(1)
  ).describe("Number of charges to restore (defaults to 1)"),
  note: OptionalString().describe("Optional note about restoring the charges"),
})

/**
 * Restore one or more charges to an item
 */
export async function restoreCharge(db: SQL, itemId: string, amount: number = 1, note?: string) {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  // Record charge restoration as positive delta
  return await createChargeDb(db, {
    item_id: itemId,
    delta: amount,
    note: note || null,
  })
}

// Vercel AI SDK tool definition
export const restoreChargeToolName = "restore_item_charge" as const
export const restoreChargeTool = tool({
  name: restoreChargeToolName,
  description: `Restore one or more charges to a charged item. Many magical items regain charges at dawn or after a rest.`,
  inputSchema: RestoreChargeApiSchema,
})

/**
 * Execute the restore_item_charge tool from AI assistant
 */
export async function executeRestoreCharge(
  db: SQL,
  _char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): Promise<ToolExecutorResult> {
  try {
    await restoreCharge(db, parameters.item_id, parameters.amount || 1, parameters.note)

    return {
      status: "success",
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to restore charge",
    }
  }
}

/**
 * Format approval message for restore_item_charge tool calls
 */
export function formatRestoreChargeApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { item_id, amount = 1, note } = parameters

  let message = `Restore ${amount} charge${amount > 1 ? "s" : ""} to ${item_id}`

  if (note) {
    message += `\n${note}`
  }

  return message
}
