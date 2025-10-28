import type { TemplateItem } from "@src/lib/dnd"

/**
 * Armor templates from D&D 5.1 SRD
 * Source: SRD_CC_v5.1-extracted.md lines 4451-4469
 */
export const srd51Armor: TemplateItem[] = [
  // Light Armor
  {
    name: "Padded",
    category: "armor",
    armor_type: "light",
    armor_class: 11,
    armor_class_dex: true,
    stealth_disadvantage: true,
  },
  {
    name: "Leather",
    category: "armor",
    armor_type: "light",
    armor_class: 11,
    armor_class_dex: true,
  },
  {
    name: "Studded leather",
    category: "armor",
    armor_type: "light",
    armor_class: 12,
    armor_class_dex: true,
  },

  // Medium Armor
  {
    name: "Hide",
    category: "armor",
    armor_type: "medium",
    armor_class: 12,
    armor_class_dex: true,
    armor_class_dex_max: 2,
  },
  {
    name: "Chain shirt",
    category: "armor",
    armor_type: "medium",
    armor_class: 13,
    armor_class_dex: true,
    armor_class_dex_max: 2,
  },
  {
    name: "Scale mail",
    category: "armor",
    armor_type: "medium",
    armor_class: 14,
    armor_class_dex: true,
    armor_class_dex_max: 2,
    stealth_disadvantage: true,
  },
  {
    name: "Breastplate",
    category: "armor",
    armor_type: "medium",
    armor_class: 14,
    armor_class_dex: true,
    armor_class_dex_max: 2,
  },
  {
    name: "Half plate",
    category: "armor",
    armor_type: "medium",
    armor_class: 15,
    armor_class_dex: true,
    armor_class_dex_max: 2,
    stealth_disadvantage: true,
  },

  // Heavy Armor
  {
    name: "Ring mail",
    category: "armor",
    armor_type: "heavy",
    armor_class: 14,
    armor_class_dex: false,
    stealth_disadvantage: true,
  },
  {
    name: "Chain mail",
    category: "armor",
    armor_type: "heavy",
    armor_class: 16,
    armor_class_dex: false,
    min_strength: 13,
    stealth_disadvantage: true,
  },
  {
    name: "Splint",
    category: "armor",
    armor_type: "heavy",
    armor_class: 17,
    armor_class_dex: false,
    min_strength: 15,
    stealth_disadvantage: true,
  },
  {
    name: "Plate",
    category: "armor",
    armor_type: "heavy",
    armor_class: 18,
    armor_class_dex: false,
    min_strength: 15,
    stealth_disadvantage: true,
  },

  // Shield
  {
    name: "Shield",
    category: "shield",
    armor_modifier: 2,
  },
]
