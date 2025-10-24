import { create as createAbilityDb } from "@src/db/char_abilities"
import { Abilities, type AbilityType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  BooleanFormFieldSchema,
  CheckboxFormFieldSchema,
  NumberFormFieldSchema,
  OptionalNullStringSchema,
} from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// checkboxes are special since we want them to default to "off" if not present
export const CheckboxFields = z.object({
  strength_proficient: CheckboxFormFieldSchema,
  dexterity_proficient: CheckboxFormFieldSchema,
  constitution_proficient: CheckboxFormFieldSchema,
  intelligence_proficient: CheckboxFormFieldSchema,
  wisdom_proficient: CheckboxFormFieldSchema,
  charisma_proficient: CheckboxFormFieldSchema,
})

// Schema for the entire form
export const UpdateAbilitiesApiSchema = z.object({
  ...CheckboxFields.shape,
  strength_score: NumberFormFieldSchema.int().min(1).max(30),
  dexterity_score: NumberFormFieldSchema.int().min(1).max(30),
  constitution_score: NumberFormFieldSchema.int().min(1).max(30),
  intelligence_score: NumberFormFieldSchema.int().min(1).max(30),
  wisdom_score: NumberFormFieldSchema.int().min(1).max(30),
  charisma_score: NumberFormFieldSchema.int().min(1).max(30),
  note: OptionalNullStringSchema,
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export type UpdateAbilitiesResult =
  | { complete: true; changedCount: number }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

interface AbilityChange {
  ability: AbilityType
  score: number
  proficient: boolean
}

/**
 * Update multiple ability scores and/or saving throw proficiencies
 */
export async function updateAbilities(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateAbilitiesResult> {
  // Preprocess checkbox fields; this will force them to be "on" or "off"
  const checkboxVals = CheckboxFields.safeParse(data)
  if (checkboxVals.success) {
    data = { ...data, ...checkboxVals.data }
  }

  // go on with validating remaining fields
  const checkD = UpdateAbilitiesApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}

  // Validate each ability's score
  for (const ability of Abilities) {
    const scoreKey = `${ability}_score`
    if (data[scoreKey]) {
      const score = parseInt(data[scoreKey], 10)
      if (Number.isNaN(score) || score < 1 || score > 30) {
        errors[scoreKey] = "Score must be between 1 and 30"
      }
    } else if (!checkD.data.is_check) {
      errors[scoreKey] = "Score is required"
    }
  }

  // Collect changes
  const changes: AbilityChange[] = []
  for (const ability of Abilities) {
    const currentAbility = char.abilityScores[ability]
    const scoreKey = `${ability}_score`
    const proficientKey = `${ability}_proficient`

    const newScore = data[scoreKey] ? parseInt(data[scoreKey], 10) : currentAbility.score
    const newProficient = data[proficientKey] === "on"

    // Check if this ability has changed
    if (newScore !== currentAbility.score || newProficient !== currentAbility.proficient) {
      changes.push({
        ability,
        score: newScore,
        proficient: newProficient,
      })
    }
  }

  // Validate that at least one ability has changed
  if (!checkD.data.is_check && changes.length === 0) {
    errors.general = "Must change at least one ability"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateAbilitiesApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // Actually update abilities

  const note = result.data.note || null

  // Create a new record for each changed ability
  for (const change of changes) {
    await createAbilityDb(db, {
      character_id: char.id,
      ability: change.ability,
      score: change.score,
      proficiency: change.proficient,
      note,
    })
  }

  return {
    complete: true,
    changedCount: changes.length,
  }
}
