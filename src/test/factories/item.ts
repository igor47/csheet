import { faker } from "@faker-js/faker"
import { create as createCharItem } from "@src/db/char_items"
import type { Item } from "@src/db/items"
import { create as createItem } from "@src/db/items"
import type { ItemCategoryType } from "@src/lib/dnd"
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
}))

interface ItemWithCharId extends Item {
  character_id?: string
}

/**
 * Create a test item in the database, linked to a character
 * Usage:
 *   const item = await itemFactory.create({ character_id: character.id, user_id: user.id }, testCtx.db)
 *   const weapon = await itemFactory.create({ character_id: character.id, user_id: user.id, category: 'weapon' }, testCtx.db)
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
      // Set default values for optional fields
      armor_type: null,
      armor_class: null,
      armor_class_dex: false,
      armor_class_dex_max: null,
      armor_modifier: null,
      normal_range: null,
      long_range: null,
      thrown: false,
      finesse: false,
      mastery: null,
      martial: false,
      light: false,
      heavy: false,
      two_handed: false,
      reach: false,
      loading: false,
      min_strength: null,
    })

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
