import { z } from "zod";

export const Sizes = ["tiny", "small", "medium", "large", "huge", "gargantuan"] as const;
export const SizeSchema = z.enum(Sizes);
export type SizeType = z.infer<typeof SizeSchema>;

export const Abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
export const AbilitySchema = z.enum(Abilities);
export type AbilityType = z.infer<typeof AbilitySchema>;

export const Skills = ["acrobatics","animal handling","arcana","athletics","deception","history","insight","intimidation","investigation","medicine","nature","perception","performance","persuasion","religion","sleight of hand","stealth","survival"] as const;
export const SkillSchema = z.enum(Skills);
export type SkillType = z.infer<typeof SkillSchema>;

export type AbilityScoreModifiers = {
  [key in AbilityType]?: number;
}

export interface Subrace {
  name: string;
  ability_score_modifiers?: AbilityScoreModifiers;
}

export interface Race {
  name: string;
  size: SizeType;
  speed: number;
  ability_score_modifiers?: AbilityScoreModifiers;
  subraces?: Subrace[];
  variants?: Subrace[];
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
      { name: "mountain dwarf", ability_score_modifiers: { strength: 2 } }
    ]
  },
  {
    name: "elf",
    size: "medium",
    speed: 30,
    ability_score_modifiers: { dexterity: 2 },
    subraces: [
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
    subraces: [
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
    subraces: [
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
export const RaceNames = Races.map(c => c.name);
export const RaceNamesSchema = z.enum(RaceNames);
export type RaceNameType = z.infer<typeof RaceNamesSchema>;

export const SubraceNames = Races.flatMap(r => r.subraces ? r.subraces.map(sr => sr.name) : []);
export const SubraceNamesSchema = z.enum(SubraceNames);
export type SubraceNameType = z.infer<typeof SubraceNamesSchema>;

// =====================
// Types & Interfaces
// =====================

export interface Choice<T> {
  /** Choose `choose` items from `from` */
  choose: number;
  from: T[];
}

// Helper “choice pools”
const GamingSets = [
  "dice set",
  "playing card set",
] as const;

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
] as const;

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
] as const;

// =====================
// Data (Player’s handbook)
// =====================
//

export type SpellcastingInfo = { notes?: string} & ({ enabled: false } | {
  enabled: true;
  ability: AbilityType;
})

export interface ClassDef {
  name: string;
  hitDie: "d6" | "d8" | "d10" | "d12";
  primaryAbilities: AbilityType[];
  savingThrows: AbilityType[];

  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: (string | Choice<string>)[];

  skillChoices: Choice<SkillType>;

  subclasses: string[];
  subclassLevel: number; // Level at which subclass is chosen; default 3
  spellcasting: SpellcastingInfo;
  notes?: string;
}

// =====================
// Data (Player’s Handbook classes, lowercase)
// =====================

export const Classes: ClassDef[] = [
  {
    name: "barbarian",
    hitDie: "d12",
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
  {
    name: "bard",
    hitDie: "d8",
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
    spellcasting: { enabled: true, ability: "charisma" },
  },
  {
    name: "cleric",
    hitDie: "d8",
    primaryAbilities: ["wisdom"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["history", "insight", "medicine", "persuasion", "religion"] },
    subclasses: ["knowledge", "life", "light", "nature", "tempest", "trickery", "war"],
    subclassLevel: 1,
    spellcasting: { enabled: true, ability: "wisdom" },
  },
  {
    name: "druid",
    hitDie: "d8",
    primaryAbilities: ["wisdom"],
    savingThrows: ["intelligence", "wisdom"],
    armorProficiencies: ["light (nonmetal)", "medium (nonmetal)", "shields (nonmetal)"],
    weaponProficiencies: ["clubs","daggers","darts","javelins","maces","quarterstaffs","scimitars","sickles","slings","spears"],
    toolProficiencies: ["herbalism kit"],
    skillChoices: { choose: 2, from: ["arcana","animal handling","insight","medicine","nature","perception","religion","survival"] },
    subclasses: ["circle of the land", "circle of the moon"],
    subclassLevel: 2,
    spellcasting: { enabled: true, ability: "wisdom" },
  },
  {
    name: "fighter",
    hitDie: "d10",
    primaryAbilities: ["strength", "dexterity", "constitution"],
    savingThrows: ["strength", "constitution"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["acrobatics","animal handling","athletics","history","insight","intimidation","perception","survival"] },
    subclasses: ["champion", "battle master", "eldritch knight"],
    subclassLevel: 3,
    spellcasting: { enabled: false, notes: "eldritch knight subclass gains limited casting (intelligence)" },
  },
  {
    name: "monk",
    hitDie: "d8",
    primaryAbilities: ["dexterity", "wisdom"],
    savingThrows: ["strength", "dexterity"],
    armorProficiencies: [],
    weaponProficiencies: ["simple", "shortsword"],
    toolProficiencies: [{ choose: 1, from: ["artisan’s tools", "musical instrument"] }],
    skillChoices: { choose: 2, from: ["acrobatics","athletics","history","insight","religion","stealth"] },
    subclasses: ["way of the open hand", "way of shadow", "way of the four elements"],
    subclassLevel: 3,
    spellcasting: { enabled: false },
  },
  {
    name: "paladin",
    hitDie: "d10",
    primaryAbilities: ["strength", "charisma"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["athletics","insight","intimidation","medicine","persuasion","religion"] },
    subclasses: ["oath of devotion", "oath of the ancients", "oath of vengeance"],
    subclassLevel: 3,
    spellcasting: { enabled: true, ability: "charisma", notes: "half-caster progression" },
  },
  {
    name: "ranger",
    hitDie: "d10",
    primaryAbilities: ["dexterity", "wisdom"],
    savingThrows: ["strength", "dexterity"],
    armorProficiencies: ["light", "medium", "shields"],
    weaponProficiencies: ["simple", "martial"],
    toolProficiencies: [],
    skillChoices: { choose: 3, from: ["animal handling","athletics","insight","investigation","nature","perception","stealth","survival"] },
    subclasses: ["hunter", "beast master"],
    subclassLevel: 3,
    spellcasting: { enabled: true, ability: "wisdom", notes: "half-caster progression" },
  },
  {
    name: "rogue",
    hitDie: "d8",
    primaryAbilities: ["dexterity"],
    savingThrows: ["dexterity", "intelligence"],
    armorProficiencies: ["light"],
    weaponProficiencies: ["simple", "hand crossbow", "longsword", "rapier", "shortsword"],
    toolProficiencies: ["thieves’ tools"],
    skillChoices: { choose: 4, from: ["acrobatics","athletics","deception","insight","intimidation","investigation","perception","performance","persuasion","sleight of hand","stealth"] },
    subclasses: ["thief", "assassin", "arcane trickster"],
    subclassLevel: 3,
    spellcasting: { enabled: false, notes: "arcane trickster subclass gains limited casting (intelligence)" },
  },
  {
    name: "sorcerer",
    hitDie: "d6",
    primaryAbilities: ["charisma"],
    savingThrows: ["constitution", "charisma"],
    armorProficiencies: [],
    weaponProficiencies: ["dagger","dart","sling","quarterstaff","light crossbow"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["arcana","deception","insight","intimidation","persuasion","religion"] },
    subclasses: ["draconic bloodline", "wild magic"],
    subclassLevel: 1,
    spellcasting: { enabled: true, ability: "charisma" },
  },
  {
    name: "warlock",
    hitDie: "d8",
    primaryAbilities: ["charisma"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light"],
    weaponProficiencies: ["simple"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["arcana","deception","history","intimidation","investigation","nature","religion"] },
    subclasses: ["the archfey", "the fiend", "the great old one"],
    subclassLevel: 1,
    spellcasting: { enabled: true, ability: "charisma", notes: "pact magic progression" },
  },
  {
    name: "wizard",
    hitDie: "d6",
    primaryAbilities: ["intelligence"],
    savingThrows: ["intelligence", "wisdom"],
    armorProficiencies: [],
    weaponProficiencies: ["dagger","dart","sling","quarterstaff","light crossbow"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["arcana","history","insight","investigation","medicine","religion"] },
    subclasses: ["school of abjuration","school of conjuration","school of divination","school of enchantment","school of evocation","school of illusion","school of necromancy","school of transmutation"],
    subclassLevel: 2,
    spellcasting: { enabled: true, ability: "intelligence" },
  }
];
export const ClassNames = Classes.map(c => c.name);
export const ClassNamesSchema = z.enum(ClassNames);
export type ClassNameType = z.infer<typeof ClassNamesSchema>;

export const SubclassNames = Classes.flatMap(c => c.subclasses ? c.subclasses : []);
export const SubclassNamesSchema = z.enum(ClassNames);
export type SubclassNameType = z.infer<typeof SubclassNamesSchema>;

export interface BackgroundFeature {
  name: string;
  summary: string; // Short summary, no rules text
}

export interface Background {
  name: string;

  /** Usually two fixed skills; sometimes represent “choose” for variants/future content */
  skillProficiencies: (SkillType | Choice<SkillType>)[];

  /** Tool proficiencies can be fixed or a choice; include vehicles under tools for simplicity */
  toolProficiencies?: (string | Choice<string>)[];

  /** Languages can be a number (any choices), a fixed array, or a structured Choice */
  languageProficiencies?: number | string[] | Choice<string>;

  /** Starting equipment as brief strings */
  equipment?: string[];

  feature: BackgroundFeature;

  /** Optional notes for PHB variants (e.g., Sailor → pirate feature swap) */
  variants?: Background[];
}

export const Backgrounds: Background[] = [
  {
    name: "acolyte",
    skillProficiencies: ["insight", "religion"],
    languageProficiencies: 2,
    equipment: ["holy symbol", "prayer book or prayer wheel", "5 sticks of incense", "vestments", "common clothes", "15 gp"],
    feature: {
      name: "shelter of the Faithful",
      summary: "free support and lodging at a temple of your faith; connections to clergy.",
    },
  },
  {
    name: "charlatan",
    skillProficiencies: ["deception", "sleight of hand"],
    toolProficiencies: ["disguise kit", "forgery kit"],
    equipment: ["fine clothes", "disguise kit", "con tools (e.g., signet of a fake identity)", "15 gp"],
    feature: {
      name: "false identity",
      summary: "you maintain a second identity with documentation, acquaintances, and disguises.",
    },
  },
  {
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
  {
    name: "entertainer",
    skillProficiencies: ["acrobatics", "performance"],
    toolProficiencies: [
      { choose: 1, from: [...Instruments] as unknown as string[] },
      "disguise kit",
    ],
    equipment: ["musical instrument (one of your choice)", "favor of an admirer", "costume", "15 gp"],
    feature: {
      name: "by Popular Demand",
      summary: "you can find a place to perform and secure free lodging and modest food.",
    },
  },
  {
    name: "folk hero",
    skillProficiencies: ["animal handling", "survival"],
    toolProficiencies: [
      { choose: 1, from: [...ArtisanTools] as unknown as string[] },
      "vehicles (land)",
    ],
    equipment: ["artisan’s tools (one of your choice)", "shovel", "iron pot", "common clothes", "10 gp"],
    feature: {
      name: "rustic Hospitality",
      summary: "common folk will shelter you; you can hide among them.",
    },
  },
  {
    name: "guild artisan",
    skillProficiencies: ["insight", "persuasion"],
    toolProficiencies: [{ choose: 1, from: [...ArtisanTools] as unknown as string[] }],
    languageProficiencies: 1,
    equipment: ["artisan’s tools (one of your choice)", "letter of introduction from your guild", "traveler’s clothes", "15 gp"],
    feature: {
      name: "guild Membership",
      summary: "access to guild facilities, contacts, and legal support (with dues).",
    },
  },
  {
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
  {
    name: "noble",
    skillProficiencies: ["history", "persuasion"],
    toolProficiencies: [{ choose: 1, from: [...GamingSets] as unknown as string[] }],
    languageProficiencies: 1,
    equipment: ["fine clothes", "signet ring", "scroll of pedigree", "25 gp"],
    feature: {
      name: "position of Privilege",
      summary: "high social standing; easier audience with nobles and officials.",
    },
  },
  {
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
  {
    name: "sage",
    skillProficiencies: ["arcana", "history"],
    languageProficiencies: 2,
    equipment: ["bottle of black ink", "quill", "small knife", "letter from a dead colleague with a question you haven’t answered", "common clothes", "10 gp"],
    feature: {
      name: "researcher",
      summary: "you can usually find where to obtain lore; you know how to get answers.",
    },
  },
  {
    name: "sailor",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator’s tools", "vehicles (water)"],
    equipment: ["belaying pin (club)", "50 feet of silk rope", "lucky charm", "common clothes", "10 gp"],
    feature: {
      name: "ship’s passage",
      summary: "secure free passage on a sailing ship for you and companions (with obligations).",
    },
    variants: [
      {
        name: "pirate",
        skillProficiencies: ["athletics", "perception"],
        toolProficiencies: ["navigator’s tools", "vehicles (water)"],
        equipment: ["belaying pin (club)", "50 feet of silk rope", "lucky charm", "common clothes", "10 gp"],
        feature: {
          name: "bad reputation",
          summary: "your notoriety lets you get away with minor crimes; people fear you.",
        },
      },
    ],
  },
  {
    name: "soldier",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: [{ choose: 1, from: [...GamingSets] as unknown as string[] }, "vehicles (land)"],
    equipment: ["insignia of rank", "trophy from a fallen enemy", "bone dice or deck of cards", "common clothes", "10 gp"],
    feature: {
      name: "military Rank",
      summary: "you have a rank; soldiers loyal to your former organization recognize authority.",
    },
  },
  {
    name: "urchin",
    skillProficiencies: ["sleight of hand", "stealth"],
    toolProficiencies: ["disguise kit", "thieves’ tools"],
    equipment: ["small knife", "map of city you grew up in", "pet mouse", "token to remember parents", "common clothes", "10 gp"],
    feature: {
      name: "city Secrets",
      summary: "you and companions can move through a city twice as fast via alleys and passages.",
    },
  },
] as const;

export const BackgroundNames = Backgrounds.map(b => b.name);
export const BackgroundNamesSchema = z.enum(BackgroundNames);
export type BackgroundNameType = z.infer<typeof BackgroundNamesSchema>;
