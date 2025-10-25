import type { ItemDamage } from "@src/db/item_damage"
import type { ItemEffect } from "@src/db/item_effects"
import type { ArmorTypeType, ItemCategoryType, WeaponMasteryType } from "@src/lib/dnd"
import type { SQL } from "bun"

export interface EquippedComputedItem {
  // Base item fields
  id: string
  name: string
  description: string | null
  category: ItemCategoryType
  armor_type: ArmorTypeType | null
  armor_class: number | null
  armor_class_dex: boolean
  armor_class_dex_max: number | null
  armor_modifier: number | null
  normal_range: number | null
  long_range: number | null
  thrown: boolean
  finesse: boolean
  mastery: WeaponMasteryType | null
  martial: boolean
  created_by: string
  created_at: Date
  updated_at: Date

  // Computed fields
  wearable: boolean
  wieldable: boolean
  ammunition: number | null
  useVerb: string
  currentCharges: number

  // Equipment state
  worn: boolean
  wielded: boolean

  // Related data
  damage: ItemDamage[]
  effects: ItemEffect[]
}

/**
 * Compute all items currently possessed by a character with a single JOIN query
 */
export async function computeCharacterItems(
  db: SQL,
  characterId: string
): Promise<EquippedComputedItem[]> {
  const result = await db`
    WITH ranked_char_items AS (
      SELECT
        item_id,
        worn,
        wielded,
        dropped_at,
        ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY created_at DESC) as rn
      FROM char_items
      WHERE character_id = ${characterId}
    ),
    current_char_items AS (
      SELECT item_id, worn, wielded
      FROM ranked_char_items
      WHERE rn = 1 AND dropped_at IS NULL
    ),
    charge_totals AS (
      SELECT
        item_id,
        COALESCE(SUM(delta), 0) as total_charges
      FROM item_charges
      WHERE item_id IN (SELECT item_id FROM current_char_items)
      GROUP BY item_id
    )
    SELECT
      i.*,
      ci.worn,
      ci.wielded,
      COALESCE(ct.total_charges, 0) as current_charges,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', effs.id,
            'item_id', effs.item_id,
            'target', effs.target,
            'op', effs.op,
            'value', effs.value,
            'applies', effs.applies,
            'created_at', effs.created_at
          )
        ) FILTER (WHERE effs.id IS NOT NULL),
        '[]'
      ) as effects,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', dmgs.id,
            'item_id', dmgs.item_id,
            'dice', dmgs.dice,
            'type', dmgs.type,
            'created_at', dmgs.created_at
          )
        ) FILTER (WHERE dmgs.id IS NOT NULL),
        '[]'
      ) as damage
    FROM current_char_items ci
    JOIN items i ON i.id = ci.item_id
    LEFT JOIN item_effects effs ON effs.item_id = i.id
    LEFT JOIN item_damage dmgs ON dmgs.item_id = i.id
    LEFT JOIN charge_totals ct ON ct.item_id = i.id
    GROUP BY i.id, ci.worn, ci.wielded, ct.total_charges
  `

  // Parse and compute derived fields
  return result.map((row: any) => {
    const category = row.category as ItemCategoryType

    // Determine if item is wearable
    const wearable = ["clothing", "jewelry", "armor"].includes(category)

    // Determine if item is wieldable
    const wieldable = ["weapon", "shield", "wand"].includes(category)

    // Determine ammunition (for ranged non-thrown weapons, ammunition = charges)
    const ammunition =
      category === "weapon" && row.normal_range && !row.thrown ? row.current_charges : null

    // Determine use verb
    let useVerb = "use"
    if (category === "potion") {
      useVerb = "drink"
    } else if (category === "scroll") {
      useVerb = "read"
    } else if (category === "weapon" && row.thrown) {
      useVerb = "throw"
    }

    // Parse effects with proper date handling
    const effects: ItemEffect[] = row.effects.map((e: any) => ({
      ...e,
      created_at: new Date(e.created_at),
    }))

    // Parse damage with proper date handling
    const damage: ItemDamage[] = row.damage.map((d: any) => ({
      ...d,
      created_at: new Date(d.created_at),
    }))

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category,
      armor_type: row.armor_type,
      armor_class: row.armor_class,
      armor_class_dex: row.armor_class_dex,
      armor_class_dex_max: row.armor_class_dex_max,
      armor_modifier: row.armor_modifier,
      normal_range: row.normal_range,
      long_range: row.long_range,
      thrown: row.thrown,
      finesse: row.finesse,
      mastery: row.mastery,
      martial: row.martial,
      created_by: row.created_by,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      wearable,
      wieldable,
      ammunition,
      useVerb,
      currentCharges: row.current_charges,
      worn: row.worn,
      wielded: row.wielded,
      damage,
      effects,
    }
  })
}
