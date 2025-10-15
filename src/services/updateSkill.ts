import { create as createSkillDb } from "@src/db/char_skills"
import {
  type ProficiencyLevel,
  ProficiencyLevelSchema,
  SkillSchema,
} from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { BooleanFormFieldSchema, OptionalNullStringSchema } from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateSkillApiSchema = z.object({
  skill: SkillSchema,
  proficiency: ProficiencyLevelSchema,
  note: OptionalNullStringSchema,
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export type UpdateSkillResult =
  | { complete: true; proficiency: ProficiencyLevel }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update skill by creating a new skill record
 */
export async function updateSkill(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateSkillResult> {
  const checkD = UpdateSkillApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const { skill } = checkD.data

  if (!skill) {
    if (!checkD.data.is_check) {
      errors.skill = "Skill is required."
    }
    return { complete: false, values: data, errors }
  }
  const currentProficiency = char.skills[skill].proficiency

  // Validate proficiency
  if (data.proficiency) {
    if (!["none", "half", "proficient", "expert"].includes(data.proficiency)) {
      errors.proficiency = "Invalid proficiency level"
    } else if (data.proficiency === currentProficiency && !checkD.data.is_check) {
      errors.proficiency = "Must change proficiency level"
    }
  } else if (!checkD.data.is_check) {
    errors.proficiency = "Proficiency is required"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateSkillApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Create new skill record
  await createSkillDb(db, {
    character_id: char.id,
    skill: result.data.skill,
    proficiency: result.data.proficiency,
    note: result.data.note || null,
  })

  return {
    complete: true,
    proficiency: result.data.proficiency,
  }
}
