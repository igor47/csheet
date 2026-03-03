import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

// Druid Wild Shape: beasts the character has seen and can transform into
export const CharBeastSeenSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  beast_id: z.string(),
  note: z.string().nullable().default(null),
  replaced_at: z.date().nullable().default(null),
  replaced_by: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharBeastSeenSchema = CharBeastSeenSchema.omit({
  id: true,
  replaced_at: true,
  replaced_by: true,
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
      replaced_at: row.replaced_at ? new Date(row.replaced_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function isBeastSeen(db: SQL, characterId: string, beastId: string): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM char_beasts_seen
    WHERE character_id = ${characterId} AND beast_id = ${beastId} AND replaced_at IS NULL
    LIMIT 1
  `

  return result[0].count > 0
}

export async function getCurrentSeenBeasts(db: SQL, characterId: string): Promise<string[]> {
  const result = await db<{ beast_id: string }[]>`
    SELECT beast_id FROM char_beasts_seen
    WHERE character_id = ${characterId} AND replaced_at IS NULL
    ORDER BY created_at ASC
  `
  return result.map((r) => r.beast_id)
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

/**
 * Soft-delete a beast by setting replaced_at and replaced_by
 * Used when a character replaces a known form with a new one
 */
export async function replaceBeast(
  db: SQL,
  characterId: string,
  beastId: string,
  replacedBy: string
): Promise<boolean> {
  const result = await db`
    UPDATE char_beasts_seen
    SET replaced_at = CURRENT_TIMESTAMP, replaced_by = ${replacedBy}
    WHERE character_id = ${characterId}
      AND beast_id = ${beastId}
      AND replaced_at IS NULL
  `
  return result.count > 0
}

/**
 * History event for beast prep tracking
 */
export interface BeastPrepEvent {
  beast_id: string
  action: "learn" | "replace"
  timestamp: Date
  note: string | null
  replaced_by: string | null
}

/**
 * Get the full history of beast prep events for a character
 * Each row generates 1-2 events: a "learn" event at created_at,
 * and optionally a "replace" event at replaced_at
 */
export async function getBeastPrepHistory(db: SQL, characterId: string): Promise<BeastPrepEvent[]> {
  const rows = await findByCharacterId(db, characterId)

  const events: BeastPrepEvent[] = []
  for (const row of rows) {
    // "Learned" event
    events.push({
      beast_id: row.beast_id,
      action: "learn",
      timestamp: row.created_at,
      note: row.note,
      replaced_by: null,
    })

    // "Replaced" event (if applicable)
    if (row.replaced_at) {
      events.push({
        beast_id: row.beast_id,
        action: "replace",
        timestamp: row.replaced_at,
        note: null,
        replaced_by: row.replaced_by,
      })
    }
  }

  // Sort by timestamp (oldest first)
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
