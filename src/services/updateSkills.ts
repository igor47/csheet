import { create as createSkillDb } from "@src/db/char_skills"
import type { ProficiencyLevel, SkillType } from "@src/lib/dnd"
import { Skills } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// Schema for proficiency form fields (radio buttons send value or undefined)
const ProficiencyFormFieldSchema = z
  .union([
    z.literal("none"),
    z.literal("half"),
    z.literal("proficient"),
    z.literal("expert"),
    z.undefined(),
  ])
  .default("none")

// Proficiency fields are special since we want them to default to "none" if not present
export const ProficiencyFields = z.object({
  acrobatics_proficiency: ProficiencyFormFieldSchema,
  animal_handling_proficiency: ProficiencyFormFieldSchema,
  arcana_proficiency: ProficiencyFormFieldSchema,
  athletics_proficiency: ProficiencyFormFieldSchema,
  deception_proficiency: ProficiencyFormFieldSchema,
  history_proficiency: ProficiencyFormFieldSchema,
  insight_proficiency: ProficiencyFormFieldSchema,
  intimidation_proficiency: ProficiencyFormFieldSchema,
  investigation_proficiency: ProficiencyFormFieldSchema,
  medicine_proficiency: ProficiencyFormFieldSchema,
  nature_proficiency: ProficiencyFormFieldSchema,
  perception_proficiency: ProficiencyFormFieldSchema,
  performance_proficiency: ProficiencyFormFieldSchema,
  persuasion_proficiency: ProficiencyFormFieldSchema,
  religion_proficiency: ProficiencyFormFieldSchema,
  sleight_of_hand_proficiency: ProficiencyFormFieldSchema,
  stealth_proficiency: ProficiencyFormFieldSchema,
  survival_proficiency: ProficiencyFormFieldSchema,
})

// Schema for the entire form
export const UpdateSkillsApiSchema = z.object({
  ...ProficiencyFields.shape,
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export type UpdateSkillsResult =
  | { complete: true; changedCount: number }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

interface SkillChange {
  skill: SkillType
  proficiency: ProficiencyLevel
}

/**
 * Update multiple skill proficiencies
 */
export async function updateSkills(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateSkillsResult> {
  // Preprocess proficiency fields; this will force them to be one of the 4 values
  const proficiencyVals = ProficiencyFields.safeParse(data)
  if (proficiencyVals.success) {
    data = { ...data, ...proficiencyVals.data }
  }

  // go on with validating remaining fields
  const checkD = UpdateSkillsApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}

  // Collect changes
  const changes: SkillChange[] = []
  for (const skill of Skills) {
    const currentSkill = char.skills[skill]
    // Sanitize skill name for form field (replace spaces with underscores)
    const sanitizedSkill = skill.replace(/\s+/g, "_")
    const proficiencyKey = `${sanitizedSkill}_proficiency`

    const newProficiency = (data[proficiencyKey] || currentSkill.proficiency) as ProficiencyLevel

    // Check if this skill has changed
    if (newProficiency !== currentSkill.proficiency) {
      changes.push({
        skill,
        proficiency: newProficiency,
      })
    }
  }

  // Validate that at least one skill has changed
  if (!checkD.data.is_check && changes.length === 0) {
    errors.general = "Must change at least one skill"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateSkillsApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // Actually update skills

  const note = result.data.note || null

  // Create a new record for each changed skill
  for (const change of changes) {
    await createSkillDb(db, {
      character_id: char.id,
      skill: change.skill,
      proficiency: change.proficiency,
      note,
    })
  }

  return {
    complete: true,
    changedCount: changes.length,
  }
}
