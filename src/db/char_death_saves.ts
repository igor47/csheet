import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

// What happens to a character at 0 HP; see the migration for what each kind means
export const DeathSaveKinds = ["down", "success", "failure", "stable", "dead", "up"] as const
export type DeathSaveKind = (typeof DeathSaveKinds)[number]

export const CharDeathSaveSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  kind: z.enum(DeathSaveKinds),
  amount: z.number().int().min(0).max(2),
  roll: z.number().int().min(1).max(20).nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharDeathSaveSchema = CharDeathSaveSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharDeathSave = z.infer<typeof CharDeathSaveSchema>
export type CreateCharDeathSave = z.input<typeof CreateCharDeathSaveSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseRow(row: any): CharDeathSave {
  return CharDeathSaveSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, event: CreateCharDeathSave): Promise<CharDeathSave> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_death_saves (id, character_id, kind, amount, roll, note, created_at)
    VALUES (
      ${id},
      ${event.character_id},
      ${event.kind},
      ${event.amount},
      ${event.roll ?? null},
      ${event.note ?? null},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseRow(result[0])
}

/**
 * Find the events since the character last regained HP (the last `up`)
 * Any rows mean the character is down: at 0 HP, and dying, stable or dead
 */
export async function findSinceLastUp(db: SQL, characterId: string): Promise<CharDeathSave[]> {
  const result = await db`
    SELECT * FROM char_death_saves
    WHERE character_id = ${characterId}
      AND id > COALESCE(
        (SELECT MAX(id) FROM char_death_saves WHERE character_id = ${characterId} AND kind = 'up'),
        ''
      )
    ORDER BY id ASC
  `

  return result.map(parseRow)
}

/**
 * Find all death save events for a character (for history display), oldest first
 */
export async function findByCharacterId(db: SQL, characterId: string): Promise<CharDeathSave[]> {
  const result = await db`
    SELECT * FROM char_death_saves
    WHERE character_id = ${characterId}
    ORDER BY id ASC
  `

  return result.map(parseRow)
}
