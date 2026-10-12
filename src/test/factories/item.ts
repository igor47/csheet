import { faker } from "@faker-js/faker"
import { create as createCharItem } from "@src/db/char_items"
import { create as createItemDamage } from "@src/db/item_damage"
import type { Item } from "@src/db/items"
import { create as createItem } from "@src/db/items"
import type { ArmorTypeType, DamageTypeType, ItemCategoryType } from "@src/lib/dnd"
import type { SQL } from "bun"
import { Factory } from "fishery"

interface ItemFactoryParams {
  character_id: string
  user_id: string
  name: string
  description: string | null
  category: ItemCategoryType
  weapon_type: "melee" | "ranged" | "thrown" | null
  worn: boolean
  wielded: boolean
  // Armor properties
  armor_type: ArmorTypeType | null
  armor_class: number | null
  armor_class_dex: boolean
  armor_class_dex_max: number | null
  // Shield properties
  armor_modifier: number | null
  // Weapon properties
  normal_range: number | null
  long_range: number | null
  thrown: boolean
  finesse: boolean
  martial: boolean
  light: boolean
  damage: { dice: number[]; type: DamageTypeType; versatile?: boolean; flat_bonus?: number }[]
}

const factory = Factory.define<ItemFactoryParams>(({ params }) => ({
  character_id: params.character_id ?? "",
  user_id: params.user_id ?? "",
  name: params.name ?? faker.commerce.productName(),
  description: params.description ?? null,
  category: params.category ?? "gear",
  weapon_type: params.weapon_type ?? null,
  worn: params.worn ?? false,
  wielded: params.wielded ?? false,
  // Armor properties
  armor_type: params.armor_type ?? null,
  armor_class: params.armor_class ?? null,
  armor_class_dex: params.armor_class_dex ?? false,
  armor_class_dex_max: params.armor_class_dex_max ?? null,
  // Shield properties
  armor_modifier: params.armor_modifier ?? null,
  // Weapon properties
  normal_range: params.normal_range ?? null,
  long_range: params.long_range ?? null,
  thrown: params.thrown ?? false,
  finesse: params.finesse ?? false,
  martial: params.martial ?? false,
  light: params.light ?? false,
  damage: params.damage ?? [],
}))

interface ItemWithCharId extends Item {
  character_id?: string
}

/**
 * Create a test item in the database, linked to a character
 * Usage:
 *   const item = await itemFactory.create({ character_id: character.id, user_id: user.id }, testCtx.db)
 *   const weapon = await itemFactory.create({ character_id: character.id, user_id: user.id, category: 'weapon' }, testCtx.db)
 *   const bow = await itemFactory.create({ ..., category: 'weapon', normal_range: 80, long_range: 320,
 *     damage: [{ dice: [6], type: 'piercing' }] }, testCtx.db)
 */
export const itemFactory = {
  build: factory.build.bind(factory),
  create: async (params: Partial<ItemFactoryParams>, db: SQL): Promise<ItemWithCharId> => {
    const built = factory.build(params)

    if (!built.character_id) {
      throw new Error("character_id is required to create an item")
    }

    if (!built.user_id) {
      throw new Error("user_id is required to create an item")
    }

    // Create the item itself
    const item = await createItem(db, {
      name: built.name,
      description: built.description,
      category: built.category,
      created_by: built.user_id,
      // Armor properties
      armor_type: built.armor_type,
      armor_class: built.armor_class,
      armor_class_dex: built.armor_class_dex,
      armor_class_dex_max: built.armor_class_dex_max,
      // Shield properties
      armor_modifier: built.armor_modifier,
      // Weapon properties
      normal_range: built.normal_range,
      long_range: built.long_range,
      thrown: built.thrown,
      finesse: built.finesse,
      mastery: null,
      martial: built.martial,
      light: built.light,
      heavy: false,
      two_handed: false,
      reach: false,
      loading: false,
      min_strength: null,
    })

    for (const damage of built.damage) {
      await createItemDamage(db, {
        item_id: item.id,
        dice: damage.dice,
        type: damage.type,
        versatile: damage.versatile ?? false,
        flat_bonus: damage.flat_bonus ?? null,
      })
    }

    // Link the item to the character's inventory
    await createCharItem(db, {
      character_id: built.character_id,
      item_id: item.id,
      worn: built.worn,
      wielded: built.wielded,
      dropped_at: null,
      note: null,
    })

    return { ...item, character_id: built.character_id }
  },
}
