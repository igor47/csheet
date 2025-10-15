import { create as createAbilityDb } from "@src/db/char_abilities"
import { AbilitySchema, type AbilityType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  BooleanFormFieldSchema,
  NumberFormFieldSchema,
  OptionalNullStringSchema,
} from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateAbilityApiSchema = z.object({
  ability: AbilitySchema,
  score: NumberFormFieldSchema.int().min(1).max(30),
  proficiency_change: z.enum(["none", "add", "remove"]).default("none"),
  note: OptionalNullStringSchema,
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export type UpdateAbilityResult =
  | { complete: true; score: number; proficiencyChange: string }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update ability score and/or saving throw proficiency
 */
export async function updateAbility(
  db: SQL,
  char: ComputedCharacter,
  ability: AbilityType,
  data: Record<string, string>
): Promise<UpdateAbilityResult> {
  const dataWithAbility = { ...data, ability }

  const checkD = UpdateAbilityApiSchema.partial().safeParse(dataWithAbility)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const currentAbility = char.abilityScores[ability]
  const isProficient = currentAbility.proficient
  const currentScore = currentAbility.score

  // Validate score
  if (data.score) {
    const score = parseInt(data.score, 10)
    if (Number.isNaN(score) || score < 1 || score > 30) {
      errors.score = "Ability score must be between 1 and 30"
    }
  } else if (!checkD.data.is_check) {
    errors.score = "Score is required"
  }

  // Validate proficiency change
  const proficiencyChange = data.proficiency_change || "none"
  if (proficiencyChange === "add" && isProficient) {
    errors.proficiency_change = "Already proficient in this saving throw"
  }
  if (proficiencyChange === "remove" && !isProficient) {
    errors.proficiency_change = "Not proficient in this saving throw"
  }

  // Validate that something has changed
  if (!checkD.data.is_check && data.score) {
    const score = parseInt(data.score, 10)
    const scoreChanged = !Number.isNaN(score) && score !== currentScore
    const proficiencyChanged = proficiencyChange !== "none"
    if (!scoreChanged && !proficiencyChanged) {
      errors.score = "Must change score or proficiency"
    }
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateAbilityApiSchema.safeParse(dataWithAbility)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually update ability

  // Calculate new proficiency state
  let newProficient = isProficient
  if (result.data.proficiency_change === "add") {
    newProficient = true
  } else if (result.data.proficiency_change === "remove") {
    newProficient = false
  }

  // Create new ability record
  await createAbilityDb(db, {
    character_id: char.id,
    ability: result.data.ability,
    score: result.data.score,
    proficiency: newProficient,
    note: result.data.note || null,
  })

  return {
    complete: true,
    score: result.data.score,
    proficiencyChange: result.data.proficiency_change,
  }
}
