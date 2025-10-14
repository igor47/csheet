import { create as createCharHPDb } from "@src/db/char_hp"
import type { SQL } from "bun"
import { z } from "zod"

export const UpdateHitPointsApiSchema = z.object({
  character_id: z.string(),
  action: z.enum(["restore", "lose"]),
  amount: z.number().int().min(1),
  note: z.string().nullable().optional(),
})

export type UpdateHitPointsApi = z.infer<typeof UpdateHitPointsApiSchema>

/**
 * Prepare form values for live validation (/check endpoint)
 * Mutates values to be helpful
 * Returns soft validation hints
 */
export function prepareUpdateHitPointsForm(
  values: Record<string, string>,
  currentHP: number,
  maxHitPoints: number
): { values: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const preparedValues = { ...values }

  // Default action to restore if not specified
  if (!preparedValues.action) {
    preparedValues.action = "restore"
  }

  // Validate action
  if (preparedValues.action !== "restore" && preparedValues.action !== "lose") {
    errors.action = "Action must be 'restore' or 'lose'"
    return { values: preparedValues, errors }
  }

  // Validate amount
  if (preparedValues.amount) {
    const amount = parseInt(preparedValues.amount, 10)
    if (Number.isNaN(amount) || amount < 1) {
      errors.amount = "Amount must be a positive number"
    } else {
      // Check bounds
      if (preparedValues.action === "restore") {
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
  }

  return { values: preparedValues, errors }
}

/**
 * Strict validation for form submission (POST endpoint)
 * Does NOT mutate values - validates as-is
 * Returns hard errors
 */
export function validateUpdateHitPoints(
  values: Record<string, string>,
  currentHP: number,
  maxHitPoints: number
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate action
  if (!values.action) {
    errors.action = "Action is required"
    return { valid: false, errors }
  }

  if (values.action !== "restore" && values.action !== "lose") {
    errors.action = "Invalid action"
    return { valid: false, errors }
  }

  // Validate amount
  if (!values.amount) {
    errors.amount = "Amount is required"
    return { valid: false, errors }
  }

  const amount = parseInt(values.amount, 10)
  if (Number.isNaN(amount) || amount < 1) {
    errors.amount = "Amount must be a positive number"
    return { valid: false, errors }
  }

  // Check bounds
  if (values.action === "restore") {
    const newHP = currentHP + amount
    if (newHP > maxHitPoints) {
      errors.amount = `Cannot restore more than ${maxHitPoints - currentHP} HP`
      return { valid: false, errors }
    }
  } else {
    const newHP = currentHP - amount
    if (newHP < 0) {
      errors.amount = `Cannot lose more than ${currentHP} HP`
      return { valid: false, errors }
    }
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors }
}

/**
 * Update hit points by creating a new HP change record
 */
export async function updateHitPoints(db: SQL, data: UpdateHitPointsApi): Promise<void> {
  // Convert action to delta
  const delta = data.action === "restore" ? data.amount : -data.amount

  // Create HP change record
  await createCharHPDb(db, {
    character_id: data.character_id,
    delta,
    note: data.note || null,
  })
}
