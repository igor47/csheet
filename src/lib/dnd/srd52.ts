import type {
  Background,
  CasterKindType,
  ClassDef,
  ClassNameType,
  Lineage,
  Ruleset,
  SlotProgression,
  Species,
  SpellSlotsType,
} from "../dnd"

const SpeciesData: Species[] = [
  {
    name: "dragonborn",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "Draconic Ancestry",
        description: "Your lineage stems from a dragon progenitor. Choose the kind of dragon from your lineage. Your choice affects your Breath Weapon and Damage Resistance traits as well as your appearance.",
      },
      {
        name: "Breath Weapon",
        description: "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 damage of the type determined by your Draconic Ancestry trait. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
      },
      {
        name: "Damage Resistance",
        description: "You have Resistance to the damage type determined by your Draconic Ancestry trait.",
      },
      {
        name: "Darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "Draconic Flight",
        description: "As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        level: 5,
      },
    ],
    lineages: [
      { name: "black", traits: [{ name: "Damage Type", description: "Acid" }] },
      { name: "blue", traits: [{ name: "Damage Type", description: "Lightning" }] },
      { name: "brass", traits: [{ name: "Damage Type", description: "Fire" }] },
      { name: "bronze", traits: [{ name: "Damage Type", description: "Lightning" }] },
      { name: "copper", traits: [{ name: "Damage Type", description: "Acid" }] },
      { name: "gold", traits: [{ name: "Damage Type", description: "Fire" }] },
      { name: "green", traits: [{ name: "Damage Type", description: "Poison" }] },
      { name: "red", traits: [{ name: "Damage Type", description: "Fire" }] },
      { name: "silver", traits: [{ name: "Damage Type", description: "Cold" }] },
      { name: "white", traits: [{ name: "Damage Type", description: "Cold" }] },
    ]
  },
  {
    name: "dwarf",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "Darkvision",
        description: "You have Darkvision with a range of 120 feet.",
      },
      {
        name: "Dwarven Resilience",
        description: "You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.",
      },
      {
        name: "Dwarven Toughness",
        description: "Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.",
      },
      {
        name: "Stonecunning",
        description: "As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Tremorsense. The stone can be natural or worked. You can use this Bonus Action a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
      },
    ],
  },
  {
    name: "elf",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "Darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "Elven Lineage",
        description: "You are part of a lineage that grants you supernatural abilities. Choose a lineage from your available options. You gain the level 1 benefit of that lineage. When you reach character levels 3 and 5, you learn a higher-level spell as shown in your lineage. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
      },
      {
        name: "Fey Ancestry",
        description: "You have Advantage on saving throws you make to avoid or end the Charmed condition.",
      },
      {
        name: "Keen Senses",
        description: "You have proficiency in the Insight, Perception, or Survival skill.",
      },
      {
        name: "Trance",
        description: "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
      },
    ],
    lineages: [
      {
        name: "drow",
        traits: [
          {
            name: "Superior Darkvision",
            description: "The range of your Darkvision increases to 120 feet. You also know the Dancing Lights cantrip.",
          },
          {
            name: "Faerie Fire",
            description: "You learn the Faerie Fire spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 3,
          },
          {
            name: "Darkness",
            description: "You learn the Darkness spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
      {
        name: "high elf",
        traits: [
          {
            name: "Cantrip",
            description: "You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.",
          },
          {
            name: "Detect Magic",
            description: "You learn the Detect Magic spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 3,
          },
          {
            name: "Misty Step",
            description: "You learn the Misty Step spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
      {
        name: "wood elf",
        traits: [
          {
            name: "Fleet of Foot",
            description: "Your Speed increases to 35 feet. You also know the Druidcraft cantrip.",
          },
          {
            name: "Longstrider",
            description: "You learn the Longstrider spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 3,
          },
          {
            name: "Pass without Trace",
            description: "You learn the Pass without Trace spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
    ],
  },
  {
    name: "gnome",
    size: "small",
    speed: 30,
    traits: [
      {
        name: "Darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "Gnomish Cunning",
        description: "You have Advantage on Intelligence, Wisdom, and Charisma saving throws.",
      },
      {
        name: "Gnomish Lineage",
        description: "You are part of a lineage that grants you supernatural abilities. Choose one of the available lineages. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
      },
    ],
    lineages: [
      {
        name: "forest gnome",
        traits: [
          {
            name: "Natural Illusionist",
            description: "You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell.",
          },
        ],
      },
      {
        name: "rock gnome",
        traits: [
          {
            name: "Tinker",
            description: "You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. When you create the device, you determine its function by choosing one effect from Prestidigitation; the device produces that effect whenever you or another creature takes a Bonus Action to activate it with a touch. If the chosen effect has options within it, you choose one of those options for the device when you create it. For example, if you choose the spell's ignite-extinguish effect, you determine whether the device ignites or extinguishes fire; the device doesn't do both. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action.",
          },
        ],
      },
    ],
  },
  {
    name: "goliath",
    size: "medium",
    speed: 35,
    traits: [
      {
        name: "Giant Ancestry",
        description: "You are descended from Giants. Choose one of the following benefits—a supernatural boon from your ancestry; you can use the chosen benefit a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest: Cloud's Jaunt (Cloud Giant) - As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see. Fire's Burn (Fire Giant) - When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target. Frost's Chill (Frost Giant) - When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 Cold damage to that target and reduce its Speed by 10 feet until the start of your next turn. Hill's Tumble (Hill Giant) - When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition. Stone's Endurance (Stone Giant) - When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total. Storm's Thunder (Storm Giant) - When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature.",
      },
      {
        name: "Large Form",
        description: "You can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
        level: 5,
      },
      {
        name: "Powerful Build",
        description: "You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
      },
    ],
  },
  {
    name: "halfling",
    size: "small",
    speed: 30,
    traits: [
      {
        name: "Brave",
        description: "You have Advantage on saving throws you make to avoid or end the Frightened condition.",
      },
      {
        name: "Halfling Nimbleness",
        description: "You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
      },
      {
        name: "Luck",
        description: "When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
      },
      {
        name: "Naturally Stealthy",
        description: "You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
      },
    ],
  },
  {
    name: "human",
    size: "medium", // or small
    speed: 30,
    traits: [
      {
        name: "Resourceful",
        description: "You gain Heroic Inspiration whenever you finish a Long Rest.",
      },
      {
        name: "Skillful",
        description: "You gain proficiency in one skill of your choice.",
      },
      {
        name: "Versatile",
        description: "You gain an Origin feat of your choice. Skilled is recommended.",
      },
    ],
  },
  {
    name: "orc",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "Adrenaline Rush",
        description: "You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency Bonus. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long Rest.",
      },
      {
        name: "Darkvision",
        description: "You have Darkvision with a range of 120 feet.",
      },
      {
        name: "Relentless Endurance",
        description: "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't do so again until you finish a Long Rest.",
      },
    ],
  },
  {
    name: "tiefling",
    size: "medium", // or small
    speed: 30,
    traits: [
      {
        name: "Darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "Fiendish Legacy",
        description: "You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the available options (Abyssal, Chthonic, or Infernal). You gain the level 1 benefit of the chosen legacy. When you reach character levels 3 and 5, you learn a higher-level spell. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
      },
      {
        name: "Otherworldly Presence",
        description: "You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait.",
      },
    ],
  },
] as const

const BackgroundNames = ["acolyte", "criminal", "sage", "soldier"] as const
export type BackgroundNameType = (typeof BackgroundNames)[number]

const Backgrounds: Record<BackgroundNameType, Background> = {
  acolyte: {
    name: "acolyte",
    skillProficiencies: ["insight", "religion"],
    feat: "Magic Initiate (Cleric)",
    abilityScoresModified: ["intelligence", "wisdom", "charisma"],
    equipment: [
      "Calligrapher’s Supplies",
      "Book (prayers)",
      "Holy Symbol",
      "Parchment (10 sheets)",
      "Robe",
      "8 GP",
    ],
    feature: {
      name: "shelter of the faithful",
      summary: "free support and lodging at a temple of your faith; connections to clergy.",
    },
  },
  criminal: {
    name: "criminal",
    skillProficiencies: ["deception", "stealth"],
    toolProficiencies: ["thieves’ tools"],
    feat: "Alert",
    abilityScoresModified: ["dexterity", "constitution", "intelligence"],
    equipment: [
      "2 Daggers",
      "Thieves’ Tools",
      "Crowbar",
      "2 Pouches",
      "Traveler’s Clothes",
      "16 GP",
    ],
    feature: {
      name: "criminal contact",
      summary: "a reliable and trustworthy contact within the criminal underworld.",
    },
  },
  sage: {
    name: "sage",
    skillProficiencies: ["arcana", "history"],
    toolProficiencies: ["calligrapher's supplies"],
    feat: "Magic Initiate (Wizard)",
    abilityScoresModified: ["constitution", "intelligence", "wisdom"],
    equipment: [
      "Quarterstaff",
      "Calligrapher’s Supplies",
      "Book (history)",
      "Parchment (8 sheets)",
      "Robe",
      "8 GP",
    ],
    feature: {
      name: "researcher",
      summary: "you can usually find where to obtain lore; you know how to get answers.",
    },
  },
  soldier: {
    name: "soldier",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }],
    feat: "Savage Attacker",
    abilityScoresModified: ["strength", "dexterity", "constitution"],
    equipment: [
      "Spear",
      "Shortbow",
      "20 Arrows",
      "Gaming Set",
      "Healer’s Kit",
      "Quiver",
      "Traveler’s Clothes",
      "14 GP",
    ],
    feature: {
      name: "military rank",
      summary: "you have a rank; soldiers loyal to your former organization recognize authority.",
    },
  },
} as const




const ClassNames = [
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
    subclasses: ["path of the berserker"],
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
    subclasses: ["college of lore"],
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
    subclasses: ["life domain"],
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
    subclasses: ["circle of the land"],
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
    subclasses: ["champion"],
    subclassLevel: 3,
    spellcasting: { enabled: false },
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
    subclasses: ["warrior of the open hand"],
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
    subclasses: ["oath of devotion"],
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
    subclasses: ["hunter"],
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
    subclasses: ["thief"],
    subclassLevel: 3,
    spellcasting: { enabled: false },
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
    subclasses: ["draconic sorcery"],
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
    subclasses: ["fiend patron"],
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
    subclasses: ["evoker"],
    subclassLevel: 2,
    spellcasting: {
      enabled: true,
      kind: "full",
      ability: "intelligence",
      changePrepared: "longrest",
    },
  },
}
const SubclassNames = Object.values(Classes).flatMap((c) => (c.subclasses ? c.subclasses : []))

type SpellProgressionTableRow = {
  level: number
  cantrips: number
  prepared?: number
  slots: number[] // 1st to 9th level slots
  arcanum?: Record<number, number> // warlock-only
}

// biome-ignore format: easier to read as tables
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
    { level: 17, cantrips: 4, prepared: 14, slots: [0, 0, 0, 0, 4], arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 } },
    { level: 18, cantrips: 4, prepared: 14, slots: [0, 0, 0, 0, 4], arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 } },
    { level: 19, cantrips: 4, prepared: 15, slots: [0, 0, 0, 0, 4], arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 } },
    { level: 20, cantrips: 4, prepared: 15, slots: [0, 0, 0, 0, 4], arcanum: { 6: 1, 7: 1, 8: 1, 9: 1 } },
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

type SpellProgression = number[]

// biome-ignore format: easier to read as tables
const THIRD_CASTER_CANTRIPS_KNOWN: SpellProgression = [
  0, 0, 0, // 0-2 (unused / not yet a caster)
  2, 2, 2, 2, 2, 2, 2, 3, // 3-10
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // 11-20
]

// biome-ignore format: easier to read as tables
const THIRD_CASTER_SPELLS_PREPARED: SpellProgression = [
  0, 0, 0, // 0-2 (unused / not yet a caster)
  3, 4, 4, 5, 6, 6, 7, 8, // 3-10
  8, 9, 10, 10, 11, 11, 12, 13, 13, 13, // 11-20
]

const FULL_CASTER_SLOTS: SlotProgression = [
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

const HALF_CASTER_SLOTS: SlotProgression = [
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

const THIRD_CASTER_SLOTS: SlotProgression = [
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

const srd52: Ruleset = {
  species: SpeciesData,
  classes: Object.values(Classes),
  backgrounds: Object.values(Backgrounds),

  listLineages(speciesName?: string): Lineage[] {
    if (speciesName) {
      const species = SpeciesData.find((s) => s.name === speciesName)
      return species?.lineages || []
    }
    return SpeciesData.flatMap((s) => s.lineages || [])
  },

  listSubclasses(className?: ClassNameType): string[] {
    if (className) {
      return Classes[className]?.subclasses || []
    }
    return SubclassNames
  },

  maxCantripsKnown(className: ClassNameType, level: number): number {
    const classDef = Classes[className]
    if (!classDef.spellcasting.enabled) return 0

    switch (className) {
      case "bard":
      case "sorcerer":
      case "warlock":
      case "cleric":
      case "druid":
      case "wizard":
        return SpellProgressionTables[className]![level]?.cantrips || 0
      case "fighter": // Eldritch Knight
      case "rogue": // Arcane Trickster
        return THIRD_CASTER_CANTRIPS_KNOWN[level] || 0
      default:
        return 0
    }
  },

  maxSpellsPrepared(
    className: ClassNameType,
    level: number,
    _abilityModifier: number
  ): number {
    const classDef = Classes[className]
    if (!classDef.spellcasting.enabled) {
      return 0
    }

    const progression = SpellProgressionTables[className]
    if (!progression || !progression[level]) {
      return 0
    }

    const entry = progression[level]
    if (entry.prepared) {
      return entry.prepared
    }

    return 0
  },

  getSlotsFor(casterKind: CasterKindType, level: number): SpellSlotsType {
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
  },
}

export default srd52
