import { create as createSkillDb } from "@src/db/char_skills"
import {
  type ProficiencyLevel,
  ProficiencyLevelSchema,
  SkillSchema,
  type SkillType,
} from "@src/lib/dnd"
import type { SQL } from "bun"
import { z } from "zod"

export const UpdateSkillApiSchema = z.object({
  character_id: z.string(),
  skill: SkillSchema,
  proficiency: ProficiencyLevelSchema,
  note: z.string().nullable().optional(),
})

export type UpdateSkillApi = z.infer<typeof UpdateSkillApiSchema>

/**
 * Prepare form values for live validation (/check endpoint)
 * Mutates values to be helpful
 * Returns soft validation hints
 */
export function prepareUpdateSkillForm(
  values: Record<string, string>,
  currentProficiency: ProficiencyLevel
): { values: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const preparedValues = { ...values }

  // Default proficiency if missing
  if (!preparedValues.proficiency) {
    preparedValues.proficiency = currentProficiency
  }

  // Validate proficiency is valid
  if (
    preparedValues.proficiency &&
    !["none", "half", "proficient", "expert"].includes(preparedValues.proficiency)
  ) {
    errors.proficiency = "Invalid proficiency level"
  }

  return { values: preparedValues, errors }
}

/**
 * Strict validation for form submission (POST endpoint)
 * Does NOT mutate values - validates as-is
 * Returns hard errors
 */
export function validateUpdateSkill(
  values: Record<string, string>,
  currentProficiency: ProficiencyLevel
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate proficiency is provided
  if (!values.proficiency) {
    errors.proficiency = "Proficiency is required"
    return { valid: false, errors }
  }

  // Validate proficiency is valid
  if (!["none", "half", "proficient", "expert"].includes(values.proficiency)) {
    errors.proficiency = "Invalid proficiency level"
    return { valid: false, errors }
  }

  // Validate that proficiency has changed
  if (values.proficiency === currentProficiency) {
    errors.proficiency = "Must change proficiency level"
    return { valid: false, errors }
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors }
}

/**
 * Update skill by creating a new skill record
 */
export async function updateSkill(db: SQL, data: UpdateSkillApi): Promise<void> {
  // Create new skill record
  await createSkillDb(db, {
    character_id: data.character_id,
    skill: data.skill,
    proficiency: data.proficiency,
    note: data.note || null,
  })
}
