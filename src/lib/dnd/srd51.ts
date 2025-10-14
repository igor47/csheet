import type {
  AbilityScoreModifiers,
  AbilityType,
  Background,
  CasterKindType,
  Choice,
  ClassDef,
  ClassNameType,
  HitDieType,
  Species,
  SizeType,
  SkillType,
  SlotProgression,
  SpellSlotsType,
  Lineage,
  SpellcastingInfo,
  SpellChangeEventType,
  BackgroundNameType as CoreBackgroundNameType,
} from "../dnd";


const SpeciesData: Species[] = [
  {
    name: "dwarf",
    size: "medium",
    speed: 25,
    ability_score_modifiers: { constitution: 2 },
    lineages: [
      { name: "hill dwarf", ability_score_modifiers: { wisdom: 1 } },
      { name: "mountain dwarf", ability_score_modifiers: { strength: 2 } }
    ]
  },
  {
    name: "elf",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { dexterity: 2 },
    lineages: [
      { name: "high elf", ability_score_modifiers: { intelligence: 1 } },
      { name: "wood elf", ability_score_modifiers: { wisdom: 1 } },
      { name: "drow", ability_score_modifiers: { charisma: 1 } }
    ]
  },
  {
    name: "halfling",
    size: "small",
    speed: 25,
    ability_score_modifiers: { dexterity: 2 },
    lineages: [
      { name: "lightfoot", ability_score_modifiers: { charisma: 1 } },
      { name: "stout", ability_score_modifiers: { constitution: 1 } }
    ]
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
      charisma: 1
    },
    variants: [
      {
        name: "strong cute human",
        ability_score_modifiers: {
          // Typically two ability scores of choice
          strength: 1,
          charisma: 1,
        }
      }
    ]
  },
  {
    name: "dragonborn",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { strength: 2, charisma: 1 }
  },
  {
    name: "gnome",
    size: "small",
    speed: 25,
    ability_score_modifiers: { intelligence: 2 },
    lineages: [
      { name: "forest gnome", ability_score_modifiers: { dexterity: 1 } },
      { name: "rock gnome", ability_score_modifiers: { constitution: 1 } },
      { name: "deep gnome", ability_score_modifiers: { dexterity: 1 } },
    ]
  },
  {
    name: "half-elf",
    size: "medium",
    speed: 30,
    ability_score_modifiers: {
      charisma: 2
      // plus two ability scores of choice
    }
  },
  {
    name: "half-orc",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { strength: 2, constitution: 1 }
  },
  {
    name: "tiefling",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { charisma: 2, intelligence: 1 }
  }
] as const;
const RaceNames = SpeciesData.map(c => c.name);
const SubraceNames = SpeciesData.flatMap(r => r.lineages ? r.lineages.map(sr => sr.name) : []);

const ClassNames = ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"] as const;

const Classes: Record<ClassNameType, ClassDef> = {
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
      { choose: 3, from: ["bagpipes","drum","dulcimer","flute","lute","lyre","horn","pan flute","shawm","viol"] }
    ],
    skillChoices: {
      choose: 3,
      from: [
        "acrobatics","animal handling","arcana","athletics","deception","history","insight","intimidation",
        "investigation","medicine","nature","perception","performance","persuasion","religion","sleight of hand","stealth","survival"
      ]
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
    weaponProficiencies: ["clubs","daggers","darts","javelins","maces","quarterstaffs","scimitars","sickles","slings","spears"],
    toolProficiencies: ["herbalism kit"],
    skillChoices: { choose: 2, from: ["arcana","animal handling","insight","medicine","nature","perception","religion","survival"] },
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
    skillChoices: { choose: 2, from: ["acrobatics","animal handling","athletics","history","insight","intimidation","perception","survival"] },
    subclasses: ["champion", "battle master", "eldritch knight"],
    subclassLevel: 3,
    spellcasting: { enabled: true, kind: "third", subclasses: ["eldritch knight"], ability: "intelligence", changePrepared: "levelup"},
  },
  monk: {
    name: "monk",
    hitDie: 8,
    primaryAbilities: ["dexterity", "wisdom"],
    savingThrows: ["strength", "dexterity"],
    armorProficiencies: [],
    weaponProficiencies: ["simple", "shortsword"],
    toolProficiencies: [{ choose: 1, from: ["artisan's tools", "musical instrument"] }],
    skillChoices: { choose: 2, from: ["acrobatics","athletics","history","insight","religion","stealth"] },
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
    skillChoices: { choose: 2, from: ["athletics","insight","intimidation","medicine","persuasion","religion"] },
    subclasses: ["oath of devotion", "oath of the ancients", "oath of vengeance"],
    subclassLevel: 3,
    spellcasting: { enabled: true, kind: "half", ability: "charisma", changePrepared: "longrest", notes: "half-caster progression" },
  },
  ranger: {
    name: "ranger",
    hitDie: 10,
    primaryAbilities: ["dexterity", "wisdom"],
    savingThrows: ["strength", "dexterity"],
    armorProficiencies: ["light", "medium", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: { choose: 3, from: ["animal handling","athletics","insight","investigation","nature","perception","stealth","survival"] },
    subclasses: ["hunter", "beast master"],
    subclassLevel: 3,
    spellcasting: { enabled: true, kind: "half", ability: "wisdom", changePrepared: "levelup", notes: "half-caster progression" },
  },
  rogue: {
    name: "rogue",
    hitDie: 8,
    primaryAbilities: ["dexterity"],
    savingThrows: ["dexterity", "intelligence"],
    armorProficiencies: ["light"],
    weaponProficiencies: ["simple", "hand crossbow", "longsword", "rapier", "shortsword"],
    toolProficiencies: ["thieves' tools"],
    skillChoices: { choose: 4, from: ["acrobatics","athletics","deception","insight","intimidation","investigation","perception","performance","persuasion","sleight of hand","stealth"] },
    subclasses: ["thief", "assassin", "arcane trickster"],
    subclassLevel: 3,
    spellcasting: { enabled: true, kind: "third", subclasses: ["arcane trickster"], ability: "intelligence", changePrepared: "levelup"},
  },
  sorcerer: {
    name: "sorcerer",
    hitDie: 6,
    primaryAbilities: ["charisma"],
    savingThrows: ["constitution", "charisma"],
    armorProficiencies: [],
    weaponProficiencies: ["dagger","dart","sling","quarterstaff","light crossbow"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["arcana","deception","insight","intimidation","persuasion","religion"] },
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
    skillChoices: { choose: 2, from: ["arcana","deception","history","intimidation","investigation","nature","religion"] },
    subclasses: ["the archfey", "the fiend", "the great old one"],
    subclassLevel: 1,
    spellcasting: { enabled: true, kind: "pact", ability: "charisma", changePrepared: "levelup", notes: "pact magic progression" },
  },
  wizard: {
    name: "wizard",
    hitDie: 6,
    primaryAbilities: ["intelligence"],
    savingThrows: ["intelligence", "wisdom"],
    armorProficiencies: [],
    weaponProficiencies: ["dagger","dart","sling","quarterstaff","light crossbow"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["arcana","history","insight","investigation","medicine","religion"] },
    subclasses: ["school of abjuration","school of conjuration","school of divination","school of enchantment","school of evocation","school of illusion","school of necromancy","school of transmutation"],
    subclassLevel: 2,
    spellcasting: { enabled: true, kind: "full", ability: "intelligence", changePrepared: "longrest" },
  }
};
const SubclassNames = Object.values(Classes).flatMap(c => c.subclasses ? c.subclasses : []);

const BackgroundNames = [
  "acolyte", "charlatan", "criminal", "entertainer", "folk hero", "guild artisan", "hermit", "noble", "outlander", "sage", "sailor", "soldier", "urchin", "pirate",
] as const;
export type BackgroundNameType = typeof BackgroundNames[number];


const Backgrounds: Record<BackgroundNameType, Background> = {
  acolyte: {
    name: "acolyte",
    skillProficiencies: ["insight", "religion"],
    languageProficiencies: 2,
    equipment: ["holy symbol", "prayer book or prayer wheel", "5 sticks of incense", "vestments", "common clothes", "15 gp"],
    feature: {
      name: "shelter of the faithful",
      summary: "free support and lodging at a temple of your faith; connections to clergy.",
    },
  },
  charlatan: {
    name: "charlatan",
    skillProficiencies: ["deception", "sleight of hand"],
    toolProficiencies: ["disguise kit", "forgery kit"],
    equipment: ["fine clothes", "disguise kit", "con tools (e.g., signet of a fake identity)", "15 gp"],
    feature: {
      name: "false identity",
      summary: "you maintain a second identity with documentation, acquaintances, and disguises.",
    },
  },
  criminal: {
    name: "criminal",
    skillProficiencies: ["deception", "stealth"],
    toolProficiencies: [
      { choose: 1, from: ["dice set", "playing card set"] },
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
      { choose: 1, from: ["bagpipes", "drum", "dulcimer", "flute", "lute", "lyre", "horn", "pan flute", "shawm", "viol"] },
      "disguise kit",
    ],
    equipment: ["musical instrument (one of your choice)", "favor of an admirer", "costume", "15 gp"],
    feature: {
      name: "by popular demand",
      summary: "you can find a place to perform and secure free lodging and modest food.",
    },
  },
  "folk hero": {
    name: "folk hero",
    skillProficiencies: ["animal handling", "survival"],
    toolProficiencies: [
      { choose: 1, from: ["alchemist’s supplies", "brewer’s supplies", "calligrapher’s supplies", "carpenter’s tools", "cartographer’s tools", "cobbler’s tools", "cook’s utensils", "glassblower’s tools", "jeweler’s tools", "leatherworker’s tools", "mason’s tools", "painter’s supplies", "potter’s tools", "smith’s tools", "tinker’s tools", "weaver’s tools", "woodcarver’s tools"] },
      "vehicles (land)",
    ],
    equipment: ["artisan’s tools (one of your choice)", "shovel", "iron pot", "common clothes", "10 gp"],
    feature: {
      name: "rustic hospitality",
      summary: "common folk will shelter you; you can hide among them.",
    },
  },
  "guild artisan": {
    name: "guild artisan",
    skillProficiencies: ["insight", "persuasion"],
    toolProficiencies: [{ choose: 1, from: ["alchemist’s supplies", "brewer’s supplies", "calligrapher’s supplies", "carpenter’s tools", "cartographer’s tools", "cobbler’s tools", "cook’s utensils", "glassblower’s tools", "jeweler’s tools", "leatherworker’s tools", "mason’s tools", "painter’s supplies", "potter’s tools", "smith’s tools", "tinker’s tools", "weaver’s tools", "woodcarver’s tools"] }],
    languageProficiencies: 1,
    equipment: ["artisan’s tools (one of your choice)", "letter of introduction from your guild", "traveler’s clothes", "15 gp"],
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
    equipment: ["scroll case of notes", "winter blanket", "common clothes", "herbalism kit", "5 gp"],
    feature: {
      name: "discovery",
      summary: "you uncovered a unique and powerful insight during seclusion.",
    },
  },
  noble: {
    name: "noble",
    skillProficiencies: ["history", "persuasion"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }],
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
    toolProficiencies: [{ choose: 1, from: ["bagpipes", "drum", "dulcimer", "flute", "lute", "lyre", "horn", "pan flute", "shawm", "viol"] }],
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
    equipment: ["bottle of black ink", "quill", "small knife", "letter from a dead colleague with a question you haven’t answered", "common clothes", "10 gp"],
    feature: {
      name: "researcher",
      summary: "you can usually find where to obtain lore; you know how to get answers.",
    },
  },
  sailor: {
    name: "sailor",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator’s tools", "vehicles (water)"],
    equipment: ["belaying pin (club)", "50 feet of silk rope", "lucky charm", "common clothes", "10 gp"],
    feature: {
      name: "ship’s passage",
      summary: "secure free passage on a sailing ship for you and companions (with obligations).",
    },
  },
  pirate: {
    name: "pirate",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator’s tools", "vehicles (water)"],
    equipment: ["belaying pin (club)", "50 feet of silk rope", "lucky charm", "common clothes", "10 gp"],
    feature: {
      name: "bad reputation",
      summary: "your notoriety lets you get away with minor crimes; people fear you.",
    },
  },
  soldier: {
    name: "soldier",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }, "vehicles (land)"],
    equipment: ["insignia of rank", "trophy from a fallen enemy", "bone dice or deck of cards", "common clothes", "10 gp"],
    feature: {
      name: "military rank",
      summary: "you have a rank; soldiers loyal to your former organization recognize authority.",
    },
  },
  urchin: {
    name: "urchin",
    skillProficiencies: ["sleight of hand", "stealth"],
    toolProficiencies: ["disguise kit", "thieves’ tools"],
    equipment: ["small knife", "map of city you grew up in", "pet mouse", "token to remember parents", "common clothes", "10 gp"],
    feature: {
      name: "city secrets",
      summary: "you and companions can move through a city twice as fast via alleys and passages.",
    },
  },
} as const;

type SpellProgressionTableRow = {
  level: number;
  cantrips: number;
  prepared?: number; // Spells known for "known" casters
  prepared_fn?: (level: number, ability_modifier: number) => number;
  slots: number[]; // 1st to 9th level slots
  arcanum?: Record<number, number>; // warlock-only
}

const SpellProgressionTables: Partial<Record<ClassNameType, SpellProgressionTableRow[]>> = {
  "bard": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 2, prepared: 4,   slots: [2, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 2, cantrips: 2, prepared: 5,   slots: [3, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 3, cantrips: 2, prepared: 6,   slots: [4, 2, 0, 0, 0, 0, 0, 0, 0]},
    {level: 4, cantrips: 3, prepared: 7,   slots: [4, 3, 0, 0, 0, 0, 0, 0, 0]},
    {level: 5, cantrips: 3, prepared: 9,   slots: [4, 3, 2, 0, 0, 0, 0, 0, 0]},
    {level: 6, cantrips: 3, prepared: 10,  slots: [4, 3, 3, 0, 0, 0, 0, 0, 0]},
    {level: 7, cantrips: 3, prepared: 11,  slots: [4, 3, 3, 1, 0, 0, 0, 0, 0]},
    {level: 8, cantrips: 3, prepared: 12,  slots: [4, 3, 3, 2, 0, 0, 0, 0, 0]},
    {level: 9, cantrips: 3, prepared: 14,  slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]},
    {level: 10, cantrips: 4, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0]},
    {level: 11, cantrips: 4, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 12, cantrips: 4, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 13, cantrips: 4, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 14, cantrips: 4, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 15, cantrips: 4, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 16, cantrips: 4, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 17, cantrips: 4, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1]},
    {level: 18, cantrips: 4, prepared: 20, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1]},
    {level: 19, cantrips: 4, prepared: 21, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1]},
    {level: 20, cantrips: 4, prepared: 22, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1]},
  ],
  'cleric': [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [2, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 2, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [3, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 3, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [4, 2, 0, 0, 0, 0, 0, 0, 0]},
    {level: 4, cantrips: 4, prepared_fn: (level, mod) => mod + level,   slots: [4, 3, 0, 0, 0, 0, 0, 0, 0]},
    {level: 5, cantrips: 4, prepared_fn: (level, mod) => mod + level,   slots: [4, 3, 2, 0, 0, 0, 0, 0, 0]},
    {level: 6, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 0, 0, 0, 0, 0, 0]},
    {level: 7, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 1, 0, 0, 0, 0, 0]},
    {level: 8, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 2, 0, 0, 0, 0, 0]},
    {level: 9, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]},
    {level: 10, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0]},
    {level: 11, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 12, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 13, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 14, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 15, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 16, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 17, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1]},
    {level: 18, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1]},
    {level: 19, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1]},
    {level: 20, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1]},
  ],
  "druid": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 2, prepared_fn: (level, mod) => mod + level,   slots: [2, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 2, cantrips: 2, prepared_fn: (level, mod) => mod + level,   slots: [3, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 3, cantrips: 2, prepared_fn: (level, mod) => mod + level,   slots: [4, 2, 0, 0, 0, 0, 0, 0, 0]},
    {level: 4, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [4, 3, 0, 0, 0, 0, 0, 0, 0]},
    {level: 5, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [4, 3, 2, 0, 0, 0, 0, 0, 0]},
    {level: 6, cantrips: 3, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 0, 0, 0, 0, 0, 0]},
    {level: 7, cantrips: 3, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 1, 0, 0, 0, 0, 0]},
    {level: 8, cantrips: 3, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 2, 0, 0, 0, 0, 0]},
    {level: 9, cantrips: 3, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]},
    {level: 10, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0]},
    {level: 11, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 12, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 13, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 14, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 15, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 16, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 17, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1]},
    {level: 18, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1]},
    {level: 19, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1]},
    {level: 20, cantrips: 4, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1]},
  ],
  "paladin": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [2, 0, 0, 0, 0]},
    {level: 2, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [2, 0, 0, 0, 0]},
    {level: 3, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [3, 0, 0, 0, 0]},
    {level: 4, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [3, 0, 0, 0, 0]},
    {level: 5, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 2, 0, 0, 0]},
    {level: 6, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 2, 0, 0, 0]},
    {level: 7, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 3, 0, 0, 0]},
    {level: 8, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 3, 0, 0, 0]},
    {level: 9, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 3, 2, 0, 0]},
    {level: 10, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),  slots: [4, 3, 2, 0, 0]},
    {level: 11, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 0, 0]},
    {level: 12, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 0, 0]},
    {level: 13, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 1, 0]},
    {level: 14, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 1, 0]},
    {level: 15, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 2, 0]},
    {level: 16, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 2, 0]},
    {level: 17, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 1]},
    {level: 18, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 1]},
    {level: 19, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 2]},
    {level: 20, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 2]},
  ],
  "ranger": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [2, 0, 0, 0, 0]},
    {level: 2, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [2, 0, 0, 0, 0]},
    {level: 3, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [3, 0, 0, 0, 0]},
    {level: 4, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [3, 0, 0, 0, 0]},
    {level: 5, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 2, 0, 0, 0]},
    {level: 6, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 2, 0, 0, 0]},
    {level: 7, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 3, 0, 0, 0]},
    {level: 8, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 3, 0, 0, 0]},
    {level: 9, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),   slots: [4, 3, 2, 0, 0]},
    {level: 10, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2),  slots: [4, 3, 2, 0, 0]},
    {level: 11, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 0, 0]},
    {level: 12, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 0, 0]},
    {level: 13, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 1, 0]},
    {level: 14, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 1, 0]},
    {level: 15, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 2, 0]},
    {level: 16, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 2, 0]},
    {level: 17, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 1]},
    {level: 18, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 1]},
    {level: 19, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 2]},
    {level: 20, cantrips: 0, prepared_fn: (level, mod) => mod + Math.floor(level / 2), slots: [4, 3, 3, 3, 2]},
  ],
  "sorcerer": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 4, prepared: 4,   slots: [2, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 2, cantrips: 4, prepared: 5,   slots: [3, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 3, cantrips: 4, prepared: 6,   slots: [4, 2, 0, 0, 0, 0, 0, 0, 0]},
    {level: 4, cantrips: 5, prepared: 7,   slots: [4, 3, 0, 0, 0, 0, 0, 0, 0]},
    {level: 5, cantrips: 5, prepared: 9,   slots: [4, 3, 2, 0, 0, 0, 0, 0, 0]},
    {level: 6, cantrips: 5, prepared: 10,  slots: [4, 3, 3, 0, 0, 0, 0, 0, 0]},
    {level: 7, cantrips: 5, prepared: 11,  slots: [4, 3, 3, 1, 0, 0, 0, 0, 0]},
    {level: 8, cantrips: 5, prepared: 12,  slots: [4, 3, 3, 2, 0, 0, 0, 0, 0]},
    {level: 9, cantrips: 5, prepared: 14,  slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]},
    {level: 10, cantrips: 6, prepared: 15, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0]},
    {level: 11, cantrips: 6, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 12, cantrips: 6, prepared: 16, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 13, cantrips: 6, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 14, cantrips: 6, prepared: 17, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 15, cantrips: 6, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 16, cantrips: 6, prepared: 18, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 17, cantrips: 6, prepared: 19, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1]},
    {level: 18, cantrips: 6, prepared: 20, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1]},
    {level: 19, cantrips: 6, prepared: 21, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1]},
    {level: 20, cantrips: 6, prepared: 22, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1]},
  ],
  "warlock": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 2, prepared: 2,   slots: [1, 0, 0, 0, 0], arcanum: {}},
    {level: 2, cantrips: 2, prepared: 3,   slots: [2, 0, 0, 0, 0], arcanum: {}},
    {level: 3, cantrips: 2, prepared: 4,   slots: [0, 2, 0, 0, 0], arcanum: {}},
    {level: 4, cantrips: 3, prepared: 5,   slots: [0, 2, 0, 0, 0], arcanum: {}},
    {level: 5, cantrips: 3, prepared: 6,   slots: [0, 0, 2, 0, 0], arcanum: {}},
    {level: 6, cantrips: 3, prepared: 7,   slots: [0, 0, 2, 0, 0], arcanum: {}},
    {level: 7, cantrips: 3, prepared: 8,   slots: [0, 0, 0, 2, 0], arcanum: {}},
    {level: 8, cantrips: 3, prepared: 9,   slots: [0, 0, 0, 2, 0], arcanum: {}},
    {level: 9, cantrips: 3, prepared: 10,  slots: [0, 0, 0, 0, 2], arcanum: {}},
    {level: 10, cantrips: 4, prepared: 10, slots: [0, 0, 0, 0, 2], arcanum: {}},
    {level: 11, cantrips: 4, prepared: 11, slots: [0, 0, 0, 0, 3], arcanum: {6: 1}},
    {level: 12, cantrips: 4, prepared: 11, slots: [0, 0, 0, 0, 3], arcanum: {6: 1}},
    {level: 13, cantrips: 4, prepared: 12, slots: [0, 0, 0, 0, 3], arcanum: {6: 1, 7: 1}},
    {level: 14, cantrips: 4, prepared: 12, slots: [0, 0, 0, 0, 3], arcanum: {6: 1, 7: 1}},
    {level: 15, cantrips: 4, prepared: 13, slots: [0, 0, 0, 0, 3], arcanum: {6: 1, 7: 1, 8: 1}},
    {level: 16, cantrips: 4, prepared: 13, slots: [0, 0, 0, 0, 3], arcanum: {6: 1, 7: 1, 8: 1}},
    {level: 17, cantrips: 4, prepared: 14, slots: [0, 0, 0, 0, 4], arcanum: {6: 1, 7: 1, 8: 1, 9: 1}},
    {level: 18, cantrips: 4, prepared: 14, slots: [0, 0, 0, 0, 4], arcanum: {6: 1, 7: 1, 8: 1, 9: 1}},
    {level: 19, cantrips: 4, prepared: 15, slots: [0, 0, 0, 0, 4], arcanum: {6: 1, 7: 1, 8: 1, 9: 1}},
    {level: 20, cantrips: 4, prepared: 15, slots: [0, 0, 0, 0, 4], arcanum: {6: 1, 7: 1, 8: 1, 9: 1}},
  ],
  "wizard": [
    {level: 0, cantrips: 0, prepared: 0,   slots: [0, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 1, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [2, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 2, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [3, 0, 0, 0, 0, 0, 0, 0, 0]},
    {level: 3, cantrips: 3, prepared_fn: (level, mod) => mod + level,   slots: [4, 2, 0, 0, 0, 0, 0, 0, 0]},
    {level: 4, cantrips: 4, prepared_fn: (level, mod) => mod + level,   slots: [4, 3, 0, 0, 0, 0, 0, 0, 0]},
    {level: 5, cantrips: 4, prepared_fn: (level, mod) => mod + level,   slots: [4, 3, 2, 0, 0, 0, 0, 0, 0]},
    {level: 6, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 0, 0, 0, 0, 0, 0]},
    {level: 7, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 1, 0, 0, 0, 0, 0]},
    {level: 8, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 2, 0, 0, 0, 0, 0]},
    {level: 9, cantrips: 4, prepared_fn: (level, mod) => mod + level,  slots: [4, 3, 3, 3, 1, 0, 0, 0, 0]},
    {level: 10, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0]},
    {level: 11, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 12, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0]},
    {level: 13, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 14, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0]},
    {level: 15, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 16, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0]},
    {level: 17, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1]},
    {level: 18, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1]},
    {level: 19, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1]},
    {level: 20, cantrips: 5, prepared_fn: (level, mod) => mod + level, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1]},
  ],
}

type SpellProgression = number[];
const THIRD_CASTER_CANTRIPS_KNOWN: SpellProgression = [
  0, 0, 0, // 0-2 (unused / not yet a caster)
  2, 2, 2, 2, 2, 2, 2, 3, // 3-10
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // 11-20
];

const THIRD_CASTER_SPELLS_PREPARED: SpellProgression = [
  0, 0, 0, // 0-2 (unused / not yet a caster)
  3, 4, 4, 5, 6, 6, 7, 8, // 3-10
  8, 9, 10, 10, 11, 11, 12, 13, 13, 13, // 11-20
];

const FULL_CASTER_SLOTS: SlotProgression = [
  {level: 0, slots: []},
  {level: 1, slots: [ 2 ]},
  {level: 2, slots: [ 3 ]},
  {level: 3, slots: [ 4, 2 ]},
  {level: 4, slots: [ 4, 3 ]},
  {level: 5, slots: [ 4, 3, 2 ]},
  {level: 6, slots: [ 4, 3, 3 ]},
  {level: 7, slots: [ 4, 3, 3, 1 ]},
  {level: 8, slots: [ 4, 3, 3, 2 ]},
  {level: 9, slots: [ 4, 3, 3, 3, 1 ]},
  {level: 10, slots: [ 4, 3, 3, 3, 2 ]},
  {level: 11, slots: [ 4, 3, 3, 3, 2, 1 ]},
  {level: 12, slots: [ 4, 3, 3, 3, 2, 1 ]},
  {level: 13, slots: [ 4, 3, 3, 3, 2, 1, 1 ]},
  {level: 14, slots: [ 4, 3, 3, 3, 2, 1, 1 ]},
  {level: 15, slots: [ 4, 3, 3, 3, 2, 1, 1, 1 ]},
  {level: 16, slots: [ 4, 3, 3, 3, 2, 1, 1, 1 ]},
  {level: 17, slots: [ 4, 3, 3, 3, 2, 1, 1, 1, 1 ]},
  {level: 18, slots: [ 4, 3, 3, 3, 3, 1, 1, 1, 1 ]},
  {level: 19, slots: [ 4, 3, 3, 3, 3, 2, 1, 1, 1 ]},
  {level: 20, slots: [ 4, 3, 3, 3, 3, 2, 2, 1, 1 ]},
];

const HALF_CASTER_SLOTS: SlotProgression = [
  {level: 0, slots: []},
  {level: 1, slots: [ 2 ]},
  {level: 2, slots: [ 2 ]},
  {level: 3, slots: [ 3 ]},
  {level: 4, slots: [ 3 ]},
  {level: 5, slots: [ 4, 2 ]},
  {level: 6, slots: [ 4, 2 ]},
  {level: 7, slots: [ 4, 3 ]},
  {level: 8, slots: [ 4, 3 ]},
  {level: 9, slots: [ 4, 3, 2 ]},
  {level: 10, slots: [ 4, 3, 2 ]},
  {level: 11, slots: [ 4, 3, 3 ]},
  {level: 12, slots: [ 4, 3, 3 ]},
  {level: 13, slots: [ 4, 3, 3, 1 ]},
  {level: 14, slots: [ 4, 3, 3, 1 ]},
  {level: 15, slots: [ 4, 3, 3, 2 ]},
  {level: 16, slots: [ 4, 3, 3, 2 ]},
  {level: 17, slots: [ 4, 3, 3, 3, 1 ]},
  {level: 18, slots: [ 4, 3, 3, 3, 1 ]},
  {level: 19, slots: [ 4, 3, 3, 3, 2 ]},
  {level: 20, slots: [ 4, 3, 3, 3, 2 ]},
];

const THIRD_CASTER_SLOTS: SlotProgression = [
  {level: 0, slots: []},
  {level: 1, slots: []},
  {level: 2, slots: []},
  {level: 3, slots: [ 2 ]},
  {level: 4, slots: [ 3 ]},
  {level: 5, slots: [ 3 ]},
  {level: 6, slots: [ 3, 2 ]},
  {level: 7, slots: [ 4, 2 ]},
  {level: 8, slots: [ 4, 2 ]},
  {level: 9, slots: [ 4, 2 ]},
  {level: 10, slots: [ 4, 3 ]},
  {level: 11, slots: [ 4, 3 ]},
  {level: 12, slots: [ 4, 3 ]},
  {level: 13, slots: [ 4, 3, 2 ]},
  {level: 14, slots: [ 4, 3, 2 ]},
  {level: 15, slots: [ 4, 3, 2 ]},
  {level: 16, slots: [ 4, 3, 3 ]},
  {level: 17, slots: [ 4, 3, 3 ]},
  {level: 18, slots: [ 4, 3, 3 ]},
  {level: 19, slots: [ 4, 3, 3, 1 ]},
  {level: 20, slots: [ 4, 3, 3, 1 ]},
];

function slotsFromProgression(progression: number[]): SpellSlotsType {
  const slots: number[] = [];

  for (let level = 1; level <= 9; level++) {
    const slotsAtLevel = progression[level - 1] || 0;
    for (let i = 0; i < slotsAtLevel; i++) {
      slots.push(level);
    }
  }

  return slots as SpellSlotsType;
}

const srd51 = {
  Races: SpeciesData,
  RaceNames,
  SubraceNames,
  Classes,
  ClassNames,
  SubclassNames,
  Backgrounds,
  BackgroundNames,
  SpellProgressionTables,
  THIRD_CASTER_CANTRIPS_KNOWN,
  THIRD_CASTER_SPELLS_PREPARED,
  FULL_CASTER_SLOTS,
  HALF_CASTER_SLOTS,
  THIRD_CASTER_SLOTS,

  maxCantripsKnown(className: ClassNameType, level: number): number {
    const classDef = this.Classes[className];
    if (!classDef.spellcasting.enabled) return 0;

    switch (className) {
      case "bard":
      case "sorcerer":
      case "warlock":
      case "cleric":
      case "druid":
      case "wizard":
        return this.SpellProgressionTables[className]![level]?.cantrips || 0;
      case "fighter": // Eldritch Knight
      case "rogue":   // Arcane Trickster
        return this.THIRD_CASTER_CANTRIPS_KNOWN[level] || 0;
      default: return 0;
    }
  },

  maxSpellsPrepared(className: ClassNameType, level: number, abilityModifier: number): number | null {
    const classDef = this.Classes[className];
    if (!classDef.spellcasting.enabled) {
      return null; // Not a "known" caster
    }

    const progression = this.SpellProgressionTables[className];
    if (!progression || !progression[level]) {
      return 0;
    }

    const entry = progression[level];
    if (entry.prepared) {
      return entry.prepared;
    } else if (entry.prepared_fn) {
      return entry.prepared_fn(level, abilityModifier);
    }

    return 0;
  },

  getSlotsFor(casterKind: CasterKindType, level: number): SpellSlotsType {
    if (casterKind === "full") {
      return slotsFromProgression(this.FULL_CASTER_SLOTS[level]?.slots || []);
    } else if (casterKind === "half") {
      return slotsFromProgression(this.HALF_CASTER_SLOTS[level]?.slots || []);
    } else if (casterKind === "third") {
      return slotsFromProgression(this.THIRD_CASTER_SLOTS[level]?.slots || []);
    } else if (casterKind === "pact") {
      const progression = this.SpellProgressionTables["warlock"]!;
      return slotsFromProgression(progression[level]?.slots || []);
    } else {
      return []
    }
  }
}

export default srd51;
