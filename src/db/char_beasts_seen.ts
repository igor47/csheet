import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

// Druid Wild Shape: beasts the character has seen and can transform into
export const CharBeastSeenSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  beast_id: z.string(),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharBeastSeenSchema = CharBeastSeenSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharBeastSeen = z.infer<typeof CharBeastSeenSchema>
export type CreateCharBeastSeen = z.infer<typeof CreateCharBeastSeenSchema>

export async function create(db: SQL, beastSeen: CreateCharBeastSeen): Promise<CharBeastSeen> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_beasts_seen (id, character_id, beast_id, note, created_at)
    VALUES (
      ${id},
      ${beastSeen.character_id},
      ${beastSeen.beast_id},
      ${beastSeen.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharBeastSeenSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharBeastSeen[]> {
  const result = await db`
    SELECT * FROM char_beasts_seen
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharBeastSeenSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function isBeastSeen(db: SQL, characterId: string, beastId: string): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM char_beasts_seen
    WHERE character_id = ${characterId} AND beast_id = ${beastId}
    LIMIT 1
  `

  return result[0].count > 0
}

export async function getCurrentSeenBeasts(db: SQL, characterId: string): Promise<string[]> {
  const beasts = await findByCharacterId(db, characterId)
  return beasts.map((b) => b.beast_id)
}

export async function deleteByBeastId(
  db: SQL,
  characterId: string,
  beastId: string
): Promise<boolean> {
  const result = await db`
    DELETE FROM char_beasts_seen
    WHERE character_id = ${characterId} AND beast_id = ${beastId}
  `
  return result.count > 0
}
