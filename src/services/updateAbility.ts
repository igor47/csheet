import { create as createAbilityDb } from "@src/db/char_abilities"
import { AbilitySchema, type AbilityType } from "@src/lib/dnd"
import type { SQL } from "bun"
import { z } from "zod"

export const UpdateAbilityApiSchema = z.object({
  character_id: z.string(),
  ability: AbilitySchema,
  score: z.number().int().min(1).max(30),
  proficiency_change: z.enum(["none", "add", "remove"]),
  note: z.string().nullable().optional(),
})

export type UpdateAbilityApi = z.infer<typeof UpdateAbilityApiSchema>

/**
 * Prepare form values for live validation (/check endpoint)
 * Mutates values to be helpful
 * Returns soft validation hints
 */
export function prepareUpdateAbilityForm(
  values: Record<string, string>,
  currentScore: number,
  isProficient: boolean
): { values: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const preparedValues = { ...values }

  // Default proficiency_change
  if (!preparedValues.proficiency_change) {
    preparedValues.proficiency_change = "none"
  }

  // Validate score
  if (preparedValues.score) {
    const score = parseInt(preparedValues.score)
    if (isNaN(score) || score < 1 || score > 30) {
      errors.score = "Ability score must be between 1 and 30"
    }
  }

  // Validate proficiency change
  if (preparedValues.proficiency_change) {
    if (preparedValues.proficiency_change === "add" && isProficient) {
      errors.proficiency_change = "Already proficient in this saving throw"
    }
    if (preparedValues.proficiency_change === "remove" && !isProficient) {
      errors.proficiency_change = "Not proficient in this saving throw"
    }
  }

  return { values: preparedValues, errors }
}

/**
 * Strict validation for form submission (POST endpoint)
 * Does NOT mutate values - validates as-is
 * Returns hard errors
 */
export function validateUpdateAbility(
  values: Record<string, string>,
  currentScore: number,
  isProficient: boolean
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate score
  if (!values.score) {
    errors.score = "Score is required"
    return { valid: false, errors }
  }

  const score = parseInt(values.score)
  if (isNaN(score) || score < 1 || score > 30) {
    errors.score = "Ability score must be between 1 and 30"
    return { valid: false, errors }
  }

  // Validate proficiency change
  if (!values.proficiency_change) {
    errors.proficiency_change = "Proficiency change is required"
    return { valid: false, errors }
  }

  if (!["none", "add", "remove"].includes(values.proficiency_change)) {
    errors.proficiency_change = "Invalid proficiency change"
    return { valid: false, errors }
  }

  if (values.proficiency_change === "add" && isProficient) {
    errors.proficiency_change = "Already proficient in this saving throw"
    return { valid: false, errors }
  }

  if (values.proficiency_change === "remove" && !isProficient) {
    errors.proficiency_change = "Not proficient in this saving throw"
    return { valid: false, errors }
  }

  // Validate that something has changed
  const scoreChanged = score !== currentScore
  const proficiencyChanged = values.proficiency_change !== "none"

  if (!scoreChanged && !proficiencyChanged) {
    errors.score = "Must change score or proficiency"
    return { valid: false, errors }
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors }
}

/**
 * Update ability by creating a new ability record
 */
export async function updateAbility(
  db: SQL,
  data: UpdateAbilityApi,
  isProficient: boolean
): Promise<void> {
  // Calculate new proficiency state
  let newProficient = isProficient
  if (data.proficiency_change === "add") {
    newProficient = true
  } else if (data.proficiency_change === "remove") {
    newProficient = false
  }

  // Create new ability record
  await createAbilityDb(db, {
    character_id: data.character_id,
    ability: data.ability,
    score: data.score,
    proficiency: newProficient,
    note: data.note || null,
  })
}
