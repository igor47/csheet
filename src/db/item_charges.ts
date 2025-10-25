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
