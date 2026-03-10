import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

// Druid Wild Shape: tracking of wild shape transformation uses
export const CharWildShapeUseSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  beast_id: z.string(),
  ended_at: z.date().nullable().default(null),
  recovered_at: z.date().nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharWildShapeUseSchema = CharWildShapeUseSchema.omit({
  id: true,
  ended_at: true,
  recovered_at: true,
  created_at: true,
  updated_at: true,
})

export type CharWildShapeUse = z.infer<typeof CharWildShapeUseSchema>
export type CreateCharWildShapeUse = z.infer<typeof CreateCharWildShapeUseSchema>

export async function create(db: SQL, use: CreateCharWildShapeUse): Promise<CharWildShapeUse> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_wild_shape_uses (id, character_id, beast_id, note, created_at)
    VALUES (
      ${id},
      ${use.character_id},
      ${use.beast_id},
      ${use.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharWildShapeUseSchema.parse({
    ...row,
    ended_at: row.ended_at ? new Date(row.ended_at) : null,
    recovered_at: row.recovered_at ? new Date(row.recovered_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

/**
 * Find all unrecovered wild shape uses for a character.
 * Used by computeCharacter to calculate available uses and find ongoing transformation.
 * Since max uses is 2-4, this returns at most 4 rows.
 */
export async function findUnrecovered(db: SQL, characterId: string): Promise<CharWildShapeUse[]> {
  const result = await db`
    SELECT * FROM char_wild_shape_uses
    WHERE character_id = ${characterId} AND recovered_at IS NULL
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharWildShapeUseSchema.parse({
      ...row,
      ended_at: row.ended_at ? new Date(row.ended_at) : null,
      recovered_at: row.recovered_at ? new Date(row.recovered_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

/**
 * Recover all unrecovered wild shape uses for a character.
 * Used by long rest (both rulesets) and short rest (SRD 5.1 only).
 */
export async function recoverAll(db: SQL, characterId: string): Promise<number> {
  const result = await db`
    UPDATE char_wild_shape_uses
    SET recovered_at = CURRENT_TIMESTAMP
    WHERE character_id = ${characterId} AND recovered_at IS NULL
  `
  return result.count
}

/**
 * Recover the oldest unrecovered wild shape use for a character.
 * Used by short rest (SRD 5.2 only - one use recovers per short rest).
 */
export async function recoverOne(db: SQL, characterId: string): Promise<boolean> {
  const result = await db`
    UPDATE char_wild_shape_uses
    SET recovered_at = CURRENT_TIMESTAMP
    WHERE id = (
      SELECT id FROM char_wild_shape_uses
      WHERE character_id = ${characterId} AND recovered_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1
    )
  `
  return result.count > 0
}

/**
 * End an ongoing wild shape transformation.
 */
export async function endTransformation(db: SQL, useId: string): Promise<boolean> {
  const result = await db`
    UPDATE char_wild_shape_uses
    SET ended_at = CURRENT_TIMESTAMP
    WHERE id = ${useId} AND ended_at IS NULL
  `
  return result.count > 0
}

/**
 * End any ongoing wild shape transformation for a character.
 * Used when starting a new transformation (auto-end previous).
 */
export async function endOngoingTransformation(db: SQL, characterId: string): Promise<boolean> {
  const result = await db`
    UPDATE char_wild_shape_uses
    SET ended_at = CURRENT_TIMESTAMP
    WHERE character_id = ${characterId} AND ended_at IS NULL
  `
  return result.count > 0
}

/**
 * Find all wild shape uses for a character (for history display).
 * Returns most recent first, limited to reasonable history.
 */
export async function findByCharacterId(
  db: SQL,
  characterId: string,
  limit = 50
): Promise<CharWildShapeUse[]> {
  const result = await db`
    SELECT * FROM char_wild_shape_uses
    WHERE character_id = ${characterId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharWildShapeUseSchema.parse({
      ...row,
      ended_at: row.ended_at ? new Date(row.ended_at) : null,
      recovered_at: row.recovered_at ? new Date(row.recovered_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}
