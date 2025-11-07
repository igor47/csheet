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
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  Checkbox,
  EnumField,
  NumberField,
  NumericEnumField,
  ObjectArrayField,
  OptionalString,
} from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// Base schema for all items
export const BaseItemSchema = z.object({
  character_id: z.string(),
  name: z.string().min(1, "Item name is required"),
  description: OptionalString(),
  category: ItemCategorySchema,
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
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

  // Damage entries using ObjectArrayField (at least one required for weapons)
  damage: ObjectArrayField(DamageEntrySchema),
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

export const ItemTypeSchemas = z.discriminatedUnion("category", [
  BasicItemSchema,
  ShieldItemSchema,
  ArmorItemSchema,
  WeaponItemSchema,
])

export const CreateItemApiSchema = ItemTypeSchemas.and(BaseItemSchema)

export type CreateItemData = z.infer<typeof CreateItemApiSchema>

export type CreateItemResult = ServiceResult<{
  id: string
  name: string
  category: string
}>

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
  const result = CreateItemApiSchema.safeParse(preparedData)

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

  // Create the base item
  const newItem = await createItemDb(db, {
    name: result.data.name,
    description: result.data.description,
    category: result.data.category,
    armor_type: result.data.category === "armor" ? result.data.armor_type : null,
    armor_class: result.data.category === "armor" ? result.data.armor_class : null,
    armor_class_dex: result.data.category === "armor" ? result.data.armor_class_dex : null,
    armor_class_dex_max: result.data.category === "armor" ? result.data.armor_class_dex_max : null,
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

  return {
    complete: true,
    result: {
      id: newItem.id,
      name: newItem.name,
      category: newItem.category,
    },
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

export const createItemToolName = "create_item" as const

// Flat schema with all fields optional (service validates category-specific requirements)
// Reuses schemas from above to avoid duplication
const CreateItemToolSchema = z.object({
  // Base fields from BaseItemSchema (excluding internal fields)
  character_id: BaseItemSchema.shape.character_id,
  name: BaseItemSchema.shape.name,
  description: BaseItemSchema.shape.description,
  category: BaseItemSchema.shape.category,
  note: BaseItemSchema.shape.note,

  // Weapon-specific fields from WeaponItemBaseSchema
  weapon_type: z.enum(["melee", "ranged", "thrown"]).optional(),
  damage: WeaponItemBaseSchema.shape.damage.optional(),
  finesse: WeaponItemBaseSchema.shape.finesse.optional(),
  mastery: WeaponItemBaseSchema.shape.mastery.optional(),
  martial: WeaponItemBaseSchema.shape.martial.optional(),
  light: WeaponItemBaseSchema.shape.light.optional(),
  heavy: WeaponItemBaseSchema.shape.heavy.optional(),
  two_handed: WeaponItemBaseSchema.shape.two_handed.optional(),
  reach: WeaponItemBaseSchema.shape.reach.optional(),
  loading: WeaponItemBaseSchema.shape.loading.optional(),
  // Range fields from the discriminated union variants (made optional)
  normal_range: NumberField(
    z.number().int({ message: "Must be a whole number" }).positive().optional()
  ),
  long_range: NumberField(
    z.number().int({ message: "Must be a whole number" }).positive().optional()
  ),
  starting_ammo: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(0).optional()
  ),

  // Armor-specific fields from ArmorItemSchema
  armor_type: ArmorItemSchema.shape.armor_type.optional(),
  armor_class: ArmorItemSchema.shape.armor_class.optional(),
  armor_class_dex: ArmorItemSchema.shape.armor_class_dex.optional(),
  armor_class_dex_max: ArmorItemSchema.shape.armor_class_dex_max.optional(),
  min_strength: ArmorItemSchema.shape.min_strength.optional(),
  stealth_disadvantage: ArmorItemSchema.shape.stealth_disadvantage.optional(),

  // Shield-specific fields from ShieldItemSchema
  armor_modifier: ShieldItemSchema.shape.armor_modifier.optional(),
})

/**
 * Vercel AI SDK tool definition for item creation
 * This tool requires approval before execution
 */
export const createItemTool = tool({
  name: createItemToolName,
  description: [
    "Create a new item and add it to the character's inventory.",
    "The item will be added to inventory but not equipped.",
    "You can create weapons, armor, shields, or misc items. For weapons, you must specify damage dice.",
    "For armor, you must specify armor_class and armor_type. For shields, you must specify armor_modifier.",
    "For common items, you can use lookup_item_template tool first to get item details from the SRD, then pass those details here.",
  ].join(" "),
  inputSchema: CreateItemToolSchema,
})

/**
 * Execute the create_item tool from AI assistant
 * Converts AI parameters to service format and calls createItem
 */
export async function executeCreateItem(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert all parameters to string format for the service
  const data: Record<string, string> = {}

  // Convert each parameter to string, handling all the possible fields
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== null && value !== undefined) {
      data[key] = value.toString()
    }
  }

  // Add is_check flag
  data.is_check = isCheck ? "true" : "false"

  // Call the existing createItem service and return its result directly
  return createItem(db, char.user_id, data)
}

/**
 * Format approval message for create_item tool calls
 */
export function formatCreateItemApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { name, category, description } = parameters
  let message = `Create ${category}: ${name}`

  // Add category-specific details
  if (category === "weapon") {
    const weaponDetails = []
    if (parameters.weapon_type) {
      weaponDetails.push(parameters.weapon_type)
    }
    if (parameters.martial) {
      weaponDetails.push("martial")
    }
    if (parameters.finesse) {
      weaponDetails.push("finesse")
    }
    if (parameters.two_handed) {
      weaponDetails.push("two-handed")
    }

    // Add damage info from damage array
    if (parameters.damage && Array.isArray(parameters.damage) && parameters.damage.length > 0) {
      const damageStrings = parameters.damage.map((dmg) => {
        const dice = `${dmg.num_dice}d${dmg.die_value}`
        const type = dmg.type || ""
        const versatile = dmg.versatile ? " (versatile)" : ""
        return `${dice} ${type}${versatile}`
      })
      weaponDetails.push(...damageStrings)
    }

    if (weaponDetails.length > 0) {
      message += ` (${weaponDetails.join(", ")})`
    }
  } else if (category === "armor") {
    const armorDetails = []
    if (parameters.armor_type) {
      armorDetails.push(parameters.armor_type)
    }
    if (parameters.armor_class) {
      armorDetails.push(`AC ${parameters.armor_class}`)
    }
    if (parameters.stealth_disadvantage) {
      armorDetails.push("stealth disadvantage")
    }
    if (armorDetails.length > 0) {
      message += ` (${armorDetails.join(", ")})`
    }
  } else if (category === "shield") {
    if (parameters.armor_modifier) {
      message += ` (+${parameters.armor_modifier} AC)`
    }
  }

  if (description) {
    message += `\n${description}`
  }

  return message
}
