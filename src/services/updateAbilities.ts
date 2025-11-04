import { create as createAbilityDb } from "@src/db/char_abilities"
import { Abilities, type AbilityType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// checkboxes are special since we want them to default to "off" if not present
export const CheckboxFields = z.object({
  strength_proficient: Checkbox(),
  dexterity_proficient: Checkbox(),
  constitution_proficient: Checkbox(),
  intelligence_proficient: Checkbox(),
  wisdom_proficient: Checkbox(),
  charisma_proficient: Checkbox(),
})

// Helper for ability score field
const AbilityScoreField = () =>
  NumberField(
    z
      .number({
        error: (iss) =>
          iss === undefined ? "Ability score is required" : "Must be a valid number",
      })
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must be at least 1" })
      .max(30, { message: "Cannot exceed 30" })
  )

// Schema for the entire form
export const UpdateAbilitiesApiSchema = z.object({
  ...CheckboxFields.shape,
  strength_score: AbilityScoreField(),
  dexterity_score: AbilityScoreField(),
  constitution_score: AbilityScoreField(),
  intelligence_score: AbilityScoreField(),
  wisdom_score: AbilityScoreField(),
  charisma_score: AbilityScoreField(),
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
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
  // go on with validating remaining fields
  const checkD = UpdateAbilitiesApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return {
      complete: false,
      values: data,
      errors: zodToFormErrors(checkD.error),
    }
  }

  const values = checkD.data
  const errors: Record<string, string> = {}

  // Collect changes using the preprocessed data from schema validation
  const changes: AbilityChange[] = []
  for (const ability of Abilities) {
    const currentAbility = char.abilityScores[ability]
    const scoreKey = `${ability}_score` as keyof typeof values
    const proficientKey = `${ability}_proficient` as keyof typeof values

    const scoreValue = values[scoreKey]
    const profValue = values[proficientKey]

    const newScore = typeof scoreValue === "number" ? scoreValue : currentAbility.score
    const newProficient = typeof profValue === "boolean" ? profValue : currentAbility.proficient

    if (newScore < 1 || newScore > 30) {
      errors[scoreKey] = "Score must be between 1 and 30"
    }

    if (!values[scoreKey] && !values.is_check) {
      errors[scoreKey] = "Score is required"
    }

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
  if (!values.is_check && changes.length === 0) {
    errors.general = "Must change at least one ability"
  }

  if (values.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateAbilitiesApiSchema.safeParse(data)
  if (!result.success) {
    return {
      complete: false,
      values: data,
      errors: zodToFormErrors(result.error),
    }
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
