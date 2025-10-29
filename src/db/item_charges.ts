import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const ItemChargeSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  delta: z.number().int(),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateItemChargeSchema = ItemChargeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type ItemCharge = z.infer<typeof ItemChargeSchema>
export type CreateItemCharge = z.infer<typeof CreateItemChargeSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseItemCharge(row: any): ItemCharge {
  return ItemChargeSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, itemCharge: CreateItemCharge): Promise<ItemCharge> {
  const id = ulid()

  const result = await db`
    INSERT INTO item_charges (id, item_id, delta, note, created_at)
    VALUES (
      ${id},
      ${itemCharge.item_id},
      ${itemCharge.delta},
      ${itemCharge.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseItemCharge(result[0])
}

export async function findByItemId(db: SQL, itemId: string): Promise<ItemCharge[]> {
  const result = await db`
    SELECT * FROM item_charges
    WHERE item_id = ${itemId}
    ORDER BY created_at ASC
  `

  return result.map(parseItemCharge)
}

export async function getCurrentCharges(db: SQL, itemId: string): Promise<number> {
  const result = await db`
    SELECT COALESCE(SUM(delta), 0) as total
    FROM item_charges
    WHERE item_id = ${itemId}
  `

  return Number(result[0].total)
}

export interface ItemChargeHistoryEvent {
  id: string
  item_id: string
  item_name: string
  delta: number
  note: string | null
  created_at: Date
}

export async function getChargeHistoryByCharacter(
  db: SQL,
  characterId: string
): Promise<ItemChargeHistoryEvent[]> {
  const result = await db`
    SELECT
      ic.id,
      ic.item_id,
      i.name as item_name,
      ic.delta,
      ic.note,
      ic.created_at
    FROM item_charges ic
    JOIN items i ON i.id = ic.item_id
    WHERE i.created_by IN (
      SELECT id FROM characters WHERE id = ${characterId}
    )
    OR ic.item_id IN (
      SELECT DISTINCT item_id
      FROM char_items
      WHERE character_id = ${characterId}
    )
    ORDER BY ic.created_at DESC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) => ({
    id: row.id,
    item_id: row.item_id,
    item_name: row.item_name,
    delta: row.delta,
    note: row.note,
    created_at: new Date(row.created_at),
  }))
}
