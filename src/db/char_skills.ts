import {
  type ProficiencyLevel,
  ProficiencyLevelSchema,
  SkillSchema,
  type SkillType,
} from "@src/lib/dnd"
import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CharSkillSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  skill: SkillSchema,
  proficiency: ProficiencyLevelSchema,
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharSkillSchema = CharSkillSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharSkill = z.infer<typeof CharSkillSchema>
export type CreateCharSkill = z.infer<typeof CreateCharSkillSchema>

export async function create(db: SQL, charSkill: CreateCharSkill): Promise<CharSkill> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_skills (id, character_id, skill, proficiency, note, created_at)
    VALUES (
      ${id},
      ${charSkill.character_id},
      ${charSkill.skill},
      ${charSkill.proficiency},
      ${charSkill.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharSkillSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharSkill[]> {
  const result = await db`
    SELECT * FROM char_skills
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharSkillSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export interface CurrentSkill {
  proficiency: ProficiencyLevel
}

export async function currentByCharacterId(
  db: SQL,
  characterId: string
): Promise<Partial<Record<SkillType, CurrentSkill>>> {
  const result = await db`
    WITH ranked AS (
      SELECT
        skill,
        proficiency,
        ROW_NUMBER() OVER (PARTITION BY skill ORDER BY created_at DESC) as rn
      FROM char_skills
      WHERE character_id = ${characterId}
    )
    SELECT skill, proficiency
    FROM ranked
    WHERE rn = 1
  `

  return result.reduce(
    // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
    (acc: Record<SkillType, CurrentSkill>, row: any) => {
      acc[row.skill as SkillType] = {
        proficiency: row.proficiency as ProficiencyLevel,
      }
      return acc
    },
    {} as Record<SkillType, CurrentSkill>
  )
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_skills
    WHERE id = ${id}
  `
}
