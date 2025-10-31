import { create as createCoinsDb } from "@src/db/char_coins"
import { applyDeltasWithChange, toCopper } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  BooleanFormFieldSchema,
  NumberFormFieldSchema,
  OptionalNullStringSchema,
} from "@src/lib/schemas"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// Schema for the coin update API
export const UpdateCoinsApiSchema = z.object({
  pp: NumberFormFieldSchema.int()
    .describe("Change in platinum pieces (positive for gain, negative for loss)")
    .default(0),
  gp: NumberFormFieldSchema.int()
    .describe("Change in gold pieces (positive for gain, negative for loss)")
    .default(0),
  ep: NumberFormFieldSchema.int()
    .describe("Change in electrum pieces (positive for gain, negative for loss)")
    .default(0),
  sp: NumberFormFieldSchema.int()
    .describe("Change in silver pieces (positive for gain, negative for loss)")
    .default(0),
  cp: NumberFormFieldSchema.int()
    .describe("Change in copper pieces (positive for gain, negative for loss)")
    .default(0),
  note: OptionalNullStringSchema.describe("Note describing the transaction"),
  make_change: BooleanFormFieldSchema.optional()
    .default(true)
    .describe("Allow making change from larger denominations"),
  is_check: BooleanFormFieldSchema.optional().default(false),
})

// Vercel AI SDK tool definition
export const updateCoinsToolName = "update_coins" as const
export const updateCoinsTool = tool({
  name: updateCoinsToolName,
  description: `Update the character's coin purse. Used whenever the character gains or spends coins.

Each field represents the change (delta) in that coin type (positive for gains, negative for losses).
The note field should contain a description of the transaction.

Examples:
- Character pays 5gp for room and board → pass gp: -5, note: "Paid for room and board"
- Character finds a treasure chest with 150gp and 20sp → pass gp: 150, sp: 20, note: "Found treasure chest"

Only include coin types that changed (don't need to specify coins that didn't change).
`,
  inputSchema: UpdateCoinsApiSchema.omit({ make_change: true, is_check: true }),
})

export type UpdateCoinsResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update coin values using deltas (changes)
 */
export async function updateCoins(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateCoinsResult> {
  // Validate with partial schema for check mode
  const checkD = UpdateCoinsApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  // Parse full data
  const result = UpdateCoinsApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  const errors: Record<string, string> = {}

  // Get parsed deltas from Zod
  const deltas = {
    pp: result.data.pp || 0,
    gp: result.data.gp || 0,
    ep: result.data.ep || 0,
    sp: result.data.sp || 0,
    cp: result.data.cp || 0,
  }

  // Check if any coin value is changing
  const hasChange = Object.values(deltas).some((v) => v !== 0)
  if (!checkD.data.is_check && !hasChange) {
    errors.general = "Must change at least one coin value"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Get current coins
  const currentCoins = char.coins || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }

  // Calculate new coin totals
  let newCoins: { pp: number; gp: number; ep: number; sp: number; cp: number }

  if (result.data.make_change) {
    // Apply deltas with automatic change-making
    newCoins = applyDeltasWithChange(currentCoins, deltas)

    // Verify we have sufficient funds
    const currentCopper = toCopper(currentCoins)
    const deltaCopper = toCopper(deltas)
    const resultCopper = toCopper(newCoins)

    if (resultCopper < 0 || currentCopper + deltaCopper < 0) {
      return {
        complete: false,
        values: data,
        errors: {
          general: `Insufficient funds: need ${Math.abs(deltaCopper)}cp but only have ${currentCopper}cp total`,
        },
      }
    }
  } else {
    // Simple addition without conversion
    newCoins = {
      pp: currentCoins.pp + deltas.pp,
      gp: currentCoins.gp + deltas.gp,
      ep: currentCoins.ep + deltas.ep,
      sp: currentCoins.sp + deltas.sp,
      cp: currentCoins.cp + deltas.cp,
    }

    // Check for negative values
    for (const [key, value] of Object.entries(newCoins)) {
      if (value < 0) {
        errors[key] = `Insufficient ${key}: would result in ${value}`
      }
    }

    if (Object.keys(errors).length > 0) {
      return { complete: false, values: data, errors }
    }
  }

  // Create a new record with the updated coin values
  await createCoinsDb(db, {
    character_id: char.id,
    pp: newCoins.pp,
    gp: newCoins.gp,
    ep: newCoins.ep,
    sp: newCoins.sp,
    cp: newCoins.cp,
    note: result.data.note || null,
  })

  return {
    complete: true,
  }
}

export interface ToolExecutorResult {
  success: boolean
  errors?: Record<string, string>
}

/**
 * Execute the update_coins tool from AI assistant
 * Converts AI parameters to service format and calls updateCoins
 */
export async function executeUpdateCoins(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): Promise<ToolExecutorResult> {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    ...parameters,
    make_change: "true", // Always enable make_change for AI tool calls
  }

  const result = await updateCoins(db, char, data)

  if (!result.complete) {
    return {
      success: false,
      errors: result.errors,
    }
  }

  return {
    success: true,
  }
}

/**
 * Format approval message for update_coins tool calls
 */
export function formatUpdateCoinsApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { pp = 0, gp = 0, ep = 0, sp = 0, cp = 0, note } = parameters

  // Build list of coin changes
  const changes: string[] = []
  if (pp !== 0) changes.push(`${Math.abs(pp)} platinum`)
  if (gp !== 0) changes.push(`${Math.abs(gp)} gold`)
  if (ep !== 0) changes.push(`${Math.abs(ep)} electrum`)
  if (sp !== 0) changes.push(`${Math.abs(sp)} silver`)
  if (cp !== 0) changes.push(`${Math.abs(cp)} copper`)

  if (changes.length === 0) {
    return "No coin changes"
  }

  // Determine if this is a gain or loss based on copper value
  const totalCopper = pp * 1000 + gp * 100 + ep * 50 + sp * 10 + cp
  const isGain = totalCopper > 0
  const action = isGain ? "Gain" : "Spend"

  let message = `${action} ${changes.join(", ")}`
  if (note) {
    message += `\n${note}`
  }

  return message
}
