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

export interface Lineage {
  name: string
  abilityScoreModifiers?: AbilityScoreModifiers
  traits?: Trait[]
}

export interface Species {
  name: string
  size: SizeType
  speed: number
  abilityScoreModifiers?: AbilityScoreModifiers
  skillProficiencies?: SkillType[]
  lineages?: Lineage[]
  variants?: Lineage[]
  traits?: Trait[]
}

export interface Background {
  name: string
  skillProficiencies?: SkillType[]
  abilityScoresModified?: AbilityType[]
  additionalLanguages?: number,
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

export interface ClassDef {
  name: ClassNameType
  hitDie: HitDieType
  primaryAbilities: AbilityType[]
  savingThrows: AbilityType[]

  armorProficiencies: string[]
  weaponProficiencies: string[]
  toolProficiencies: (string | Choice<string>)[]

  skillChoices: Choice<SkillType>

  subclasses: string[]
  subclassLevel: number // Level at which subclass is chosen; default 3
  spellcasting: SpellcastingInfo
  notes?: string
}

export type SlotProgression = { level: number; slots: number[] }[]

export interface Ruleset {
  species: Species[],
  classes: ClassDef[],
  backgrounds: Background[],

  listLineages(speciesName?: string): Lineage[],
  listSubclasses(className?: ClassNameType): string[],

  maxCantripsKnown(className: ClassNameType, level: number): number,
  maxSpellsPrepared(className: ClassNameType, level: number, abilityModifier: number): number,
  getSlotsFor(casterKind: CasterKindType, level: number): SpellSlotsType,
}
