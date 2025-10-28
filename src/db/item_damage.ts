import { DamageTypeSchema } from "@src/lib/dnd"
import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const ItemDamageSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  dice: z.array(z.number().int().positive()),
  type: DamageTypeSchema,
  versatile: z.boolean().default(false),
  created_at: z.date(),
})

export const CreateItemDamageSchema = ItemDamageSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type ItemDamage = z.infer<typeof ItemDamageSchema>
export type CreateItemDamage = z.infer<typeof CreateItemDamageSchema>

function parseItemDamage(row: any): ItemDamage {
  return ItemDamageSchema.parse({
    ...row,
    // Convert Int32Array to regular array
    dice: Array.isArray(row.dice) ? row.dice : Array.from(row.dice),
    created_at: new Date(row.created_at),
  })
}

export async function create(db: SQL, itemDamage: CreateItemDamage): Promise<ItemDamage> {
  const id = ulid()

  // Format the dice array as a PostgreSQL array literal
  const diceArray = `{${itemDamage.dice.join(",")}}`

  const result = await db`
    INSERT INTO item_damage (id, item_id, dice, type, versatile, created_at)
    VALUES (
      ${id},
      ${itemDamage.item_id},
      ${diceArray}::integer[],
      ${itemDamage.type},
      ${itemDamage.versatile},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseItemDamage(result[0])
}

export async function findByItemId(db: SQL, itemId: string): Promise<ItemDamage[]> {
  const result = await db`
    SELECT * FROM item_damage
    WHERE item_id = ${itemId}
    ORDER BY created_at ASC
  `

  return result.map(parseItemDamage)
}

export async function deleteByItemId(db: SQL, itemId: string): Promise<void> {
  await db`
    DELETE FROM item_damage
    WHERE item_id = ${itemId}
  `
}
