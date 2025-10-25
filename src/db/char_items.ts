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

  return result.map((row: any) => ({
    item_id: row.item_id,
    worn: row.worn,
    wielded: row.wielded,
  }))
}
