import { create as createChargeDb, getCurrentCharges } from "@src/db/item_charges"
import { NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UseChargeApiSchema = z.object({
  item_id: z.string().describe("The ID of the item with charges to use"),
  amount: NumberField(
    z
      .number()
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must use at least 1 charge" })
      .default(1)
  ).describe("Number of charges to use (defaults to 1)"),
  note: OptionalString().describe("Optional note about using the charges"),
})

/**
 * Use one or more charges from an item
 */
export async function useCharge(db: SQL, itemId: string, amount: number = 1, note?: string) {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  // Check if item has enough charges
  const currentCharges = await getCurrentCharges(db, itemId)
  if (currentCharges < amount) {
    throw new Error(`Item only has ${currentCharges} charges remaining`)
  }

  // Record charge usage as negative delta
  return await createChargeDb(db, {
    item_id: itemId,
    delta: -amount,
    note: note || null,
  })
}

// Vercel AI SDK tool definition
export const useChargeToolName = "use_item_charge" as const
export const useChargeTool = tool({
  name: useChargeToolName,
  description: `Use one or more charges from a charged item (wands, staffs, etc.). The item must have enough charges available.`,
  inputSchema: UseChargeApiSchema,
})

/**
 * Execute the use_item_charge tool from AI assistant
 */
export async function executeUseCharge(
  db: SQL,
  _char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): Promise<ToolExecutorResult> {
  try {
    await useCharge(db, parameters.item_id, parameters.amount || 1, parameters.note)

    return {
      status: "success",
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to use charge",
    }
  }
}

/**
 * Format approval message for use_item_charge tool calls
 */
export function formatUseChargeApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { item_id, amount = 1, note } = parameters

  let message = `Use ${amount} charge${amount > 1 ? "s" : ""} from ${item_id}`

  if (note) {
    message += `\n${note}`
  }

  return message
}
