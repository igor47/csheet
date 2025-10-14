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

export interface Subrace {
  name: string
  ability_score_modifiers?: AbilityScoreModifiers
}

export interface Race {
  name: string
  size: SizeType
  speed: number
  ability_score_modifiers?: AbilityScoreModifiers
  subraces?: Subrace[]
  variants?: Subrace[]
}

// --- Data (Player's handbook races) ---
export const Races: Race[] = [
  {
    name: "dwarf",
    size: "medium",
    speed: 25,
    ability_score_modifiers: { constitution: 2 },
    subraces: [
      { name: "hill dwarf", ability_score_modifiers: { wisdom: 1 } },
      { name: "mountain dwarf", ability_score_modifiers: { strength: 2 } },
    ],
  },
  {
    name: "elf",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { dexterity: 2 },
    subraces: [
      { name: "high elf", ability_score_modifiers: { intelligence: 1 } },
      { name: "wood elf", ability_score_modifiers: { wisdom: 1 } },
      { name: "drow", ability_score_modifiers: { charisma: 1 } },
    ],
  },
  {
    name: "halfling",
    size: "small",
    speed: 25,
    ability_score_modifiers: { dexterity: 2 },
    subraces: [
      { name: "lightfoot", ability_score_modifiers: { charisma: 1 } },
      { name: "stout", ability_score_modifiers: { constitution: 1 } },
    ],
  },
  {
    name: "human",
    size: "medium",
    speed: 30,
    ability_score_modifiers: {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1,
    },
    variants: [
      {
        name: "strong cute human",
        ability_score_modifiers: {
          // Typically two ability scores of choice
          strength: 1,
          charisma: 1,
        },
      },
    ],
  },
  {
    name: "dragonborn",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { strength: 2, charisma: 1 },
  },
  {
    name: "gnome",
    size: "small",
    speed: 25,
    ability_score_modifiers: { intelligence: 2 },
    subraces: [
      { name: "forest gnome", ability_score_modifiers: { dexterity: 1 } },
      { name: "rock gnome", ability_score_modifiers: { constitution: 1 } },
      { name: "deep gnome", ability_score_modifiers: { dexterity: 1 } },
    ],
  },
  {
    name: "half-elf",
    size: "medium",
    speed: 30,
    ability_score_modifiers: {
      charisma: 2,
      // plus two ability scores of choice
    },
  },
  {
    name: "half-orc",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { strength: 2, constitution: 1 },
  },
  {
    name: "tiefling",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { charisma: 2, intelligence: 1 },
  },
] as const
export const RaceNames = Races.map((c) => c.name)
export const RaceNamesSchema = z.enum(RaceNames)
export type RaceNameType = z.infer<typeof RaceNamesSchema>

export const SubraceNames = Races.flatMap((r) =>
  r.subraces ? r.subraces.map((sr) => sr.name) : []
)
export const SubraceNamesSchema = z.enum(SubraceNames)
export type SubraceNameType = z.infer<typeof SubraceNamesSchema>

// =====================
// Types & Interfaces
// =====================

export interface Choice<T> {
  /** Choose `choose` items from `from` */
  choose: number
  from: T[]
}

// Helper “choice pools”
const GamingSets = ["dice set", "playing card set"] as const

const ArtisanTools = [
  "alchemist’s supplies",
  "brewer’s supplies",
  "calligrapher’s supplies",
  "carpenter’s tools",
  "cartographer’s tools",
  "cobbler’s tools",
  "cook’s utensils",
  "glassblower’s tools",
  "jeweler’s tools",
  "leatherworker’s tools",
  "mason’s tools",
  "painter’s supplies",
  "potter’s tools",
  "smith’s tools",
  "tinker’s tools",
  "weaver’s tools",
  "woodcarver’s tools",
] as const

const Instruments = [
  "bagpipes",
  "drum",
  "dulcimer",
  "flute",
  "lute",
  "lyre",
  "horn",
  "pan flute",
  "shawm",
  "viol",
] as const

// =====================
// Data (Player’s handbook)
// =====================

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

// =====================
// Data (Player’s Handbook classes, lowercase)
// =====================
export const Classes: Record<ClassNameType, ClassDef> = {
  barbarian: {
    name: "barbarian",
    hitDie: 12,
    primaryAbilities: ["strength", "constitution"],
    savingThrows: ["strength", "constitution"],
    armorProficiencies: ["light", "medium", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: ["animal handling", "athletics", "intimidation", "nature", "perception", "survival"],
    },
    subclasses: ["path of the berserker", "path of the totem warrior"],
    subclassLevel: 3,
    spellcasting: { enabled: false },
  },
  bard: {
    name: "bard",
    hitDie: 8,
    primaryAbilities: ["charisma", "dexterity"],
    savingThrows: ["dexterity", "charisma"],
    armorProficiencies: ["light"],
    weaponProficiencies: ["simple", "hand crossbow", "longsword", "rapier", "shortsword"],
    toolProficiencies: [
      {
        choose: 3,
        from: [
          "bagpipes",
          "drum",
          "dulcimer",
          "flute",
          "lute",
          "lyre",
          "horn",
          "pan flute",
          "shawm",
          "viol",
        ],
      },
    ],
    skillChoices: {
      choose: 3,
      from: [
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
      ],
    },
    subclasses: ["college of lore", "college of valor"],
    subclassLevel: 3,
    spellcasting: { enabled: true, kind: "full", ability: "charisma", changePrepared: "levelup" },
  },
  cleric: {
    name: "cleric",
    hitDie: 8,
    primaryAbilities: ["wisdom"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["history", "insight", "medicine", "persuasion", "religion"] },
    subclasses: ["knowledge", "life", "light", "nature", "tempest", "trickery", "war"],
    subclassLevel: 1,
    spellcasting: { enabled: true, kind: "full", ability: "wisdom", changePrepared: "longrest" },
  },
  druid: {
    name: "druid",
    hitDie: 8,
    primaryAbilities: ["wisdom"],
    savingThrows: ["intelligence", "wisdom"],
    armorProficiencies: ["light (nonmetal)", "medium (nonmetal)", "shields (nonmetal)"],
    weaponProficiencies: [
      "clubs",
      "daggers",
      "darts",
      "javelins",
      "maces",
      "quarterstaffs",
      "scimitars",
      "sickles",
      "slings",
      "spears",
    ],
    toolProficiencies: ["herbalism kit"],
    skillChoices: {
      choose: 2,
      from: [
        "arcana",
        "animal handling",
        "insight",
        "medicine",
        "nature",
        "perception",
        "religion",
        "survival",
      ],
    },
    subclasses: ["circle of the land", "circle of the moon"],
    subclassLevel: 2,
    spellcasting: { enabled: true, kind: "full", ability: "wisdom", changePrepared: "longrest" },
  },
  fighter: {
    name: "fighter",
    hitDie: 10,
    primaryAbilities: ["strength", "dexterity", "constitution"],
    savingThrows: ["strength", "constitution"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: [
        "acrobatics",
        "animal handling",
        "athletics",
        "history",
        "insight",
        "intimidation",
        "perception",
        "survival",
      ],
    },
    subclasses: ["champion", "battle master", "eldritch knight"],
    subclassLevel: 3,
    spellcasting: {
      enabled: true,
      kind: "third",
      subclasses: ["eldritch knight"],
      ability: "intelligence",
      changePrepared: "levelup",
    },
  },
  monk: {
    name: "monk",
    hitDie: 8,
    primaryAbilities: ["dexterity", "wisdom"],
    savingThrows: ["strength", "dexterity"],
    armorProficiencies: [],
    weaponProficiencies: ["simple", "shortsword"],
    toolProficiencies: [{ choose: 1, from: ["artisan's tools", "musical instrument"] }],
    skillChoices: {
      choose: 2,
      from: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
    },
    subclasses: ["way of the open hand", "way of shadow", "way of the four elements"],
    subclassLevel: 3,
    spellcasting: { enabled: false },
  },
  paladin: {
    name: "paladin",
    hitDie: 10,
    primaryAbilities: ["strength", "charisma"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
    },
    subclasses: ["oath of devotion", "oath of the ancients", "oath of vengeance"],
    subclassLevel: 3,
    spellcasting: {
      enabled: true,
      kind: "half",
      ability: "charisma",
      changePrepared: "longrest",
      notes: "half-caster progression",
    },
  },
  ranger: {
    name: "ranger",
    hitDie: 10,
    primaryAbilities: ["dexterity", "wisdom"],
    savingThrows: ["strength", "dexterity"],
    armorProficiencies: ["light", "medium", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: {
      choose: 3,
      from: [
        "animal handling",
        "athletics",
        "insight",
        "investigation",
        "nature",
        "perception",
        "stealth",
        "survival",
      ],
    },
    subclasses: ["hunter", "beast master"],
    subclassLevel: 3,
    spellcasting: {
      enabled: true,
      kind: "half",
      ability: "wisdom",
      changePrepared: "levelup",
      notes: "half-caster progression",
    },
  },
  rogue: {
    name: "rogue",
    hitDie: 8,
    primaryAbilities: ["dexterity"],
    savingThrows: ["dexterity", "intelligence"],
    armorProficiencies: ["light"],
    weaponProficiencies: ["simple", "hand crossbow", "longsword", "rapier", "shortsword"],
    toolProficiencies: ["thieves' tools"],
    skillChoices: {
      choose: 4,
      from: [
        "acrobatics",
        "athletics",
        "deception",
        "insight",
        "intimidation",
        "investigation",
        "perception",
        "performance",
        "persuasion",
        "sleight of hand",
        "stealth",
      ],
    },
    subclasses: ["thief", "assassin", "arcane trickster"],
    subclassLevel: 3,
    spellcasting: {
      enabled: true,
      kind: "third",
      subclasses: ["arcane trickster"],
      ability: "intelligence",
      changePrepared: "levelup",
    },
  },
  sorcerer: {
    name: "sorcerer",
    hitDie: 6,
    primaryAbilities: ["charisma"],
    savingThrows: ["constitution", "charisma"],
    armorProficiencies: [],
    weaponProficiencies: ["dagger", "dart", "sling", "quarterstaff", "light crossbow"],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
    },
    subclasses: ["draconic bloodline", "wild magic"],
    subclassLevel: 1,
    spellcasting: { enabled: true, kind: "full", ability: "charisma", changePrepared: "levelup" },
  },
  warlock: {
    name: "warlock",
    hitDie: 8,
    primaryAbilities: ["charisma"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light"],
    weaponProficiencies: ["simple"],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: [
        "arcana",
        "deception",
        "history",
        "intimidation",
        "investigation",
        "nature",
        "religion",
      ],
    },
    subclasses: ["the archfey", "the fiend", "the great old one"],
    subclassLevel: 1,
    spellcasting: {
      enabled: true,
      kind: "pact",
      ability: "charisma",
      changePrepared: "levelup",
      notes: "pact magic progression",
    },
  },
  wizard: {
    name: "wizard",
    hitDie: 6,
    primaryAbilities: ["intelligence"],
    savingThrows: ["intelligence", "wisdom"],
    armorProficiencies: [],
    weaponProficiencies: ["dagger", "dart", "sling", "quarterstaff", "light crossbow"],
    toolProficiencies: [],
    skillChoices: {
      choose: 2,
      from: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
    },
    subclasses: [
      "school of abjuration",
      "school of conjuration",
      "school of divination",
      "school of enchantment",
      "school of evocation",
      "school of illusion",
      "school of necromancy",
      "school of transmutation",
    ],
    subclassLevel: 2,
    spellcasting: {
      enabled: true,
      kind: "full",
      ability: "intelligence",
      changePrepared: "longrest",
    },
  },
}

export const SubclassNames = Object.values(Classes).flatMap((c) =>
  c.subclasses ? c.subclasses : []
)
export const SubclassNamesSchema = z.enum(SubclassNames)
export type SubclassNameType = z.infer<typeof SubclassNamesSchema>

export interface BackgroundFeature {
  name: string
  summary: string // Short summary, no rules text
}

export interface Background {
  name: BackgroundNameType

  /** Usually two fixed skills; sometimes represent “choose” for variants/future content */
  skillProficiencies: (SkillType | Choice<SkillType>)[]

  /** Tool proficiencies can be fixed or a choice; include vehicles under tools for simplicity */
  toolProficiencies?: (string | Choice<string>)[]

  /** Languages can be a number (any choices), a fixed array, or a structured Choice */
  languageProficiencies?: number | string[] | Choice<string>

  /** Starting equipment as brief strings */
  equipment?: string[]

  feature: BackgroundFeature
}

export const BackgroundNames = [
  "acolyte",
  "charlatan",
  "criminal",
  "entertainer",
  "folk hero",
  "guild artisan",
  "hermit",
  "noble",
  "outlander",
  "sage",
  "sailor",
  "soldier",
  "urchin",
  "pirate",
] as const
export const BackgroundNamesSchema = z.enum(BackgroundNames)
export type BackgroundNameType = z.infer<typeof BackgroundNamesSchema>

export const Backgrounds: Record<BackgroundNameType, Background> = {
  acolyte: {
    name: "acolyte",
    skillProficiencies: ["insight", "religion"],
    languageProficiencies: 2,
    equipment: [
      "holy symbol",
      "prayer book or prayer wheel",
      "5 sticks of incense",
      "vestments",
      "common clothes",
      "15 gp",
    ],
    feature: {
      name: "shelter of the faithful",
      summary: "free support and lodging at a temple of your faith; connections to clergy.",
    },
  },
  charlatan: {
    name: "charlatan",
    skillProficiencies: ["deception", "sleight of hand"],
    toolProficiencies: ["disguise kit", "forgery kit"],
    equipment: [
      "fine clothes",
      "disguise kit",
      "con tools (e.g., signet of a fake identity)",
      "15 gp",
    ],
    feature: {
      name: "false identity",
      summary: "you maintain a second identity with documentation, acquaintances, and disguises.",
    },
  },
  criminal: {
    name: "criminal",
    skillProficiencies: ["deception", "stealth"],
    toolProficiencies: [
      { choose: 1, from: [...GamingSets] as unknown as string[] },
      "thieves’ tools",
    ],
    equipment: ["crowbar", "dark common clothes with hood", "15 gp"],
    feature: {
      name: "criminal contact",
      summary: "a reliable and trustworthy contact within the criminal underworld.",
    },
  },
  entertainer: {
    name: "entertainer",
    skillProficiencies: ["acrobatics", "performance"],
    toolProficiencies: [
      { choose: 1, from: [...Instruments] as unknown as string[] },
      "disguise kit",
    ],
    equipment: [
      "musical instrument (one of your choice)",
      "favor of an admirer",
      "costume",
      "15 gp",
    ],
    feature: {
      name: "by popular demand",
      summary: "you can find a place to perform and secure free lodging and modest food.",
    },
  },
  "folk hero": {
    name: "folk hero",
    skillProficiencies: ["animal handling", "survival"],
    toolProficiencies: [
      { choose: 1, from: [...ArtisanTools] as unknown as string[] },
      "vehicles (land)",
    ],
    equipment: [
      "artisan’s tools (one of your choice)",
      "shovel",
      "iron pot",
      "common clothes",
      "10 gp",
    ],
    feature: {
      name: "rustic hospitality",
      summary: "common folk will shelter you; you can hide among them.",
    },
  },
  "guild artisan": {
    name: "guild artisan",
    skillProficiencies: ["insight", "persuasion"],
    toolProficiencies: [{ choose: 1, from: [...ArtisanTools] as unknown as string[] }],
    languageProficiencies: 1,
    equipment: [
      "artisan’s tools (one of your choice)",
      "letter of introduction from your guild",
      "traveler’s clothes",
      "15 gp",
    ],
    feature: {
      name: "guild membership",
      summary: "access to guild facilities, contacts, and legal support (with dues).",
    },
  },
  hermit: {
    name: "hermit",
    skillProficiencies: ["medicine", "religion"],
    toolProficiencies: ["herbalism kit"],
    languageProficiencies: 1,
    equipment: [
      "scroll case of notes",
      "winter blanket",
      "common clothes",
      "herbalism kit",
      "5 gp",
    ],
    feature: {
      name: "discovery",
      summary: "you uncovered a unique and powerful insight during seclusion.",
    },
  },
  noble: {
    name: "noble",
    skillProficiencies: ["history", "persuasion"],
    toolProficiencies: [{ choose: 1, from: [...GamingSets] as unknown as string[] }],
    languageProficiencies: 1,
    equipment: ["fine clothes", "signet ring", "scroll of pedigree", "25 gp"],
    feature: {
      name: "position of privilege",
      summary: "high social standing; easier audience with nobles and officials.",
    },
  },
  outlander: {
    name: "outlander",
    skillProficiencies: ["athletics", "survival"],
    toolProficiencies: [{ choose: 1, from: [...Instruments] as unknown as string[] }],
    languageProficiencies: 1,
    equipment: ["staff", "hunting trap", "trophy from an animal", "traveler’s clothes", "10 gp"],
    feature: {
      name: "wanderer",
      summary: "excellent memory for maps and geography; find food and fresh water for your group.",
    },
  },
  sage: {
    name: "sage",
    skillProficiencies: ["arcana", "history"],
    languageProficiencies: 2,
    equipment: [
      "bottle of black ink",
      "quill",
      "small knife",
      "letter from a dead colleague with a question you haven’t answered",
      "common clothes",
      "10 gp",
    ],
    feature: {
      name: "researcher",
      summary: "you can usually find where to obtain lore; you know how to get answers.",
    },
  },
  sailor: {
    name: "sailor",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator’s tools", "vehicles (water)"],
    equipment: [
      "belaying pin (club)",
      "50 feet of silk rope",
      "lucky charm",
      "common clothes",
      "10 gp",
    ],
    feature: {
      name: "ship’s passage",
      summary: "secure free passage on a sailing ship for you and companions (with obligations).",
    },
  },
  pirate: {
    name: "pirate",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator’s tools", "vehicles (water)"],
    equipment: [
      "belaying pin (club)",
      "50 feet of silk rope",
      "lucky charm",
      "common clothes",
      "10 gp",
    ],
    feature: {
      name: "bad reputation",
      summary: "your notoriety lets you get away with minor crimes; people fear you.",
    },
  },
  soldier: {
    name: "soldier",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: [
      { choose: 1, from: [...GamingSets] as unknown as string[] },
      "vehicles (land)",
    ],
    equipment: [
      "insignia of rank",
      "trophy from a fallen enemy",
      "bone dice or deck of cards",
      "common clothes",
      "10 gp",
    ],
    feature: {
      name: "military rank",
      summary: "you have a rank; soldiers loyal to your former organization recognize authority.",
    },
  },
  urchin: {
    name: "urchin",
    skillProficiencies: ["sleight of hand", "stealth"],
    toolProficiencies: ["disguise kit", "thieves’ tools"],
    equipment: [
      "small knife",
      "map of city you grew up in",
      "pet mouse",
      "token to remember parents",
      "common clothes",
      "10 gp",
    ],
    feature: {
      name: "city secrets",
      summary: "you and companions can move through a city twice as fast via alleys and passages.",
    },
  },
} as const

// =====================
// Spell Progression Tables from SRD
// =====================

type SpellProgressionTableRow = {
  level: number
  cantrips: number
  prepared: number
  slots: number[] // 1st to 9th level slots
  arcanum?: Record<number, number> // warlock-only
}

const SpellProgressionTables: Partial<Record<ClassNameType, SpellProgressionTableRow[]>> = {
  bard: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 2, prepared: 4, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 2, prepared: 5, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 2, prepared: 6, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 3, prepared: 7, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 3, prepared: 9, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 3, prepared: 10, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 3, prepared: 11, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 3, prepared: 12, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 3, prepared: 14, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 4, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 4, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 4, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 4, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 4, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 4, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 4, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 4, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 4, prepared: 20, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 4, prepared: 21, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 4, prepared: 22, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
  cleric: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 3, prepared: 4, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 3, prepared: 5, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 3, prepared: 6, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 4, prepared: 7, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 4, prepared: 9, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 4, prepared: 10, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 4, prepared: 11, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 4, prepared: 12, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 4, prepared: 14, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 5, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 5, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 5, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 5, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 5, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 5, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 5, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 5, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 5, prepared: 20, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 5, prepared: 21, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 5, prepared: 22, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
  druid: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 2, prepared: 4, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 2, prepared: 5, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 2, prepared: 6, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 3, prepared: 7, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 3, prepared: 9, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 3, prepared: 10, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 3, prepared: 11, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 3, prepared: 12, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 3, prepared: 14, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 4, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 4, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 4, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 4, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 4, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 4, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 4, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 4, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 4, prepared: 20, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 4, prepared: 21, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 4, prepared: 22, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
  paladin: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 0, prepared: 2, slots: [2, 0, 0, 0, 0] },
    { level: 2, cantrips: 0, prepared: 3, slots: [2, 0, 0, 0, 0] },
    { level: 3, cantrips: 0, prepared: 4, slots: [3, 0, 0, 0, 0] },
    { level: 4, cantrips: 0, prepared: 5, slots: [3, 0, 0, 0, 0] },
    { level: 5, cantrips: 0, prepared: 6, slots: [4, 2, 0, 0, 0] },
    { level: 6, cantrips: 0, prepared: 6, slots: [4, 2, 0, 0, 0] },
    { level: 7, cantrips: 0, prepared: 7, slots: [4, 3, 0, 0, 0] },
    { level: 8, cantrips: 0, prepared: 7, slots: [4, 3, 0, 0, 0] },
    { level: 9, cantrips: 0, prepared: 9, slots: [4, 3, 2, 0, 0] },
    { level: 10, cantrips: 0, prepared: 9, slots: [4, 3, 2, 0, 0] },
    { level: 11, cantrips: 0, prepared: 10, slots: [4, 3, 3, 0, 0] },
    { level: 12, cantrips: 0, prepared: 10, slots: [4, 3, 3, 0, 0] },
    { level: 13, cantrips: 0, prepared: 11, slots: [4, 3, 3, 1, 0] },
    { level: 14, cantrips: 0, prepared: 11, slots: [4, 3, 3, 1, 0] },
    { level: 15, cantrips: 0, prepared: 12, slots: [4, 3, 3, 2, 0] },
    { level: 16, cantrips: 0, prepared: 12, slots: [4, 3, 3, 2, 0] },
    { level: 17, cantrips: 0, prepared: 14, slots: [4, 3, 3, 3, 1] },
    { level: 18, cantrips: 0, prepared: 14, slots: [4, 3, 3, 3, 1] },
    { level: 19, cantrips: 0, prepared: 15, slots: [4, 3, 3, 3, 2] },
    { level: 20, cantrips: 0, prepared: 15, slots: [4, 3, 3, 3, 2] },
  ],
  ranger: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 0, prepared: 2, slots: [2, 0, 0, 0, 0] },
    { level: 2, cantrips: 0, prepared: 3, slots: [2, 0, 0, 0, 0] },
    { level: 3, cantrips: 0, prepared: 4, slots: [3, 0, 0, 0, 0] },
    { level: 4, cantrips: 0, prepared: 5, slots: [3, 0, 0, 0, 0] },
    { level: 5, cantrips: 0, prepared: 6, slots: [4, 2, 0, 0, 0] },
    { level: 6, cantrips: 0, prepared: 6, slots: [4, 2, 0, 0, 0] },
    { level: 7, cantrips: 0, prepared: 7, slots: [4, 3, 0, 0, 0] },
    { level: 8, cantrips: 0, prepared: 7, slots: [4, 3, 0, 0, 0] },
    { level: 9, cantrips: 0, prepared: 9, slots: [4, 3, 2, 0, 0] },
    { level: 10, cantrips: 0, prepared: 9, slots: [4, 3, 2, 0, 0] },
    { level: 11, cantrips: 0, prepared: 10, slots: [4, 3, 3, 0, 0] },
    { level: 12, cantrips: 0, prepared: 10, slots: [4, 3, 3, 0, 0] },
    { level: 13, cantrips: 0, prepared: 11, slots: [4, 3, 3, 1, 0] },
    { level: 14, cantrips: 0, prepared: 11, slots: [4, 3, 3, 1, 0] },
    { level: 15, cantrips: 0, prepared: 12, slots: [4, 3, 3, 2, 0] },
    { level: 16, cantrips: 0, prepared: 12, slots: [4, 3, 3, 2, 0] },
    { level: 17, cantrips: 0, prepared: 14, slots: [4, 3, 3, 3, 1] },
    { level: 18, cantrips: 0, prepared: 14, slots: [4, 3, 3, 3, 1] },
    { level: 19, cantrips: 0, prepared: 15, slots: [4, 3, 3, 3, 2] },
    { level: 20, cantrips: 0, prepared: 15, slots: [4, 3, 3, 3, 2] },
  ],
  sorcerer: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 4, prepared: 4, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 4, prepared: 5, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 4, prepared: 6, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 5, prepared: 7, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 5, prepared: 9, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 5, prepared: 10, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 5, prepared: 11, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 5, prepared: 12, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 5, prepared: 14, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 6, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 6, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 6, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 6, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 6, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 6, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 6, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 6, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 6, prepared: 20, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 6, prepared: 21, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 6, prepared: 22, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
  warlock: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 2, prepared: 2, slots: [1, 0, 0, 0, 0], arcanum: {} },
    { level: 2, cantrips: 2, prepared: 3, slots: [2, 0, 0, 0, 0], arcanum: {} },
    { level: 3, cantrips: 2, prepared: 4, slots: [0, 2, 0, 0, 0], arcanum: {} },
    { level: 4, cantrips: 3, prepared: 5, slots: [0, 2, 0, 0, 0], arcanum: {} },
    { level: 5, cantrips: 3, prepared: 6, slots: [0, 0, 2, 0, 0], arcanum: {} },
    { level: 6, cantrips: 3, prepared: 7, slots: [0, 0, 2, 0, 0], arcanum: {} },
    { level: 7, cantrips: 3, prepared: 8, slots: [0, 0, 0, 2, 0], arcanum: {} },
    { level: 8, cantrips: 3, prepared: 9, slots: [0, 0, 0, 2, 0], arcanum: {} },
    { level: 9, cantrips: 3, prepared: 10, slots: [0, 0, 0, 0, 2], arcanum: {} },
    { level: 10, cantrips: 4, prepared: 10, slots: [0, 0, 0, 0, 2], arcanum: {} },
    { level: 11, cantrips: 4, prepared: 11, slots: [0, 0, 0, 0, 3], arcanum: { 6: 1 } },
    { level: 12, cantrips: 4, prepared: 11, slots: [0, 0, 0, 0, 3], arcanum: { 6: 1 } },
    { level: 13, cantrips: 4, prepared: 12, slots: [0, 0, 0, 0, 3], arcanum: { 6: 1, 7: 1 } },
    { level: 14, cantrips: 4, prepared: 12, slots: [0, 0, 0, 0, 3], arcanum: { 6: 1, 7: 1 } },
    { level: 15, cantrips: 4, prepared: 13, slots: [0, 0, 0, 0, 3], arcanum: { 6: 1, 7: 1, 8: 1 } },
    { level: 16, cantrips: 4, prepared: 13, slots: [0, 0, 0, 0, 3], arcanum: { 6: 1, 7: 1, 8: 1 } },
    {
      level: 17,
      cantrips: 4,
      prepared: 14,
      slots: [0, 0, 0, 0, 4],
      arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 },
    },
    {
      level: 18,
      cantrips: 4,
      prepared: 14,
      slots: [0, 0, 0, 0, 4],
      arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 },
    },
    {
      level: 19,
      cantrips: 4,
      prepared: 15,
      slots: [0, 0, 0, 0, 4],
      arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 },
    },
    {
      level: 20,
      cantrips: 4,
      prepared: 15,
      slots: [0, 0, 0, 0, 4],
      arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 },
    },
  ],
  wizard: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 3, prepared: 4, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 3, prepared: 5, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 3, prepared: 6, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 4, prepared: 7, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 4, prepared: 9, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 4, prepared: 10, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 4, prepared: 11, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 4, prepared: 12, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 4, prepared: 14, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 5, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 5, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 5, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 5, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 5, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 5, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 5, prepared: 21, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 5, prepared: 22, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 5, prepared: 23, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 5, prepared: 24, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 5, prepared: 26, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
}

/** Eldritch Knight / Arcane Trickster cantrips known by level (third-caster, starts at level 3) */
type SpellProgression = number[]
export const THIRD_CASTER_CANTRIPS_KNOWN: SpellProgression = [
  0,
  0,
  0, // 0-2 (unused / not yet a caster)
  2,
  2,
  2,
  2,
  2,
  2,
  2,
  3, // 3-10
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3,
  3, // 11-20
]

/** Eldritch Knight / Arcane Trickster spells known by level (third-caster, starts at level 3) */
export const THIRD_CASTER_SPELLS_PREPARED: SpellProgression = [
  0,
  0,
  0, // 0-2 (unused / not yet a caster)
  3,
  4,
  4,
  5,
  6,
  6,
  7,
  8, // 3-10
  8,
  9,
  10,
  10,
  11,
  11,
  12,
  13,
  13,
  13, // 11-20
]

/** Helper function to get cantrips known for a class at a given level */
export function maxCantripsKnown(className: ClassNameType, level: number): number {
  const classDef = Classes[className]
  if (!classDef.spellcasting.enabled) return 0

  switch (className) {
    case "bard":
    case "sorcerer":
    case "warlock":
    case "cleric":
    case "druid":
    case "wizard":
      return SpellProgressionTables[className]?.[level]?.cantrips || 0
    case "fighter": // Eldritch Knight
    case "rogue": // Arcane Trickster
      return THIRD_CASTER_CANTRIPS_KNOWN[level] || 0
    default:
      return 0
  }
}

/** Helper function to get spells known for "known caster" classes at a given level */
export function maxSpellsPrepared(className: ClassNameType, level: number): number | null {
  const classDef = Classes[className]
  if (!classDef.spellcasting.enabled) {
    return null // Not a "known" caster
  }

  switch (className) {
    case "bard":
    case "sorcerer":
    case "warlock":
    case "cleric":
    case "druid":
    case "wizard":
    case "paladin":
    case "ranger":
      return SpellProgressionTables[className]?.[level]?.prepared || 0
    case "fighter": // Eldritch Knight
    case "rogue": // Arcane Trickster
      return THIRD_CASTER_CANTRIPS_KNOWN[level] || 0
    default:
      return 0
  }
}

// =====================
// Spell Slots
// =====================

// slots[0] = level 1 slots, slots[1] = level 2 slots, etc.
export type SlotProgression = { level: number; slots: number[] }[]

/** ---------- Full Caster Slots (Bard, Cleric, Druid, Sorcerer, Wizard) ---------- */
export const FULL_CASTER_SLOTS: SlotProgression = [
  { level: 0, slots: [] },
  { level: 1, slots: [2] },
  { level: 2, slots: [3] },
  { level: 3, slots: [4, 2] },
  { level: 4, slots: [4, 3] },
  { level: 5, slots: [4, 3, 2] },
  { level: 6, slots: [4, 3, 3] },
  { level: 7, slots: [4, 3, 3, 1] },
  { level: 8, slots: [4, 3, 3, 2] },
  { level: 9, slots: [4, 3, 3, 3, 1] },
  { level: 10, slots: [4, 3, 3, 3, 2] },
  { level: 11, slots: [4, 3, 3, 3, 2, 1] },
  { level: 12, slots: [4, 3, 3, 3, 2, 1] },
  { level: 13, slots: [4, 3, 3, 3, 2, 1, 1] },
  { level: 14, slots: [4, 3, 3, 3, 2, 1, 1] },
  { level: 15, slots: [4, 3, 3, 3, 2, 1, 1, 1] },
  { level: 16, slots: [4, 3, 3, 3, 2, 1, 1, 1] },
  { level: 17, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  { level: 18, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  { level: 19, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  { level: 20, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
]

/** ---------- Half Caster Slots (Paladin, Ranger) ---------- */
export const HALF_CASTER_SLOTS: SlotProgression = [
  { level: 0, slots: [] },
  { level: 1, slots: [2] },
  { level: 2, slots: [2] },
  { level: 3, slots: [3] },
  { level: 4, slots: [3] },
  { level: 5, slots: [4, 2] },
  { level: 6, slots: [4, 2] },
  { level: 7, slots: [4, 3] },
  { level: 8, slots: [4, 3] },
  { level: 9, slots: [4, 3, 2] },
  { level: 10, slots: [4, 3, 2] },
  { level: 11, slots: [4, 3, 3] },
  { level: 12, slots: [4, 3, 3] },
  { level: 13, slots: [4, 3, 3, 1] },
  { level: 14, slots: [4, 3, 3, 1] },
  { level: 15, slots: [4, 3, 3, 2] },
  { level: 16, slots: [4, 3, 3, 2] },
  { level: 17, slots: [4, 3, 3, 3, 1] },
  { level: 18, slots: [4, 3, 3, 3, 1] },
  { level: 19, slots: [4, 3, 3, 3, 2] },
  { level: 20, slots: [4, 3, 3, 3, 2] },
]

/** ---------- Third Caster Slots (Eldritch Knight / Arcane Trickster) ---------- */
export const THIRD_CASTER_SLOTS: SlotProgression = [
  { level: 0, slots: [] },
  { level: 1, slots: [] },
  { level: 2, slots: [] },
  { level: 3, slots: [2] },
  { level: 4, slots: [3] },
  { level: 5, slots: [3] },
  { level: 6, slots: [3, 2] },
  { level: 7, slots: [4, 2] },
  { level: 8, slots: [4, 2] },
  { level: 9, slots: [4, 2] },
  { level: 10, slots: [4, 3] },
  { level: 11, slots: [4, 3] },
  { level: 12, slots: [4, 3] },
  { level: 13, slots: [4, 3, 2] },
  { level: 14, slots: [4, 3, 2] },
  { level: 15, slots: [4, 3, 2] },
  { level: 16, slots: [4, 3, 3] },
  { level: 17, slots: [4, 3, 3] },
  { level: 18, slots: [4, 3, 3] },
  { level: 19, slots: [4, 3, 3, 1] },
  { level: 20, slots: [4, 3, 3, 1] },
]

function slotsFromProgression(progression: number[]): SpellSlotsType {
  const slots: number[] = []

  for (let level = 1; level <= 9; level++) {
    const slotsAtLevel = progression[level - 1] || 0
    for (let i = 0; i < slotsAtLevel; i++) {
      slots.push(level)
    }
  }

  return slots as SpellSlotsType
}

/** Helper function to get spell slots for a class at a given level */
export function getSlotsFor(casterKind: CasterKindType, level: number): SpellSlotsType {
  if (casterKind === "full") {
    return slotsFromProgression(FULL_CASTER_SLOTS[level]?.slots || [])
  } else if (casterKind === "half") {
    return slotsFromProgression(HALF_CASTER_SLOTS[level]?.slots || [])
  } else if (casterKind === "third") {
    return slotsFromProgression(THIRD_CASTER_SLOTS[level]?.slots || [])
  } else if (casterKind === "pact") {
    const progression = SpellProgressionTables.warlock!
    return slotsFromProgression(progression[level]?.slots || [])
  } else {
    return []
  }
}
