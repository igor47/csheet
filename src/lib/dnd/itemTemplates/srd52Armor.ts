import type { TemplateItem } from "@src/lib/dnd"

/**
 * Armor templates from D&D 5.2.1 SRD
 * Source: SRD_CC_v5.2.1-extracted.md lines 9002-9022
 */
export const srd52Armor: TemplateItem[] = [
  // Light Armor
  {
    name: "Padded Armor",
    category: "armor",
    armor_type: "light",
    armor_class: 11,
    armor_class_dex: true,
    stealth_disadvantage: true,
  },
  {
    name: "Leather Armor",
    category: "armor",
    armor_type: "light",
    armor_class: 11,
    armor_class_dex: true,
  },
  {
    name: "Studded Leather Armor",
    category: "armor",
    armor_type: "light",
    armor_class: 12,
    armor_class_dex: true,
  },

  // Medium Armor
  {
    name: "Hide Armor",
    category: "armor",
    armor_type: "medium",
    armor_class: 12,
    armor_class_dex: true,
    armor_class_dex_max: 2,
  },
  {
    name: "Chain Shirt",
    category: "armor",
    armor_type: "medium",
    armor_class: 13,
    armor_class_dex: true,
    armor_class_dex_max: 2,
  },
  {
    name: "Scale Mail",
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
    name: "Half Plate Armor",
    category: "armor",
    armor_type: "medium",
    armor_class: 15,
    armor_class_dex: true,
    armor_class_dex_max: 2,
    stealth_disadvantage: true,
  },

  // Heavy Armor
  {
    name: "Ring Mail",
    category: "armor",
    armor_type: "heavy",
    armor_class: 14,
    armor_class_dex: false,
    stealth_disadvantage: true,
  },
  {
    name: "Chain Mail",
    category: "armor",
    armor_type: "heavy",
    armor_class: 16,
    armor_class_dex: false,
    min_strength: 13,
    stealth_disadvantage: true,
  },
  {
    name: "Splint Armor",
    category: "armor",
    armor_type: "heavy",
    armor_class: 17,
    armor_class_dex: false,
    min_strength: 15,
    stealth_disadvantage: true,
  },
  {
    name: "Plate Armor",
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
