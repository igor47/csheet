import { ClassNamesSchema } from "@src/lib/dnd"
import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const CharLevelSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  class: ClassNamesSchema,
  level: z.number().int().min(1).max(20),
  subclass: z.string().nullable().default(null),
  hit_die_roll: z.number().int().min(1).max(12),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharLevelSchema = CharLevelSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharLevel = z.infer<typeof CharLevelSchema>
export type CreateCharLevel = z.infer<typeof CreateCharLevelSchema>

export async function create(db: SQL, charLevel: CreateCharLevel): Promise<CharLevel> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_levels (id, character_id, class, level, subclass, hit_die_roll, note, created_at)
    VALUES (
      ${id},
      ${charLevel.character_id},
      ${charLevel.class},
      ${charLevel.level},
      ${charLevel.subclass},
      ${charLevel.hit_die_roll},
      ${charLevel.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharLevelSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharLevel[]> {
  const result = await db`
    SELECT * FROM char_levels
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  return result.map((row: CharLevel) =>
    CharLevelSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function getCurrentLevels(db: SQL, characterId: string): Promise<CharLevel[]> {
  const result = await db`
    WITH ranked AS (
      SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY class ORDER BY level DESC, created_at DESC) as rn
      FROM char_levels
      WHERE character_id = ${characterId}
    )
    SELECT *
    FROM ranked
    WHERE rn = 1
  `

  return result.map((row: CharLevel) =>
    CharLevelSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function maxClassLevel(db: SQL, characterId: string): Promise<CharLevel> {
  const result = await db`
    SELECT *
    FROM char_levels
    WHERE character_id = ${characterId}
    ORDER BY level DESC
    LIMIT 1
  `
  if (result.length === 0) {
    throw new Error("Character has no levels")
  }
  const row = result[0]
  return CharLevelSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_levels
    WHERE id = ${id}
  `
}
