import { z } from "zod"

export const Sizes = ["tiny", "small", "medium", "large", "huge", "gargantuan"] as const
export const SizeSchema = z.enum(Sizes)
export type SizeType = z.infer<typeof SizeSchema>

export const HitDice = [6, 8, 10, 12] as const
export type HitDieType = (typeof HitDice)[number]

export const SpellLevel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const
export type SpellLevelType = (typeof SpellLevel)[number]
export type SpellSlotsType = SpellLevelType[]

export const Abilities = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const
export const AbilitySchema = z.enum(Abilities)
export type AbilityType = z.infer<typeof AbilitySchema>

// Point buy cost table (score -> cost in points)
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

// Standard Array by Class - official recommendations from SRD 5.2
export const STANDARD_ARRAY_BY_CLASS: Record<ClassNameType, Record<AbilityType, number>> = {
  barbarian: {
    strength: 15,
    dexterity: 13,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 8,
  },
  bard: {
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 13,
    wisdom: 10,
    charisma: 15,
  },
  cleric: {
    strength: 14,
    dexterity: 8,
    constitution: 13,
    intelligence: 10,
    wisdom: 15,
    charisma: 12,
  },
  druid: {
    strength: 8,
    dexterity: 12,
    constitution: 14,
    intelligence: 13,
    wisdom: 15,
    charisma: 10,
  },
  fighter: {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 8,
    wisdom: 10,
    charisma: 12,
  },
  monk: {
    strength: 12,
    dexterity: 15,
    constitution: 13,
    intelligence: 10,
    wisdom: 14,
    charisma: 8,
  },
  paladin: {
    strength: 15,
    dexterity: 10,
    constitution: 13,
    intelligence: 8,
    wisdom: 12,
    charisma: 14,
  },
  ranger: {
    strength: 12,
    dexterity: 15,
    constitution: 13,
    intelligence: 8,
    wisdom: 14,
    charisma: 10,
  },
  rogue: {
    strength: 12,
    dexterity: 15,
    constitution: 13,
    intelligence: 14,
    wisdom: 10,
    charisma: 8,
  },
  sorcerer: {
    strength: 10,
    dexterity: 13,
    constitution: 14,
    intelligence: 8,
    wisdom: 12,
    charisma: 15,
  },
  warlock: {
    strength: 8,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 15,
  },
  wizard: {
    strength: 8,
    dexterity: 12,
    constitution: 13,
    intelligence: 15,
    wisdom: 14,
    charisma: 10,
  },
}

export const Skills = [
  "acrobatics",
  "animal handling",
  "arcana",
  "athletics",
  "deception",
  "history",
  "insight",
  "intimidation",
  "investigation",
  "medicine",
  "nature",
  "perception",
  "performance",
  "persuasion",
  "religion",
  "sleight of hand",
  "stealth",
  "survival",
] as const
export const SkillSchema = z.enum(Skills)
export type SkillType = z.infer<typeof SkillSchema>

export const ProficiencyLevels = ["none", "half", "proficient", "expert"] as const
export const ProficiencyLevelSchema = z.enum(ProficiencyLevels)
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelSchema>

export const ItemCategories = [
  "weapon",
  "armor",
  "shield",
  "clothing",
  "jewelry",
  "potion",
  "scroll",
  "gear",
  "tool",
  "container",
  "wand",
  "misc",
] as const
export const ItemCategorySchema = z.enum(ItemCategories)
export type ItemCategoryType = z.infer<typeof ItemCategorySchema>

export const ArmorTypes = ["light", "medium", "heavy"] as const
export const ArmorTypeSchema = z.enum(ArmorTypes)
export type ArmorTypeType = z.infer<typeof ArmorTypeSchema>

export const WeaponMasteries = [
  "cleave",
  "graze",
  "nick",
  "push",
  "sap",
  "slow",
  "topple",
  "vex",
] as const
export const WeaponMasterySchema = z.enum(WeaponMasteries)
export type WeaponMasteryType = z.infer<typeof WeaponMasterySchema>

export const DamageTypes = [
  "slashing",
  "piercing",
  "bludgeoning",
  "fire",
  "cold",
  "lightning",
  "thunder",
  "acid",
  "radiant",
  "necrotic",
  "force",
  "poison",
  "psychic",
] as const
export const DamageTypeSchema = z.enum(DamageTypes)
export type DamageTypeType = z.infer<typeof DamageTypeSchema>

export const ItemEffectOps = [
  "add",
  "set",
  "advantage",
  "disadvantage",
  "proficiency",
  "expertise",
] as const
export const ItemEffectOpSchema = z.enum(ItemEffectOps)
export type ItemEffectOpType = z.infer<typeof ItemEffectOpSchema>

export const ItemEffectApplies = ["worn", "wielded"] as const
export const ItemEffectAppliesSchema = z.enum(ItemEffectApplies)
export type ItemEffectAppliesType = z.infer<typeof ItemEffectAppliesSchema>

export const ItemEffectTargets = [
  ...Skills,
  ...Abilities,
  "ac",
  "speed",
  "attack",
  "damage",
  "initiative",
  "passive perception",
] as const
export const ItemEffectTargetSchema = z.enum(ItemEffectTargets)
export type ItemEffectTarget = z.infer<typeof ItemEffectTargetSchema>

export const SkillAbilities: Record<SkillType, AbilityType> = {
  acrobatics: "dexterity",
  "animal handling": "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  "sleight of hand": "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
}

export type AbilityScoreModifiers = {
  [key in AbilityType]?: number
}

export interface Trait {
  name: string
  description: string
  level?: number // Level at which trait is gained, if applicable
}

// Item templates for auto-populating the create item form
export interface WeaponDamage {
  num_dice: number
  die_value: number
  type: DamageTypeType
  versatile?: boolean
}

export interface TemplateItem {
  name: string
  category: ItemCategoryType

  // Weapon-specific fields
  weapon_type?: "melee" | "ranged" | "thrown"
  damage?: WeaponDamage[]
  normal_range?: number
  long_range?: number
  starting_ammo?: number
  mastery?: WeaponMasteryType
  finesse?: boolean
  martial?: boolean
  // Weapon properties
  light?: boolean
  heavy?: boolean
  two_handed?: boolean
  reach?: boolean
  loading?: boolean
  ammunition?: boolean

  // Armor-specific fields
  armor_type?: ArmorTypeType
  armor_class?: number
  armor_class_dex?: boolean
  armor_class_dex_max?: number
  min_strength?: number
  stealth_disadvantage?: boolean

  // Shield-specific fields
  armor_modifier?: number
}

export interface Lineage {
  name: string
  description: string

  // in SRD 5.1, some lineages get an ability score increase
  abilityScoreModifiers?: AbilityScoreModifiers

  traits?: Trait[]
}

export interface Species {
  name: string
  size: SizeType
  speed: number
  description: string

  // in SRD 5.1, some species get an ability score increase
  abilityScoreModifiers?: AbilityScoreModifiers

  lineages?: Lineage[]
  traits?: Trait[]
}

export interface Background {
  name: string
  description: string

  skillProficiencies: SkillType[]
  abilityScoresModified?: AbilityType[]
  additionalLanguages?: number
  toolProficiencies?: (string | Choice<string>)[]
  equipment?: string[]
  traits: Trait[]
}

export const ClassNames = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
] as const
export const ClassNamesSchema = z.enum(ClassNames)
export type ClassNameType = z.infer<typeof ClassNamesSchema>

export const CasterKind = ["full", "half", "third", "pact"] as const
export const CasterKindSchema = z.enum(CasterKind)
export type CasterKindType = z.infer<typeof CasterKindSchema>

export const SpellChangeEvent = ["levelup", "longrest"] as const
export const SpellChangeEventSchema = z.enum(SpellChangeEvent)
export type SpellChangeEventType = z.infer<typeof SpellChangeEventSchema>

export type SpellcastingInfo = { notes?: string } & (
  | { enabled: false }
  | {
      enabled: true
      kind: CasterKindType
      ability: AbilityType
      changePrepared: SpellChangeEventType
      subclasses?: string[] // Subclasses that grant/modify spellcasting
    }
)

export interface Choice<T> {
  /** Choose `choose` items from `from` */
  choose: number
  from: T[]
}

export interface Subclass {
  name: string
  description: string
  traits: Trait[]
}

export interface ClassDef {
  name: ClassNameType
  description: string

  hitDie: HitDieType
  primaryAbilities: AbilityType[]
  savingThrows: AbilityType[]

  armorProficiencies: string[]
  weaponProficiencies: string[]
  toolProficiencies: (string | Choice<string>)[]

  skillChoices: Choice<SkillType>

  traits?: Trait[] // Base class features (Rage, Sneak Attack, etc.)
  subclasses: Subclass[]
  subclassLevel: number // Level at which subclass is chosen; default 3
  spellcasting: SpellcastingInfo
  notes?: string
}

export type SlotProgression = { level: number; slots: number[] }[]

export interface Ruleset {
  id: string
  description: string
  species: Species[]
  classes: Record<ClassNameType, ClassDef>
  backgrounds: Record<string, Background>

  listLineages(speciesName?: string): Lineage[]
  listSubclasses(className?: ClassNameType): string[]

  maxCantripsKnown(className: ClassNameType, level: number): number
  maxSpellsPrepared(className: ClassNameType, level: number, abilityModifier: number): number
  getSlotsFor(casterKind: CasterKindType, level: number): SpellSlotsType
}

export type ForWhom = { level?: number | null } & (
  | { species: string; lineage?: string | null }
  | { background: string }
  | { className: ClassNameType; subclass?: string | null }
)

type TraitSource = "species" | "lineage" | "background" | "class" | "subclass"
type TraitWithSource = Trait & { source: TraitSource }

export function getTraits(ruleset: Ruleset, forWhom: ForWhom): TraitWithSource[] {
  let traits: TraitWithSource[] = []

  // Species + Lineage
  if ("species" in forWhom) {
    const species = ruleset.species.find(
      (s) => s.name.toLowerCase() === forWhom.species.toLowerCase()
    )
    if (species) {
      traits = species.traits?.map((t) => ({ ...t, source: "species" })) || []

      if (forWhom.lineage) {
        const lineage = species.lineages?.find(
          (l) => l.name.toLowerCase() === forWhom.lineage!.toLowerCase()
        )

        traits = traits.concat(lineage?.traits?.map((t) => ({ ...t, source: "lineage" })) || [])
      }
    }
  }

  // Background
  if ("background" in forWhom) {
    const background = ruleset.backgrounds[forWhom.background.toLowerCase()]
    traits = background?.traits?.map((t) => ({ ...t, source: "background" })) || []
  }

  // Class (+ optional level + optional subclass)
  if ("className" in forWhom) {
    const classDef = ruleset.classes[forWhom.className]
    if (classDef) {
      traits = classDef.traits?.map((t) => ({ ...t, source: "class" })) || []

      if (forWhom.subclass) {
        const subclass = classDef.subclasses.find(
          (sc) => sc.name.toLowerCase() === forWhom.subclass!.toLowerCase()
        )

        traits = traits.concat(subclass?.traits?.map((t) => ({ ...t, source: "subclass" })) || [])
      }
    }
  }

  const level = forWhom.level
  if (level) {
    return traits.filter((t) => !t.level || t.level <= level)
  } else {
    return traits
  }
}

/**
 * D&D 5E Coin Conversion Utilities
 * 1pp = 1000cp, 1gp = 100cp, 1ep = 50cp, 1sp = 10cp
 */

export type CoinPurse = {
  pp: number
  gp: number
  ep: number
  sp: number
  cp: number
}

/**
 * Convert all coins to copper pieces for calculation
 */
export function toCopper(coins: CoinPurse): number {
  return coins.pp * 1000 + coins.gp * 100 + coins.ep * 50 + coins.sp * 10 + coins.cp
}

/**
 * Apply deltas to coins with change-making
 * Only breaks down larger coins when necessary, doesn't consolidate smaller coins into larger ones
 */
export function applyDeltasWithChange(currentCoins: CoinPurse, deltas: CoinPurse): CoinPurse {
  // Start by applying deltas directly
  let pp = currentCoins.pp + deltas.pp
  let gp = currentCoins.gp + deltas.gp
  let ep = currentCoins.ep + deltas.ep
  let sp = currentCoins.sp + deltas.sp
  let cp = currentCoins.cp + deltas.cp

  // Handle negative values by cascading upwards and making change
  // We need to process from smallest to largest repeatedly until all negatives are resolved
  let iterations = 0
  const maxIterations = 10 // Safety guard

  while ((cp < 0 || sp < 0 || ep < 0 || gp < 0) && iterations < maxIterations) {
    iterations++

    // Handle negative copper
    if (cp < 0) {
      if (sp > 0) {
        const spNeeded = Math.ceil(-cp / 10)
        const spToBreak = Math.min(sp, spNeeded)
        sp -= spToBreak
        cp += spToBreak * 10
      } else if (ep > 0) {
        ep -= 1
        sp += 5
      } else if (gp > 0) {
        gp -= 1
        sp += 10
      } else if (pp > 0) {
        pp -= 1
        gp += 10
      }
      continue
    }

    // Handle negative silver
    if (sp < 0) {
      if (ep > 0) {
        const epNeeded = Math.ceil(-sp / 5)
        const epToBreak = Math.min(ep, epNeeded)
        ep -= epToBreak
        sp += epToBreak * 5
      } else if (gp > 0) {
        gp -= 1
        ep += 2
      } else if (pp > 0) {
        pp -= 1
        gp += 10
      }
      continue
    }

    // Handle negative electrum
    if (ep < 0) {
      if (gp > 0) {
        const gpNeeded = Math.ceil(-ep / 2)
        const gpToBreak = Math.min(gp, gpNeeded)
        gp -= gpToBreak
        ep += gpToBreak * 2
      } else if (pp > 0) {
        pp -= 1
        gp += 10
      }
      continue
    }

    // Handle negative gold
    if (gp < 0) {
      if (pp > 0) {
        const ppNeeded = Math.ceil(-gp / 10)
        const ppToBreak = Math.min(pp, ppNeeded)
        pp -= ppToBreak
        gp += ppToBreak * 10
      }
    }
  }

  return { pp, gp, ep, sp, cp }
}

export { getRuleset } from "./dnd/rulesets"
