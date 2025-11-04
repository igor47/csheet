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
import { parsedToForm, zodToFormErrors } from "@src/lib/formErrors"
import {
  Checkbox,
  EnumField,
  NumberField,
  NumericEnumField,
  OptionalString,
} from "@src/lib/formSchemas"
import { logger } from "@src/lib/logger"
import type { SQL } from "bun"
import { z } from "zod"

// Base schema for item updates (category is NOT editable)
const BaseItemUpdateSchema = z.object({
  item_id: z.string(),
  character_id: z.string(),
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

const DamageDice = [4, 6, 8, 10, 12, 20, 100] as const
const NumDiceField = NumberField(
  z.number().int({ message: "Must be a whole number" }).min(1, { message: "Must be at least 1" })
)
const DieValueField = NumericEnumField(
  z.union(DamageDice.map((n) => z.literal(n)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]])
)
const OptionalDieValueField = NumericEnumField(
  z
    .union(DamageDice.map((n) => z.literal(n)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]])
    .nullable()
)

// Weapon-specific fields
const WeaponItemBaseUpdateSchema = z.object({
  category: ItemCategorySchema.extract(["weapon"]),

  finesse: Checkbox().optional().default(false),
  mastery: WeaponMasterySchema.nullable().default(null),
  martial: Checkbox().optional().default(false),

  damage_row_count: NumberField(
    z
      .number()
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must be at least 1" })
      .max(10, { message: "Cannot exceed 10" })
      .optional()
      .default(1)
  ),

  // Row 0 (required)
  damage_num_dice_0: NumDiceField,
  damage_die_value_0: DieValueField,
  damage_type_0: DamageTypeSchema,
  // Row 1-9 (optional)
  damage_num_dice_1: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_1: OptionalDieValueField.optional(),
  damage_type_1: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_2: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_2: OptionalDieValueField.optional(),
  damage_type_2: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_3: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_3: OptionalDieValueField.optional(),
  damage_type_3: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_4: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_4: OptionalDieValueField.optional(),
  damage_type_4: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_5: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_5: OptionalDieValueField.optional(),
  damage_type_5: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_6: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_6: OptionalDieValueField.optional(),
  damage_type_6: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_7: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_7: OptionalDieValueField.optional(),
  damage_type_7: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_8: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_8: OptionalDieValueField.optional(),
  damage_type_8: EnumField(DamageTypeSchema.nullable()),
  damage_num_dice_9: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_9: OptionalDieValueField.optional(),
  damage_type_9: EnumField(DamageTypeSchema.nullable()),
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

const MAX_DAMAGE_ROWS = 10 as const

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

  // Add item_id, character_id, and category to data
  data.item_id = itemId
  data.character_id = characterId
  data.category = existingItem.category

  const isCheck = data.is_check === "true"

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

    // Validate damage
    for (let i = 0; i < MAX_DAMAGE_ROWS; i++) {
      const numDiceField = `damage_num_dice_${i}` as keyof typeof values
      const numDice = values[numDiceField] as number | undefined

      const dieValueField = `damage_die_value_${i}` as keyof typeof values
      const dieValue = values[dieValueField] as number | undefined

      const damageTypeField = `damage_type_${i}` as keyof typeof values
      const damageType = values[damageTypeField] as DamageType | undefined

      const versatileField = `damage_versatile_${i}` as keyof typeof values
      const versatile = (values[versatileField] as boolean | undefined) || false

      const damageVals = [numDice, dieValue, damageType]

      // All damage fields provided
      if (damageVals.every((v) => v !== undefined)) {
        damages.push({
          dice: Array(numDice!).fill(dieValue!),
          type: damageType!,
          versatile,
        })

        // Some but not all damage fields provided
      } else if (damageVals.some((v) => v !== undefined)) {
        if (numDice === undefined) {
          errors[numDiceField] = "Number of dice is required"
        }
        if (dieValue === undefined) {
          errors[dieValueField] = "Die value is required"
        }
        if (damageType === undefined) {
          errors[damageTypeField] = "Damage type is required"
        }

        // No damage fields provided on row 0
      } else if (i === 0 && !isCheck) {
        errors[numDiceField] = "At least one damage entry is required for weapons"
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
    return { complete: false, values: parsedToForm(values), errors: zodToFormErrors(result.error) }
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
