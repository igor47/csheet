import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const CharItemSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  item_id: z.string(),
  worn: z.boolean().default(false),
  wielded: z.boolean().default(false),
  dropped_at: z.date().nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharItemSchema = CharItemSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharItem = z.infer<typeof CharItemSchema>
export type CreateCharItem = z.infer<typeof CreateCharItemSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCharItem(row: any): CharItem {
  return CharItemSchema.parse({
    ...row,
    dropped_at: row.dropped_at ? new Date(row.dropped_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, charItem: CreateCharItem): Promise<CharItem> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_items (id, character_id, item_id, worn, wielded, dropped_at, note, created_at)
    VALUES (
      ${id},
      ${charItem.character_id},
      ${charItem.item_id},
      ${charItem.worn},
      ${charItem.wielded},
      ${charItem.dropped_at},
      ${charItem.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseCharItem(result[0])
}

export interface CurrentCharItem {
  item_id: string
  worn: boolean
  wielded: boolean
}

export async function getCurrentInventory(
  db: SQL,
  characterId: string
): Promise<CurrentCharItem[]> {
  const result = await db`
    WITH latest_items AS (
      SELECT
        item_id,
        worn,
        wielded,
        dropped_at,
        ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY created_at DESC) as rn
      FROM char_items
      WHERE character_id = ${characterId}
    )
    SELECT item_id, worn, wielded
    FROM latest_items
    WHERE rn = 1 AND dropped_at IS NULL
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) => ({
    item_id: row.item_id,
    worn: row.worn,
    wielded: row.wielded,
  }))
}

export interface CharItemHistoryEvent {
  id: string
  character_id: string
  item_id: string
  item_name: string
  worn: boolean
  wielded: boolean
  dropped_at: Date | null
  note: string | null
  created_at: Date
}

export async function getCharItemHistory(
  db: SQL,
  characterId: string
): Promise<CharItemHistoryEvent[]> {
  const result = await db`
    SELECT
      ci.id,
      ci.character_id,
      ci.item_id,
      i.name as item_name,
      ci.worn,
      ci.wielded,
      ci.dropped_at,
      ci.note,
      ci.created_at
    FROM char_items ci
    JOIN items i ON i.id = ci.item_id
    WHERE ci.character_id = ${characterId}
    ORDER BY ci.created_at DESC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) => ({
    id: row.id,
    character_id: row.character_id,
    item_id: row.item_id,
    item_name: row.item_name,
    worn: row.worn,
    wielded: row.wielded,
    dropped_at: row.dropped_at ? new Date(row.dropped_at) : null,
    note: row.note,
    created_at: new Date(row.created_at),
  }))
}
