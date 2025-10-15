import { create as createCharHPDb } from "@src/db/char_hp"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  BooleanFormFieldSchema,
  NumberFormFieldSchema,
  OptionalNullStringSchema,
} from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateHitPointsApiSchema = z.object({
  action: z.enum(["restore", "lose"]),
  amount: NumberFormFieldSchema.int().min(1),
  note: OptionalNullStringSchema,
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export type UpdateHitPointsResult =
  | { complete: true; newHP: number }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update hit points by creating a new HP change record
 */
export async function updateHitPoints(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateHitPointsResult> {
  const checkD = UpdateHitPointsApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const currentHP = char.currentHP
  const maxHitPoints = char.maxHitPoints

  // Validate amount
  if (data.amount) {
    const amount = parseInt(data.amount, 10)
    if (Number.isNaN(amount) || amount < 1) {
      errors.amount = "Amount must be a positive number"
    } else {
      // Check bounds
      if (checkD.data.action === "restore") {
        const newHP = currentHP + amount
        if (newHP > maxHitPoints) {
          errors.amount = `Cannot restore more than ${maxHitPoints - currentHP} HP (would exceed max)`
        }
      } else {
        const newHP = currentHP - amount
        if (newHP < 0) {
          errors.amount = `Cannot lose more than ${currentHP} HP (would go below 0)`
        }
      }
    }
  } else if (!checkD.data.is_check) {
    errors.amount = "Amount is required"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateHitPointsApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually update hit points

  // Convert action to delta
  const delta = result.data.action === "restore" ? result.data.amount : -result.data.amount

  // Create HP change record
  await createCharHPDb(db, {
    character_id: char.id,
    delta,
    note: result.data.note || null,
  })

  return {
    complete: true,
    newHP: currentHP + delta,
  }
}
