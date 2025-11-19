import { AbilitySchema, type AbilityType } from "@src/lib/dnd"
import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CharAbilitySchema = z.object({
  id: z.string(),
  character_id: z.string(),
  ability: AbilitySchema,
  score: z.number().int().min(1).max(30),
  proficiency: z.boolean(),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharAbilitySchema = CharAbilitySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharAbility = z.infer<typeof CharAbilitySchema>
export type CreateCharAbility = z.infer<typeof CreateCharAbilitySchema>

export async function create(db: SQL, charAbility: CreateCharAbility): Promise<CharAbility> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_abilities (id, character_id, ability, score, proficiency, note, created_at)
    VALUES (
      ${id},
      ${charAbility.character_id},
      ${charAbility.ability},
      ${charAbility.score},
      ${charAbility.proficiency},
      ${charAbility.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharAbilitySchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharAbility[]> {
  const result = await db`
    SELECT * FROM char_abilities
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharAbilitySchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export interface CurrentAbility {
  score: number
  proficient: boolean
}

export async function currentByCharacterId(
  db: SQL,
  characterId: string
): Promise<Record<AbilityType, CurrentAbility>> {
  const result = await db`
    WITH ranked AS (
      SELECT
        ability,
        score,
        proficiency,
        ROW_NUMBER() OVER (PARTITION BY ability ORDER BY created_at DESC) as rn
      FROM char_abilities
      WHERE character_id = ${characterId}
    )
    SELECT ability, score, proficiency
    FROM ranked
    WHERE rn = 1
  `

  return result.reduce(
    // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
    (acc: Record<AbilityType, CurrentAbility>, row: any) => {
      acc[row.ability as AbilityType] = {
        score: row.score,
        proficient: row.proficiency,
      }
      return acc
    },
    {} as Record<AbilityType, CurrentAbility>
  )
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_abilities
    WHERE id = ${id}
  `
}
