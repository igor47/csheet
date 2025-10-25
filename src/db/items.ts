import {
  ArmorTypeSchema,
  ItemCategorySchema,
  type ItemCategoryType,
  WeaponMasterySchema,
} from "@src/lib/dnd"
import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  category: ItemCategorySchema,

  // Armor-specific fields
  armor_type: ArmorTypeSchema.nullable().default(null),
  armor_class: z.number().int().min(0).nullable().default(null),
  armor_class_dex: z.boolean().default(false),
  armor_class_dex_max: z.number().int().min(0).nullable().default(null),

  // Shield-specific field
  armor_modifier: z.number().int().nullable().default(null),

  // Weapon-specific fields
  normal_range: z.number().int().positive().nullable().default(null),
  long_range: z.number().int().positive().nullable().default(null),
  thrown: z.boolean().default(false),
  finesse: z.boolean().default(false),
  mastery: WeaponMasterySchema.nullable().default(null),
  martial: z.boolean().default(false),

  created_by: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateItemSchema = ItemSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type Item = z.infer<typeof ItemSchema>
export type CreateItem = z.infer<typeof CreateItemSchema>

function parseItem(row: any): Item {
  return ItemSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, item: CreateItem): Promise<Item> {
  const id = ulid()

  const result = await db`
    INSERT INTO items (
      id, name, description, category,
      armor_type, armor_class, armor_class_dex, armor_class_dex_max,
      armor_modifier,
      normal_range, long_range, thrown, finesse, mastery, martial,
      created_by
    )
    VALUES (
      ${id},
      ${item.name},
      ${item.description},
      ${item.category},
      ${item.armor_type},
      ${item.armor_class},
      ${item.armor_class_dex},
      ${item.armor_class_dex_max},
      ${item.armor_modifier},
      ${item.normal_range},
      ${item.long_range},
      ${item.thrown},
      ${item.finesse},
      ${item.mastery},
      ${item.martial},
      ${item.created_by}
    )
    RETURNING *
  `

  return parseItem(result[0])
}

export async function findById(db: SQL, id: string): Promise<Item | null> {
  const result = await db`
    SELECT * FROM items
    WHERE id = ${id}
    LIMIT 1
  `

  if (!result[0]) return null

  return parseItem(result[0])
}

export async function findByCreatedBy(db: SQL, userId: string): Promise<Item[]> {
  const result = await db`
    SELECT * FROM items
    WHERE created_by = ${userId}
    ORDER BY created_at DESC
  `

  return result.map(parseItem)
}

export async function findByCategory(
  db: SQL,
  category: ItemCategoryType,
  userId?: string
): Promise<Item[]> {
  const result = userId
    ? await db`
        SELECT * FROM items
        WHERE category = ${category} AND created_by = ${userId}
        ORDER BY created_at DESC
      `
    : await db`
        SELECT * FROM items
        WHERE category = ${category}
        ORDER BY created_at DESC
      `

  return result.map(parseItem)
}
