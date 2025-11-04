import { create as createCharItemDb } from "@src/db/char_items"
import { create as createItemChargeDb } from "@src/db/item_charges"
import { create as createItemDamageDb } from "@src/db/item_damage"
import { create as createItemEffectDb } from "@src/db/item_effects"
import { create as createItemDb } from "@src/db/items"
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

// Base schema for all items
const BaseItemSchema = z.object({
  character_id: z.string(),
  name: z.string().min(1, "Item name is required"),
  description: OptionalString(),
  category: ItemCategorySchema,
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),

  // ignored here, just for template management
  template: z.string().nullable().optional().default(null),
  prev_template: z.string().nullable().optional().default(null),
})
const BaseItemCheckSchema = BaseItemSchema.extend(
  z.object({
    name: z.string(),
    category: EnumField(ItemCategorySchema.nullable()),
  }).shape
).partial()

const BasicItemSchema = z.object({
  category: ItemCategorySchema.exclude(["armor", "shield", "weapon"]),
})

// Shield-specific fields
const ShieldItemSchema = z.object({
  category: ItemCategorySchema.extract(["shield"]),
  armor_modifier: NumberField(z.number().int({ message: "Must be a whole number" })),
})

const ArmorItemSchema = z.object({
  category: ItemCategorySchema.extract(["armor"]),
  armor_type: ArmorTypeSchema,
  armor_class: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(0, { message: "Cannot be negative" })
  ),
  armor_class_dex: Checkbox().optional().default(false),
  armor_class_dex_max: NumberField(
    z.number().int({ message: "Must be a whole number" }).positive().nullable().default(null)
  ),
  min_strength: NumberField(
    z.number().int({ message: "Must be a whole number" }).positive().nullable().default(null)
  ),
  stealth_disadvantage: Checkbox().optional().default(false),
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
const WeaponItemBaseSchema = z.object({
  category: ItemCategorySchema.extract(["weapon"]),

  finesse: Checkbox().optional().default(false),
  mastery: WeaponMasterySchema.nullable().default(null),
  martial: Checkbox().optional().default(false),
  light: Checkbox().optional().default(false),
  heavy: Checkbox().optional().default(false),
  two_handed: Checkbox().optional().default(false),
  reach: Checkbox().optional().default(false),
  loading: Checkbox().optional().default(false),

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
  damage_versatile_0: Checkbox().optional().default(false),
  // Row 1 (optional)
  damage_num_dice_1: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_1: OptionalDieValueField.optional(),
  damage_type_1: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_1: Checkbox().optional().default(false),
  // Row 2 (optional)
  damage_num_dice_2: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_2: OptionalDieValueField.optional(),
  damage_type_2: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_2: Checkbox().optional().default(false),
  // Row 3 (optional)
  damage_num_dice_3: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_3: OptionalDieValueField.optional(),
  damage_type_3: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_3: Checkbox().optional().default(false),
  // Row 4 (optional)
  damage_num_dice_4: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_4: OptionalDieValueField.optional(),
  damage_type_4: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_4: Checkbox().optional().default(false),
  // Row 5 (optional)
  damage_num_dice_5: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_5: OptionalDieValueField.optional(),
  damage_type_5: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_5: Checkbox().optional().default(false),
  // Row 6 (optional)
  damage_num_dice_6: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_6: OptionalDieValueField.optional(),
  damage_type_6: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_6: Checkbox().optional().default(false),
  // Row 7 (optional)
  damage_num_dice_7: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_7: OptionalDieValueField.optional(),
  damage_type_7: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_7: Checkbox().optional().default(false),
  // Row 8 (optional)
  damage_num_dice_8: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_8: OptionalDieValueField.optional(),
  damage_type_8: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_8: Checkbox().optional().default(false),
  // Row 9 (optional)
  damage_num_dice_9: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1).nullable()
  ).optional(),
  damage_die_value_9: OptionalDieValueField.optional(),
  damage_type_9: EnumField(DamageTypeSchema.nullable()),
  damage_versatile_9: Checkbox().optional().default(false),
})

const WeaponItemSchema = z.discriminatedUnion("weapon_type", [
  WeaponItemBaseSchema.extend({
    weapon_type: z.literal("melee"),
  }),
  WeaponItemBaseSchema.extend({
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
  WeaponItemBaseSchema.extend({
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
    starting_ammo: NumberField(
      z
        .number()
        .int({ message: "Must be a whole number" })
        .min(0, { message: "Cannot be negative" })
        .optional()
        .default(0)
    ),
  }),
])

const ItemTypeSchemas = z.discriminatedUnion("category", [
  BasicItemSchema,
  ShieldItemSchema,
  ArmorItemSchema,
  WeaponItemSchema,
])

export const CreateItemApiSchema = ItemTypeSchemas.and(BaseItemSchema)

export type CreateItemData = z.infer<typeof CreateItemApiSchema>

export type CreateItemResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors?: Record<string, string> }

const MAX_DAMAGE_ROWS = 10 as const

/**
 * Creates a new item and adds it to the character's inventory
 */
export async function createItem(
  db: SQL,
  userId: string,
  data: Record<string, string>
): Promise<CreateItemResult> {
  const errors: Record<string, string> = {}
  const partial = ItemTypeSchemas.and(BaseItemCheckSchema).safeParse(data)
  if (!partial.success) {
    return {
      complete: false,
      values: data,
      errors: zodToFormErrors(partial.error),
    }
  }

  const values = partial.data
  const isCheck = data.is_check === "true"

  // Soft validation for check mode
  if (!values.name) {
    if (!isCheck) {
      errors.name = "Item name is required"
    }
  } else if (values.name.trim().length === 0) {
    errors.name = "Item name is required"
  }

  if (!values.category) {
    if (!isCheck) {
      errors.category = "Category is required"
    }
  }

  // Category-specific validation
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

  const damages: { dice: number[]; type: DamageType; versatile: boolean }[] = []

  if (values.category === "weapon") {
    const weaponType = values.weapon_type

    // Validate range requirements
    if (weaponType === "ranged" || weaponType === "thrown") {
      if (!values.normal_range && !isCheck) {
        errors.normal_range = `Normal range is required for ${weaponType} weapons`
      }
    }

    // Validate starting ammo for ranged weapons
    if (weaponType === "ranged") {
      if (values.starting_ammo === undefined && !isCheck) {
        values.starting_ammo = 0 // Default to 0
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
          errors[numDiceField] = `Number of dice is required`
        }
        if (dieValue === undefined) {
          errors[dieValueField] = `Die value is required`
        }
        if (damageType === undefined) {
          errors[damageTypeField] = `Damage type is required`
        }

        // No damage fields provided on row 0
      } else if (i === 0 && !isCheck) {
        errors[numDiceField] = `At least one damage entry is required for weapons`
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
  const result = CreateItemApiSchema.safeParse(preparedData)

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

  // Create the item and related records in a transaction
  try {
    // Create the base item
    const newItem = await createItemDb(db, {
      name: result.data.name,
      description: result.data.description,
      category: result.data.category,
      armor_type: result.data.category === "armor" ? result.data.armor_type : null,
      armor_class: result.data.category === "armor" ? result.data.armor_class : null,
      armor_class_dex: result.data.category === "armor" ? result.data.armor_class_dex : null,
      armor_class_dex_max:
        result.data.category === "armor" ? result.data.armor_class_dex_max : null,
      min_strength: result.data.category === "armor" ? result.data.min_strength : null,

      armor_modifier: result.data.category === "shield" ? result.data.armor_modifier : null,

      thrown: result.data.category === "weapon" ? result.data.weapon_type === "thrown" : false,
      finesse: result.data.category === "weapon" ? result.data.finesse : false,
      mastery: result.data.category === "weapon" ? result.data.mastery : null,
      martial: result.data.category === "weapon" ? result.data.martial : false,
      light: result.data.category === "weapon" ? result.data.light : false,
      heavy: result.data.category === "weapon" ? result.data.heavy : false,
      two_handed: result.data.category === "weapon" ? result.data.two_handed : false,
      reach: result.data.category === "weapon" ? result.data.reach : false,
      loading: result.data.category === "weapon" ? result.data.loading : false,

      normal_range,
      long_range,

      created_by: userId,
    })

    // Create damage records for weapons
    for (const dmg of damages) {
      await createItemDamageDb(db, {
        item_id: newItem.id,
        dice: dmg.dice,
        type: dmg.type,
        versatile: dmg.versatile,
      })
    }

    // Create starting ammo charges if applicable
    if (result.data.category === "weapon" && result.data.weapon_type === "ranged") {
      await createItemChargeDb(db, {
        item_id: newItem.id,
        delta: result.data.starting_ammo,
        note: "Starting ammunition",
      })
    }

    // Create stealth disadvantage effect if applicable
    if (result.data.category === "armor" && result.data.stealth_disadvantage) {
      await createItemEffectDb(db, {
        item_id: newItem.id,
        target: "stealth",
        op: "disadvantage",
        value: null,
        applies: "worn",
      })
    }

    // Add item to character's inventory
    await createCharItemDb(db, {
      character_id: result.data.character_id,
      item_id: newItem.id,
      worn: false,
      wielded: false,
      dropped_at: null,
      note: result.data.note,
    })

    return { complete: true }
  } catch (error) {
    logger.error("Error creating item:", error as Error)
    return {
      complete: false,
      values: data,
      errors: { general: "Failed to create item. Please try again." },
    }
  }
}
