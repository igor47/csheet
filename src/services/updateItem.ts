import { create as createCharItemDb } from "@src/db/char_items"
import {
  create as createItemDamageDb,
  deleteByItemId as deleteItemDamageDb,
} from "@src/db/item_damage"
import { findById as findItemById, type UpdateItem, update as updateItemDb } from "@src/db/items"
import {
  ArmorTypeSchema,
  DamageTypeSchema,
  ItemCategorySchema,
  WeaponMasterySchema,
} from "@src/lib/dnd"
import type { DamageType } from "@src/lib/dnd/spells"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  Checkbox,
  NumberField,
  NumericEnumField,
  ObjectArrayField,
  OptionalString,
} from "@src/lib/formSchemas"
import { logger } from "@src/lib/logger"
import type { SQL } from "bun"
import { z } from "zod"

// Base schema for item updates (category is NOT editable)
const BaseItemUpdateSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: OptionalString(),
  category: ItemCategorySchema, // For identification only, not editable
  is_check: Checkbox().optional().default(false),
})

// Basic item (no special fields)
export const BasicItemUpdateSchema = z.object({
  category: ItemCategorySchema.exclude(["armor", "shield", "weapon"]),
})

// Shield-specific fields
const ShieldItemUpdateSchema = z.object({
  category: ItemCategorySchema.extract(["shield"]),
  armor_modifier: NumberField(z.number().int({ message: "Must be a whole number" })),
})

// Armor-specific fields
const ArmorItemUpdateSchema = z.object({
  category: ItemCategorySchema.extract(["armor"]),
  armor_type: ArmorTypeSchema,
  armor_class: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(0, { message: "Cannot be negative" })
  ),
  armor_class_dex: Checkbox().optional().default(false),
  armor_class_dex_max: NumberField(
    z.number().int({ message: "Must be a whole number" }).positive().nullable().default(null)
  ),
})

// Damage entry schema for ObjectArrayField
const DamageDice = [4, 6, 8, 10, 12, 20, 100] as const
const DamageEntrySchema = z.object({
  num_dice: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1, { message: "Must be at least 1" })
  ),
  die_value: NumericEnumField(
    z.union(
      DamageDice.map((n) => z.literal(n)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]
    )
  ),
  type: DamageTypeSchema,
  versatile: Checkbox().optional().default(false),
})

// Weapon-specific fields
const WeaponItemBaseUpdateSchema = z.object({
  category: ItemCategorySchema.extract(["weapon"]),

  finesse: Checkbox().optional().default(false),
  mastery: WeaponMasterySchema.nullable().default(null),
  martial: Checkbox().optional().default(false),

  // Damage entries using ObjectArrayField (at least one required for weapons)
  damage: ObjectArrayField(DamageEntrySchema),
})

const WeaponItemUpdateSchema = z.discriminatedUnion("weapon_type", [
  WeaponItemBaseUpdateSchema.extend({
    weapon_type: z.literal("melee"),
  }),
  WeaponItemBaseUpdateSchema.extend({
    weapon_type: z.literal("thrown"),
    normal_range: NumberField(
      z
        .number({
          error: (iss) =>
            iss === undefined ? "Normal range is required" : "Must be a valid number",
        })
        .int({ message: "Must be a whole number" })
        .positive({ message: "Must be greater than zero" })
    ),
    long_range: NumberField(
      z
        .number({
          error: (iss) => (iss === undefined ? "Long range is required" : "Must be a valid number"),
        })
        .int({ message: "Must be a whole number" })
        .positive({ message: "Must be greater than zero" })
    ),
  }),
  WeaponItemBaseUpdateSchema.extend({
    weapon_type: z.literal("ranged"),
    normal_range: NumberField(
      z
        .number({
          error: (iss) =>
            iss === undefined ? "Normal range is required" : "Must be a valid number",
        })
        .int({ message: "Must be a whole number" })
        .positive({ message: "Must be greater than zero" })
    ),
    long_range: NumberField(
      z
        .number({
          error: (iss) => (iss === undefined ? "Long range is required" : "Must be a valid number"),
        })
        .int({ message: "Must be a whole number" })
        .positive({ message: "Must be greater than zero" })
    ),
  }),
])

const ItemTypeUpdateSchemas = z.union([
  BasicItemUpdateSchema,
  ShieldItemUpdateSchema,
  ArmorItemUpdateSchema,
  WeaponItemUpdateSchema,
])

export const UpdateItemApiSchema = ItemTypeUpdateSchemas.and(BaseItemUpdateSchema)

export type UpdateItemData = z.infer<typeof UpdateItemApiSchema>

export type UpdateItemResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors?: Record<string, string> }

/**
 * Updates an existing item
 */
export async function updateItem(
  db: SQL,
  itemId: string,
  characterId: string,
  data: Record<string, string>
): Promise<UpdateItemResult> {
  const errors: Record<string, string> = {}

  // Get the existing item to determine its category
  const existingItem = await findItemById(db, itemId)
  if (!existingItem) {
    return {
      complete: false,
      values: data,
      errors: { general: "Item not found" },
    }
  }

  // cannot change item category
  data.category = existingItem.category

  // Partial validation for check mode
  const partial = ItemTypeUpdateSchemas.and(BaseItemUpdateSchema.partial()).safeParse(data)
  if (!partial.success) {
    return {
      complete: false,
      values: data,
      errors: zodToFormErrors(partial.error),
    }
  }

  const values = partial.data
  const isCheck = values.is_check

  // Soft validation for check mode
  if (!values.name) {
    if (!isCheck) {
      errors.name = "Item name is required"
    }
  } else if (values.name.trim().length === 0) {
    errors.name = "Item name is required"
  }

  // Category-specific validation
  const damages: { dice: number[]; type: DamageType; versatile: boolean }[] = []

  if (values.category === "armor") {
    if (!values.armor_type && !isCheck) {
      errors.armor_type = "Armor type is required for armor"
    }
    if (!values.armor_class && !isCheck) {
      errors.armor_class = "Armor class is required for armor"
    }
  }

  if (values.category === "shield") {
    if (!values.armor_modifier && !isCheck) {
      errors.armor_modifier = "Armor modifier is required for shields"
    }
  }

  if (values.category === "weapon") {
    const weaponType = values.weapon_type

    // Validate range requirements
    if (weaponType === "ranged" || weaponType === "thrown") {
      if (!values.normal_range && !isCheck) {
        errors.normal_range = `Normal range is required for ${weaponType} weapons`
      }
    }

    // Validate damage entries
    const damageEntries = values.damage || []
    if (damageEntries.length === 0 && !isCheck) {
      errors.damage = "At least one damage entry is required for weapons"
    } else {
      // Convert damage entries to internal format
      for (let i = 0; i < damageEntries.length; i++) {
        const entry = damageEntries[i]
        if (!entry) continue
        damages.push({
          dice: Array(entry.num_dice).fill(entry.die_value),
          type: entry.type,
          versatile: entry.versatile,
        })
      }
    }
  }

  // Early return if validation errors or check mode
  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Prepare data for Zod validation
  const preparedData = { ...values }

  // Full Zod validation
  const result = UpdateItemApiSchema.safeParse(preparedData)

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  let normal_range: number | null = null
  let long_range: number | null = null
  if (
    result.data.category === "weapon" &&
    (result.data.weapon_type === "ranged" || result.data.weapon_type === "thrown")
  ) {
    normal_range = result.data.normal_range
    long_range = result.data.long_range
  }

  // Update the item in a transaction
  try {
    // Build updates object
    const updates: Partial<UpdateItem> = {
      name: result.data.name,
      description: result.data.description,
    }

    if (result.data.category === "armor") {
      updates.armor_type = result.data.armor_type
      updates.armor_class = result.data.armor_class
      updates.armor_class_dex = result.data.armor_class_dex
      updates.armor_class_dex_max = result.data.armor_class_dex_max
    }

    if (result.data.category === "shield") {
      updates.armor_modifier = result.data.armor_modifier
    }

    if (result.data.category === "weapon") {
      updates.thrown = result.data.weapon_type === "thrown"
      updates.finesse = result.data.finesse
      updates.mastery = result.data.mastery
      updates.martial = result.data.martial
      updates.normal_range = normal_range
      updates.long_range = long_range
    }

    // Update the base item
    await updateItemDb(db, itemId, updates)

    // Update damage records for weapons
    if (existingItem.category === "weapon") {
      // Delete existing damage records
      await deleteItemDamageDb(db, itemId)

      // Create new damage records
      for (const dmg of damages) {
        await createItemDamageDb(db, {
          item_id: itemId,
          dice: dmg.dice,
          type: dmg.type,
          versatile: dmg.versatile,
        })
      }
    }

    // Create a char_items entry to track this update in history
    const changedFields: string[] = []
    if (updates.name !== existingItem.name) changedFields.push("name")
    if (updates.description !== existingItem.description) changedFields.push("description")
    if (existingItem.category === "armor") {
      if (updates.armor_type !== existingItem.armor_type) changedFields.push("armor type")
      if (updates.armor_class !== existingItem.armor_class) changedFields.push("armor class")
      if (updates.armor_class_dex !== existingItem.armor_class_dex)
        changedFields.push("dex modifier")
      if (updates.armor_class_dex_max !== existingItem.armor_class_dex_max)
        changedFields.push("max dex")
    }
    if (existingItem.category === "shield") {
      if (updates.armor_modifier !== existingItem.armor_modifier)
        changedFields.push("armor modifier")
    }
    if (existingItem.category === "weapon") {
      if (updates.thrown !== existingItem.thrown) changedFields.push("thrown")
      if (updates.finesse !== existingItem.finesse) changedFields.push("finesse")
      if (updates.mastery !== existingItem.mastery) changedFields.push("mastery")
      if (updates.martial !== existingItem.martial) changedFields.push("martial")
      if (updates.normal_range !== existingItem.normal_range) changedFields.push("range")
      if (damages.length > 0) changedFields.push("damage")
    }

    // Get current worn/wielded state
    const currentState = await db`
      SELECT worn, wielded
      FROM char_items
      WHERE character_id = ${characterId} AND item_id = ${itemId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (changedFields.length > 0) {
      await createCharItemDb(db, {
        character_id: characterId,
        item_id: itemId,
        worn: currentState[0]?.worn || false,
        wielded: currentState[0]?.wielded || false,
        dropped_at: null,
        note: `Updated ${changedFields.join(", ")}`,
      })
    }

    return { complete: true }
  } catch (error) {
    logger.error("Error updating item:", error as Error)
    return {
      complete: false,
      values: data,
      errors: { general: "Failed to update item. Please try again." },
    }
  }
}
