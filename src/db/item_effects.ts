import { ItemEffectAppliesSchema, ItemEffectOpSchema, ItemEffectTargetSchema } from "@src/lib/dnd"
import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const ItemEffectSchema = z.object({
  id: z.string(),
  item_id: z.string(),
  target: ItemEffectTargetSchema,
  op: ItemEffectOpSchema,
  value: z.number().int().nullable().default(null),
  applies: ItemEffectAppliesSchema.nullable(),
  created_at: z.date(),
})

export const CreateItemEffectSchema = ItemEffectSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type ItemEffect = z.infer<typeof ItemEffectSchema>
export type CreateItemEffect = z.infer<typeof CreateItemEffectSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseItemEffect(row: any): ItemEffect {
  return ItemEffectSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
  })
}

export async function create(db: SQL, itemEffect: CreateItemEffect): Promise<ItemEffect> {
  const id = ulid()

  const result = await db`
    INSERT INTO item_effects (id, item_id, target, op, value, applies, created_at)
    VALUES (
      ${id},
      ${itemEffect.item_id},
      ${itemEffect.target},
      ${itemEffect.op},
      ${itemEffect.value},
      ${itemEffect.applies},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseItemEffect(result[0])
}

export async function findByItemId(db: SQL, itemId: string): Promise<ItemEffect[]> {
  const result = await db`
    SELECT * FROM item_effects
    WHERE item_id = ${itemId}
    ORDER BY created_at ASC
  `

  return result.map(parseItemEffect)
}

export async function findById(db: SQL, id: string): Promise<ItemEffect | null> {
  const result = await db`
    SELECT * FROM item_effects
    WHERE id = ${id}
    LIMIT 1
  `

  return result.length > 0 ? parseItemEffect(result[0]) : null
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM item_effects
    WHERE id = ${id}
  `
}
