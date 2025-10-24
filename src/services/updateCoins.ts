import { create as createCoinsDb } from "@src/db/char_coins"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  BooleanFormFieldSchema,
  NumberFormFieldSchema,
  OptionalNullStringSchema,
} from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// Schema for the entire form
export const UpdateCoinsApiSchema = z.object({
  pp: NumberFormFieldSchema.int().min(0),
  gp: NumberFormFieldSchema.int().min(0),
  ep: NumberFormFieldSchema.int().min(0),
  sp: NumberFormFieldSchema.int().min(0),
  cp: NumberFormFieldSchema.int().min(0),
  note: OptionalNullStringSchema,
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export type UpdateCoinsResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update coin values
 */
export async function updateCoins(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateCoinsResult> {
  // go on with validating fields
  const checkD = UpdateCoinsApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}

  // Validate each coin field
  const coinFields = ["pp", "gp", "ep", "sp", "cp"] as const
  for (const field of coinFields) {
    if (data[field]) {
      const value = parseInt(data[field], 10)
      if (Number.isNaN(value) || value < 0) {
        errors[field] = "Must be a non-negative number"
      }
    } else if (!checkD.data.is_check) {
      errors[field] = "Value is required"
    }
  }

  // Get new values or use current
  const currentCoins = char.coins || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }
  const newCoins = {
    pp: data.pp ? parseInt(data.pp, 10) : currentCoins.pp,
    gp: data.gp ? parseInt(data.gp, 10) : currentCoins.gp,
    ep: data.ep ? parseInt(data.ep, 10) : currentCoins.ep,
    sp: data.sp ? parseInt(data.sp, 10) : currentCoins.sp,
    cp: data.cp ? parseInt(data.cp, 10) : currentCoins.cp,
  }

  // Check if any coin value has changed
  const changed =
    newCoins.pp !== currentCoins.pp ||
    newCoins.gp !== currentCoins.gp ||
    newCoins.ep !== currentCoins.ep ||
    newCoins.sp !== currentCoins.sp ||
    newCoins.cp !== currentCoins.cp

  // Validate that at least one coin value has changed
  if (!checkD.data.is_check && !changed) {
    errors.general = "Must change at least one coin value"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateCoinsApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // Actually update coins

  const note = result.data.note || null

  // Create a new record with the updated coin values
  await createCoinsDb(db, {
    character_id: char.id,
    pp: newCoins.pp,
    gp: newCoins.gp,
    ep: newCoins.ep,
    sp: newCoins.sp,
    cp: newCoins.cp,
    note,
  })

  return {
    complete: true,
  }
}
