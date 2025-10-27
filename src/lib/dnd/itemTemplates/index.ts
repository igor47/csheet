import type { TemplateItem } from "@src/lib/dnd"
import { srd51Armor } from "./srd51Armor"
import { srd51Weapons } from "./srd51Weapons"
import { srd52Armor } from "./srd52Armor"
import { srd52Weapons } from "./srd52Weapons"

export type RulesetId = "srd51" | "srd52"

/**
 * Get weapon templates for a specific ruleset
 */
export function getWeaponTemplates(ruleset: RulesetId): TemplateItem[] {
  return ruleset === "srd52" ? srd52Weapons : srd51Weapons
}

/**
 * Get armor templates for a specific ruleset
 */
export function getArmorTemplates(ruleset: RulesetId): TemplateItem[] {
  return ruleset === "srd52" ? srd52Armor : srd51Armor
}

/**
 * Get all item templates for a specific ruleset, grouped by category
 */
export function getAllItemTemplates(ruleset: RulesetId): TemplateItem[] {
  return [...getWeaponTemplates(ruleset), ...getArmorTemplates(ruleset)]
}

/**
 * Get a specific template by name
 */
export function getTemplateByName(ruleset: RulesetId, name: string): TemplateItem | undefined {
  const allTemplates = getAllItemTemplates(ruleset)
  return allTemplates.find((t) => t.name === name)
}

/**
 * Get templates grouped by category for easier UI rendering
 */
export interface GroupedTemplates {
  weapons: TemplateItem[]
  armor: TemplateItem[]
  shields: TemplateItem[]
}

export function getGroupedTemplates(ruleset: RulesetId): GroupedTemplates {
  const weapons = getWeaponTemplates(ruleset)
  const armor = getArmorTemplates(ruleset)

  return {
    weapons: weapons.filter((t) => t.category === "weapon"),
    armor: armor.filter((t) => t.category === "armor"),
    shields: armor.filter((t) => t.category === "shield"),
  }
}
