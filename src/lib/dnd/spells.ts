import type { AbilityType, ClassNameType } from "@src/lib/dnd"
import { z } from "zod"
import type { RulesetId } from "./rulesets"
import { srd51Spells } from "./spells/srd51"
import { srd52Spells } from "./spells/srd52"

export const SpellSchools = [
  "abjuration",
  "conjuration",
  "divination",
  "enchantment",
  "evocation",
  "illusion",
  "necromancy",
  "transmutation",
] as const
export const SpellSchoolsSchema = z.enum(SpellSchools)
export type SpellSchoolType = z.infer<typeof SpellSchoolsSchema>

export const DamageTypes = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const
export const DamageTypesSchema = z.enum(DamageTypes)
export type DamageType = z.infer<typeof DamageTypesSchema>

// Each element is a single die's number of sides. 3d8 -> [8,8,8]. 2d6+1 -> dice [6,6], flatBonus 1.
export type Dice = number[]

// --- Casting time, range, duration ---

export type CastingTime =
  | { type: "action" }
  | { type: "bonusAction"; trigger?: string } // e.g., "on your turn"
  | { type: "reaction"; trigger?: string } // e.g., "when a creature you can see attacks you"
  | { type: "minutes"; value: number }
  | { type: "hours"; value: number }

export type AreaOfEffect =
  | { shape: "sphere"; radius: number; origin?: "self" | "point" }
  | { shape: "cube"; size: number; origin?: "self" | "point" } // edge length
  | { shape: "cone"; length: number; origin?: "self" | "point" }
  | { shape: "cylinder"; radius: number; height: number; origin?: "self" | "point" }
  | { shape: "line"; length: number; width: number; origin?: "self" | "point" }

export type Range =
  | { type: "self" } // only affects the caster
  | { type: "touch" }
  | { type: "distance"; feet: number } // normalize to feet for simplicity
  | { type: "special"; text: string }

export type Duration =
  | { type: "instantaneous" }
  // Concentration spells exist in 5e and always have a maximum duration (e.g., "Concentration, up to 1 minute").
  // Model them explicitly with a max duration the caster can sustain by concentrating.
  | { type: "concentration"; max: { value: number; unit: "round" | "minute" | "hour" } }
  | { type: "timed"; value: number; unit: "round" | "minute" | "hour" | "day" }
  | { type: "untilDispelled" }
  | { type: "special"; text: string }

// --- Components ---

export type Components = {
  verbal: boolean
  somatic: boolean
  material?: {
    description: string
    consumed?: boolean
    costGP?: number
  }
}

// --- Targets & resolution ---

export type Target =
  | { type: "self" }
  | {
      type: "creature"
      count?: number | "any"
      friendlyOnly?: boolean
      selection?: "choose" | "all"
    }
  | { type: "object"; count?: number | "any" }
  | { type: "area"; area: AreaOfEffect }
  | { type: "point" }
  | { type: "special"; text: string }

export type Resolution =
  | { kind: "save"; ability: AbilityType; onSuccess?: "none" | "half" | "negates" | "partial" }
  | { kind: "attack"; attackType: "meleeSpell" | "rangedSpell" | "meleeWeapon" | "rangedWeapon" }
  | { kind: "none" }

// --- Damage & scaling ---

export type DamageEntry = {
  type: DamageType
  dice?: Dice
  /**
   * Flat, unconditional modifier added to the final damage total *after* rolling `dice`.
   * Example: "2d6 + 3" -> dice: [6,6], flatBonus: 3.
   * Ability modifiers or save/half are modeled elsewhere; this is just a literal numeric addend.
   */
  flatBonus?: number
  notes?: string
}

export type DamageScaling =
  | {
      // e.g., Fireball scaling by slot: at slot 4 -> 9d6, etc.
      mode: "perSlotLevel"
      progression: Record<number, Dice> // key = slot level, value = dice at that slot
    }
  | {
      // e.g., cantrip scaling by character level thresholds
      mode: "characterLevel"
      progression: Record<number, Dice> // key = character level threshold
    }

// --- The main Spell type ---

export interface Spell {
  // Identity
  id: string
  name: string
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  school: SpellSchoolType

  // Descriptions
  briefDescription: string // 1–2 sentence summary for list views/cards
  description: string // full rules text / SRD text
  atHigherLevelsText?: string

  // Casting details
  castingTime: CastingTime
  range: Range
  components: Components
  duration: Duration

  /**
   * Ritual casting: if true, the spell can be cast as a ritual.
   * In 5e, ritual casting time is always the normal casting time + 10 minutes.
   * You usually don’t need to store the extra time; compute it when you render.
   */
  ritual?: boolean

  // Targeting / mechanics
  target?: Target
  resolution: Resolution

  // Damage / healing (optional)
  damage?: DamageEntry[]
  damageScaling?: DamageScaling
  healingDice?: Dice // e.g., Cure Wounds: [8] at base, mod handled by your resolver
  tempHPDice?: Dice

  // Conditions & tags
  conditionsInflicted?: string[]
  classes: ClassNameType[]
  source?: "SRD" | "Homebrew" | string
  tags?: string[]
}

/** The spell catalog for a ruleset */
export function getSpells(ruleset: RulesetId): Spell[] {
  return ruleset === "srd52" ? srd52Spells : srd51Spells
}

/** A spell in a ruleset's catalog */
export function getSpellById(ruleset: RulesetId, id: string): Spell | undefined {
  return getSpells(ruleset).find((s) => s.id === id)
}

/** TEMPORARY: the 5.2 catalog, until callers pass a ruleset */
export const spells = srd52Spells
