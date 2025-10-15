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
    name: "dwarf",
    size: "medium",
    speed: 25,
    abilityScoreModifiers: { constitution: 2 },
    traits: [
      {
        name: "Darkvision",
        description:
          "Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
      },
      {
        name: "Dwarven Resilience",
        description:
          "You have advantage on saving throws against poison, and you have resistance against poison damage.",
      },
      {
        name: "Dwarven Combat Training",
        description:
          "You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.",
      },
      {
        name: "Tool Proficiency",
        description:
          "You gain proficiency with the artisan's tools of your choice: smith's tools, brewer's supplies, or mason's tools.",
      },
      {
        name: "Stonecunning",
        description:
          "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check, instead of your normal proficiency bonus.",
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and Dwarvish. Dwarvish is full of hard consonants and guttural sounds, and those characteristics spill over into whatever other language a dwarf might speak.",
      },
    ],
    lineages: [
      {
        name: "hill dwarf",
        abilityScoreModifiers: { wisdom: 1 },
        traits: [
          {
            name: "Dwarven Toughness",
            description:
              "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.",
          },
        ],
      },
      {
        name: "mountain dwarf",
        abilityScoreModifiers: { strength: 2 },
        traits: [
          {
            name: "Dwarven Armor Training",
            description: "You have proficiency with light and medium armor.",
          },
        ],
      },
    ],
  },
  {
    name: "elf",
    size: "medium",
    speed: 30,
    abilityScoreModifiers: { dexterity: 2 },
    traits: [
      {
        name: "Darkvision",
        description:
          "Accustomed to twilit forests and the night sky, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
      },
      {
        name: "Keen Senses",
        description: "You have proficiency in the Perception skill.",
      },
      {
        name: "Fey Ancestry",
        description:
          "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
      },
      {
        name: "Trance",
        description:
          'Elves don\'t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. (The Common word for such meditation is "trance.") While meditating, you can dream after a fashion; such dreams are actually mental exercises that have become reflexive through years of practice. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.',
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and Elvish. Elvish is fluid, with subtle intonations and intricate grammar. Elven literature is rich and varied, and their songs and poems are famous among other species. Many bards learn their language so they can add Elvish ballads to their repertoires.",
      },
    ],
    lineages: [
      {
        name: "high elf",
        abilityScoreModifiers: { intelligence: 1 },
        traits: [
          {
            name: "Elf Weapon Training",
            description:
              "You have proficiency with the longsword, shortsword, shortbow, and longbow.",
          },
          {
            name: "Cantrip",
            description:
              "You know one cantrip of your choice from the wizard spell list. Intelligence is your spellcasting ability for it.",
          },
          {
            name: "Extra Language",
            description: "You can speak, read, and write one extra language of your choice.",
          },
        ],
      },
      {
        name: "wood elf",
        abilityScoreModifiers: { wisdom: 1 },
        traits: [
          {
            name: "Elf Weapon Training",
            description:
              "You have proficiency with the longsword, shortsword, shortbow, and longbow.",
          },
          {
            name: "Fleet of Foot",
            description: "Your base walking speed increases to 35 feet.",
          },
          {
            name: "Mask of the Wild",
            description:
              "You can attempt to hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.",
          },
        ],
      },
      {
        name: "drow",
        abilityScoreModifiers: { charisma: 1 },
        traits: [
          {
            name: "Superior Darkvision",
            description: "Your darkvision has a radius of 120 feet.",
          },
          {
            name: "Sunlight Sensitivity",
            description:
              "You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.",
          },
          {
            name: "Drow Magic",
            description:
              "You know the dancing lights cantrip. When you reach 3rd level, you can cast the faerie fire spell once with this trait and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast the darkness spell once with this trait and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells.",
            level: 1,
          },
          {
            name: "Drow Weapon Training",
            description: "You have proficiency with rapiers, shortswords, and hand crossbows.",
          },
        ],
      },
    ],
  },
  {
    name: "halfling",
    size: "small",
    speed: 25,
    abilityScoreModifiers: { dexterity: 2 },
    traits: [
      {
        name: "Lucky",
        description:
          "When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
      },
      {
        name: "Brave",
        description: "You have advantage on saving throws against being frightened.",
      },
      {
        name: "Halfling Nimbleness",
        description:
          "You can move through the space of any creature that is of a size larger than yours.",
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and Halfling. The Halfling language isn't secret, but halflings are loath to share it with others. They write very little, so they don't have a rich body of literature. Their oral tradition, however, is very strong. Almost all halflings speak Common to converse with the people in whose lands they dwell or through which they are traveling.",
      },
    ],
    lineages: [
      {
        name: "lightfoot",
        abilityScoreModifiers: { charisma: 1 },
        traits: [
          {
            name: "Naturally Stealthy",
            description:
              "You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.",
          },
        ],
      },
      {
        name: "stout",
        abilityScoreModifiers: { constitution: 1 },
        traits: [
          {
            name: "Stout Resilience",
            description:
              "You have advantage on saving throws against poison, and you have resistance against poison damage.",
          },
        ],
      },
    ],
  },
  {
    name: "human",
    size: "medium",
    speed: 30,
    abilityScoreModifiers: {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1,
    },
    traits: [
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and one extra language of your choice. Humans typically learn the languages of other peoples they deal with, including obscure dialects. They are fond of sprinkling their speech with words borrowed from other tongues: Orc curses, Elvish musical expressions, Dwarvish military phrases, and so on.",
      },
    ],
    variants: [],
  },
  {
    name: "dragonborn",
    size: "medium",
    speed: 30,
    abilityScoreModifiers: { strength: 2, charisma: 1 },
    traits: [
      {
        name: "Draconic Ancestry",
        description:
          "You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type, as shown in the table.",
      },
      {
        name: "Breath Weapon",
        description:
          "You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation. When you use your breath weapon, each creature in the area of the exhalation must make a saving throw, the type of which is determined by your draconic ancestry. The DC for this saving throw equals 8 + your Constitution modifier + your proficiency bonus. A creature takes 2d6 damage on a failed save, and half as much damage on a successful one. The damage increases to 3d6 at 6th level, 4d6 at 11th level, and 5d6 at 16th level. After you use your breath weapon, you can't use it again until you complete a short or long rest.",
      },
      {
        name: "Damage Resistance",
        description:
          "You have resistance to the damage type associated with your draconic ancestry.",
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and Draconic. Draconic is thought to be one of the oldest languages and is often used in the study of magic. The language sounds harsh to most other creatures and includes numerous hard consonants and sibilants.",
      },
    ],
  },
  {
    name: "gnome",
    size: "small",
    speed: 25,
    abilityScoreModifiers: { intelligence: 2 },
    traits: [
      {
        name: "Darkvision",
        description:
          "Accustomed to life underground, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
      },
      {
        name: "Gnome Cunning",
        description:
          "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.",
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and Gnomish. The Gnomish language, which uses the Dwarvish script, is renowned for its technical treatises and its catalogs of knowledge about the natural world.",
      },
    ],
    lineages: [
      {
        name: "forest gnome",
        abilityScoreModifiers: { dexterity: 1 },
        traits: [
          {
            name: "Natural Illusionist",
            description:
              "You know the minor illusion cantrip. Intelligence is your spellcasting ability for it.",
          },
          {
            name: "Speak with Small Beasts",
            description:
              "Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts. Forest gnomes love animals and often keep squirrels, badgers, rabbits, moles, woodpeckers, and other creatures as beloved pets.",
          },
        ],
      },
      {
        name: "rock gnome",
        abilityScoreModifiers: { constitution: 1 },
        traits: [
          {
            name: "Artificer's Lore",
            description:
              "Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus, instead of any proficiency bonus you normally apply.",
          },
          {
            name: "Tinker",
            description:
              "You have proficiency with artisan's tools (tinker's tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device (AC 5, 1 hp). The device ceases to function after 24 hours (unless you spend 1 hour repairing it to keep the device functioning), or when you use your action to dismantle it; at that time, you can reclaim the materials used to create it. You can have up to three such devices active at a time.",
          },
        ],
      },
      {
        name: "deep gnome",
        abilityScoreModifiers: { dexterity: 1 },
        traits: [
          {
            name: "Superior Darkvision",
            description: "Your darkvision has a radius of 120 feet.",
          },
          {
            name: "Stone Camouflage",
            description:
              "You have advantage on Dexterity (Stealth) checks to hide in rocky terrain.",
          },
        ],
      },
    ],
  },
  {
    name: "half-elf",
    size: "medium",
    speed: 30,
    abilityScoreModifiers: {
      charisma: 2,
      // plus two ability scores of choice
    },
    traits: [
      {
        name: "Darkvision",
        description:
          "Thanks to your elf blood, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
      },
      {
        name: "Fey Ancestry",
        description:
          "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
      },
      {
        name: "Skill Versatility",
        description: "You gain proficiency in two skills of your choice.",
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common, Elvish, and one extra language of your choice.",
      },
    ],
  },
  {
    name: "half-orc",
    size: "medium",
    speed: 30,
    abilityScoreModifiers: { strength: 2, constitution: 1 },
    traits: [
      {
        name: "Darkvision",
        description:
          "Thanks to your orc blood, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
      },
      {
        name: "Menacing",
        description: "You gain proficiency in the Intimidation skill.",
      },
      {
        name: "Relentless Endurance",
        description:
          "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can't use this feature again until you finish a long rest.",
      },
      {
        name: "Savage Attacks",
        description:
          "When you score a critical hit with a melee weapon attack, you can roll one of the weapon's damage dice one additional time and add it to the extra damage of the critical hit.",
      },
      {
        name: "Languages",
        description:
          "You can speak, read, and write Common and Orc. Orc is a harsh, grating language with hard consonants. It has no script of its own but is written in the Dwarvish script.",
      },
    ],
  },
  {
    name: "tiefling",
    size: "medium",
    speed: 30,
    abilityScoreModifiers: { charisma: 2, intelligence: 1 },
    traits: [
      {
        name: "Darkvision",
        description:
          "Thanks to your infernal heritage, you have superior vision in dark and dim conditions. You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can't discern color in darkness, only shades of gray.",
      },
      {
        name: "Hellish Resistance",
        description: "You have resistance to fire damage.",
      },
      {
        name: "Infernal Legacy",
        description:
          "You know the thaumaturgy cantrip. When you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once with this trait and regain the ability to do so when you finish a long rest. When you reach 5th level, you can cast the darkness spell once with this trait and regain the ability to do so when you finish a long rest. Charisma is your spellcasting ability for these spells.",
        level: 1,
      },
      {
        name: "Languages",
        description: "You can speak, read, and write Common and Infernal.",
      },
    ],
  },
] as const

const Backgrounds: Record<string, Background> = {
  acolyte: {
    name: "acolyte",
    skillProficiencies: ["insight", "religion"],
    additionalLanguages: 2,
    equipment: [
      "holy symbol",
      "prayer book or prayer wheel",
      "5 sticks of incense",
      "vestments",
      "common clothes",
      "15 gp",
    ],
    traits: [
      {
        name: "Shelter of the Faithful",
        description:
          "As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle. You might also have ties to a specific temple dedicated to your chosen deity or pantheon, and you have a residence there. This could be the temple where you used to serve, if you remain on good terms with it, or a temple where you have found a new home. While near your temple, you can call upon the priests for assistance, provided the assistance you ask for is not hazardous and you remain in good standing with your temple.",
      },
    ],
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
    traits: [
      {
        name: "False Identity",
        description:
          "You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona. Additionally, you can forge documents including official papers and personal letters, as long as you have seen an example of the kind of document or the handwriting you are trying to copy.",
      },
    ],
  },
  criminal: {
    name: "criminal",
    skillProficiencies: ["deception", "stealth"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }, "thieves' tools"],
    equipment: ["crowbar", "dark common clothes with hood", "15 gp"],
    traits: [
      {
        name: "Criminal Contact",
        description:
          "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you.",
      },
    ],
  },
  entertainer: {
    name: "entertainer",
    skillProficiencies: ["acrobatics", "performance"],
    toolProficiencies: [
      {
        choose: 1,
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
      "disguise kit",
    ],
    equipment: [
      "musical instrument (one of your choice)",
      "favor of an admirer",
      "costume",
      "15 gp",
    ],
    traits: [
      {
        name: "By Popular Demand",
        description:
          "You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble's court. At such a place, you receive free lodging and food of a modest or comfortable standard (depending on the quality of the establishment), as long as you perform each night. In addition, your performance makes you something of a local figure. When strangers recognize you in a town where you have performed, they typically take a liking to you.",
      },
    ],
  },
  "folk hero": {
    name: "folk hero",
    skillProficiencies: ["animal handling", "survival"],
    toolProficiencies: [
      {
        choose: 1,
        from: [
          "alchemist's supplies",
          "brewer's supplies",
          "calligrapher's supplies",
          "carpenter's tools",
          "cartographer's tools",
          "cobbler's tools",
          "cook's utensils",
          "glassblower's tools",
          "jeweler's tools",
          "leatherworker's tools",
          "mason's tools",
          "painter's supplies",
          "potter's tools",
          "smith's tools",
          "tinker's tools",
          "weaver's tools",
          "woodcarver's tools",
        ],
      },
      "vehicles (land)",
    ],
    equipment: [
      "artisan's tools (one of your choice)",
      "shovel",
      "iron pot",
      "common clothes",
      "10 gp",
    ],
    traits: [
      {
        name: "Rustic Hospitality",
        description:
          "Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you.",
      },
    ],
  },
  "guild artisan": {
    name: "guild artisan",
    skillProficiencies: ["insight", "persuasion"],
    toolProficiencies: [
      {
        choose: 1,
        from: [
          "alchemist's supplies",
          "brewer's supplies",
          "calligrapher's supplies",
          "carpenter's tools",
          "cartographer's tools",
          "cobbler's tools",
          "cook's utensils",
          "glassblower's tools",
          "jeweler's tools",
          "leatherworker's tools",
          "mason's tools",
          "painter's supplies",
          "potter's tools",
          "smith's tools",
          "tinker's tools",
          "weaver's tools",
          "woodcarver's tools",
        ],
      },
    ],
    additionalLanguages: 1,
    equipment: [
      "artisan's tools (one of your choice)",
      "letter of introduction from your guild",
      "traveler's clothes",
      "15 gp",
    ],
    traits: [
      {
        name: "Guild Membership",
        description:
          "As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a guildhall offers a central place to meet other members of your profession, which can be a good place to meet potential patrons, allies, or hirelings. Guilds often wield tremendous political power. If you are accused of a crime, your guild will support you if a good case can be made for your innocence or the crime is justifiable. You can also gain access to powerful political figures through the guild, if you are a member in good standing. Such connections might require the donation of money or magic items to the guild's coffers. You must pay dues of 5 gp per month to the guild. If you miss payments, you must make up back dues to remain in the guild's good graces.",
      },
    ],
  },
  hermit: {
    name: "hermit",
    skillProficiencies: ["medicine", "religion"],
    toolProficiencies: ["herbalism kit"],
    additionalLanguages: 1,
    equipment: [
      "scroll case of notes",
      "winter blanket",
      "common clothes",
      "herbalism kit",
      "5 gp",
    ],
    traits: [
      {
        name: "Discovery",
        description:
          "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. It might be a great truth about the cosmos, the deities, the powerful beings of the outer planes, or the forces of nature. It could be a site that no one else has ever seen. You might have uncovered a fact that has long been forgotten, or unearthed some relic of the past that could rewrite history. It might be information that would be damaging to the people who or consigned you to exile, and hence the reason for your return to society. Work with your DM to determine the details of your discovery and its impact on the campaign.",
      },
    ],
  },
  noble: {
    name: "noble",
    skillProficiencies: ["history", "persuasion"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }],
    additionalLanguages: 1,
    equipment: ["fine clothes", "signet ring", "scroll of pedigree", "25 gp"],
    traits: [
      {
        name: "Position of Privilege",
        description:
          "Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure, and other people of high birth treat you as a member of the same social sphere. You can secure an audience with a local noble if you need to.",
      },
    ],
  },
  outlander: {
    name: "outlander",
    skillProficiencies: ["athletics", "survival"],
    toolProficiencies: [
      {
        choose: 1,
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
    additionalLanguages: 1,
    equipment: ["staff", "hunting trap", "trophy from an animal", "traveler's clothes", "10 gp"],
    traits: [
      {
        name: "Wanderer",
        description:
          "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day, provided that the land offers berries, small game, water, and so forth.",
      },
    ],
  },
  sage: {
    name: "sage",
    skillProficiencies: ["arcana", "history"],
    additionalLanguages: 2,
    equipment: [
      "bottle of black ink",
      "quill",
      "small knife",
      "letter from a dead colleague with a question you haven't answered",
      "common clothes",
      "10 gp",
    ],
    traits: [
      {
        name: "Researcher",
        description:
          "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature. Your DM might rule that the knowledge you seek is secreted away in an almost inaccessible place, or that it simply cannot be found. Unearthing the deepest secrets of the multiverse can require an adventure or even a whole campaign.",
      },
    ],
  },
  sailor: {
    name: "sailor",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator's tools", "vehicles (water)"],
    equipment: [
      "belaying pin (club)",
      "50 feet of silk rope",
      "lucky charm",
      "common clothes",
      "10 gp",
    ],
    traits: [
      {
        name: "Ship's Passage",
        description:
          "When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions. You might sail on the ship you served on, or another ship you have good relations with (perhaps one captained by a former crewmate). Because you're calling in a favor, you can't be certain of a schedule or route that will meet your every need. Your Dungeon Master will determine how long it takes to get where you need to go. In return for your free passage, you and your companions are expected to assist the crew during the voyage.",
      },
    ],
  },
  pirate: {
    name: "pirate",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator's tools", "vehicles (water)"],
    equipment: [
      "belaying pin (club)",
      "50 feet of silk rope",
      "lucky charm",
      "common clothes",
      "10 gp",
    ],
    traits: [
      {
        name: "Bad Reputation",
        description:
          "No matter where you go, people are afraid of you due to your reputation. When you are in a civilized settlement, you can get away with minor criminal offenses, such as refusing to pay for food at a tavern or breaking down doors at a local shop, since most people will not report your activity to the authorities.",
      },
    ],
  },
  soldier: {
    name: "soldier",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }, "vehicles (land)"],
    equipment: [
      "insignia of rank",
      "trophy from a fallen enemy",
      "bone dice or deck of cards",
      "common clothes",
      "10 gp",
    ],
    traits: [
      {
        name: "Military Rank",
        description:
          "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you when you are in positions of authority. You can invoke your rank to exert influence over other soldiers and requisition simple equipment or horses for temporary use. You can also usually gain access to friendly military encampments and fortresses where your rank is recognized.",
      },
    ],
  },
  urchin: {
    name: "urchin",
    skillProficiencies: ["sleight of hand", "stealth"],
    toolProficiencies: ["disguise kit", "thieves' tools"],
    equipment: [
      "small knife",
      "map of city you grew up in",
      "pet mouse",
      "token to remember parents",
      "common clothes",
      "10 gp",
    ],
    traits: [
      {
        name: "City Secrets",
        description:
          "You know the secret patterns and flow of cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed would normally allow.",
      },
    ],
  },
} as const

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
    traits: [
      {
        name: "Rage",
        description:
          "You can enter a rage as a bonus action. While raging, you gain advantage on Strength checks and saves, bonus damage to melee weapon attacks using Strength, and resistance to bludgeoning, piercing, and slashing damage.",
        level: 1,
      },
      {
        name: "Unarmored Defense",
        description:
          "While not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.",
        level: 1,
      },
      {
        name: "Reckless Attack",
        description:
          "When you make your first attack on your turn, you can attack recklessly. Doing so gives you advantage on melee weapon attack rolls using Strength during this turn, but attack rolls against you have advantage until your next turn.",
        level: 2,
      },
      {
        name: "Danger Sense",
        description:
          "You have advantage on Dexterity saving throws against effects that you can see, such as traps and spells, while you aren't blinded, deafened, or incapacitated.",
        level: 2,
      },
      {
        name: "Extra Attack",
        description:
          "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "Fast Movement",
        description: "Your speed increases by 10 feet while you aren't wearing heavy armor.",
        level: 5,
      },
      {
        name: "Feral Instinct",
        description:
          "You have advantage on initiative rolls. Additionally, if you are surprised at the beginning of combat and aren't incapacitated, you can act normally on your first turn if you enter your rage before doing anything else.",
        level: 7,
      },
      {
        name: "Brutal Critical",
        description:
          "You can roll one additional weapon damage die when determining the extra damage for a critical hit with a melee attack. This increases to two additional dice at 13th level and three at 17th level.",
        level: 9,
      },
      {
        name: "Relentless Rage",
        description:
          "If you drop to 0 hit points while raging and don't die outright, you can make a DC 10 Constitution saving throw to drop to 1 hit point instead. The DC increases by 5 for each subsequent use, resetting after a rest.",
        level: 11,
      },
      {
        name: "Persistent Rage",
        description:
          "Your rage ends early only if you fall unconscious or if you choose to end it.",
        level: 15,
      },
      {
        name: "Indomitable Might",
        description:
          "If your total for a Strength check is less than your Strength score, you can use that score in place of the total.",
        level: 18,
      },
      {
        name: "Primal Champion",
        description:
          "Your Strength and Constitution scores increase by 4, and your maximum for those scores is now 24.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "path of the berserker",
        description:
          "Barbarians who walk the Path of the Berserker channel their rage into untrammeled fury, thrilling in the chaos of battle and reveling in violence without concern for their own well-being.",
        traits: [
          {
            name: "Frenzy",
            description:
              "You can go into a frenzy when you rage. If you do so, for the duration of your rage you can make a single melee weapon attack as a bonus action on each of your turns. When your rage ends, you suffer one level of exhaustion.",
            level: 3,
          },
          {
            name: "Mindless Rage",
            description:
              "You can't be charmed or frightened while raging. If you are charmed or frightened when you enter your rage, the effect is suspended for the duration of the rage.",
            level: 6,
          },
          {
            name: "Intimidating Presence",
            description:
              "You can use your action to frighten a creature within 30 feet that can see or hear you. The creature must make a Wisdom saving throw (DC 8 + proficiency + Charisma modifier) or be frightened until the end of your next turn. You can extend the duration with subsequent actions.",
            level: 10,
          },
          {
            name: "Retaliation",
            description:
              "When you take damage from a creature that is within 5 feet of you, you can use your reaction to make a melee weapon attack against that creature.",
            level: 14,
          },
        ],
      },
      {
        name: "path of the totem warrior",
        description:
          "Barbarians who follow the Path of the Totem Warrior accept a spirit animal as guide, protector, and inspiration, gaining supernatural might from the natural world and the animal spirits that inhabit it.",
        traits: [
          {
            name: "Spirit Seeker",
            description:
              "You gain the ability to cast the beast sense and speak with animals spells as rituals.",
            level: 3,
          },
          {
            name: "Totem Spirit",
            description:
              "You choose a totem spirit (bear, eagle, or wolf) and gain its benefit while raging. Bear grants resistance to all damage except psychic. Eagle grants enemies disadvantage on opportunity attacks, and you can use Dash as a bonus action. Wolf grants allies advantage on melee attacks against enemies within 5 feet of you.",
            level: 3,
          },
          {
            name: "Aspect of the Beast",
            description:
              "You gain a benefit from your totem animal. Bear lets you carry twice as much. Eagle grants enhanced vision and dim light doesn't impose disadvantage on Perception checks. Wolf allows tracking at fast pace and stealthily at normal pace.",
            level: 6,
          },
          {
            name: "Spirit Walker",
            description: "You can cast the commune with nature spell as a ritual.",
            level: 10,
          },
          {
            name: "Totemic Attunement",
            description:
              "You gain additional benefits from your totem. Bear causes enemies within 5 feet to have disadvantage on attacks against targets other than you. Eagle grants a flying speed while raging. Wolf grants the ability to use a bonus action to knock Large or smaller creatures prone when you hit them with a melee attack.",
            level: 14,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Spellcasting",
        description:
          "You can cast bard spells using Charisma as your spellcasting ability. You know a number of cantrips and spells as shown in the Bard table.",
        level: 1,
      },
      {
        name: "Bardic Inspiration",
        description:
          "You can inspire others through stirring words or music. As a bonus action, grant one creature within 60 feet an inspiration die (d6, increasing to d8 at 5th level, d10 at 10th level, and d12 at 15th level) that they can add to one ability check, attack roll, or saving throw within the next 10 minutes.",
        level: 1,
      },
      {
        name: "Jack of All Trades",
        description:
          "You can add half your proficiency bonus, rounded down, to any ability check you make that doesn't already include your proficiency bonus.",
        level: 2,
      },
      {
        name: "Song of Rest",
        description:
          "You can use soothing music or oration during a short rest to help allies recover. Any ally who regains hit points at the end of the short rest gains extra hit points (d6 at 2nd level, d8 at 9th, d10 at 13th, d12 at 17th).",
        level: 2,
      },
      {
        name: "Expertise",
        description:
          "Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies. At 10th level, you can choose two more skills to gain this benefit.",
        level: 3,
      },
      {
        name: "Font of Inspiration",
        description:
          "You regain all of your expended uses of Bardic Inspiration when you finish a short or long rest.",
        level: 5,
      },
      {
        name: "Countercharm",
        description:
          "You can use your action to start a performance that lasts until the end of your next turn. During that time, you and any friendly creatures within 30 feet have advantage on saving throws against being frightened or charmed.",
        level: 6,
      },
      {
        name: "Magical Secrets",
        description:
          "You learn two spells of your choice from any class. These spells count as bard spells for you. You learn two additional spells at 14th level and two more at 18th level.",
        level: 10,
      },
      {
        name: "Superior Inspiration",
        description:
          "When you roll initiative and have no uses of Bardic Inspiration left, you regain one use.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "college of lore",
        description:
          "Bards of the College of Lore gather knowledge from sources as diverse as scholarly tomes and peasant tales. They use their knowledge and magic to uncover secrets and confound foes.",
        traits: [
          {
            name: "Bonus Proficiencies",
            description: "You gain proficiency with three skills of your choice.",
            level: 3,
          },
          {
            name: "Cutting Words",
            description:
              "You can use your reaction to expend a Bardic Inspiration die and reduce a creature's attack roll, ability check, or damage roll by the number rolled. You must be able to see the creature within 60 feet.",
            level: 3,
          },
          {
            name: "Additional Magical Secrets",
            description:
              "You learn two spells of your choice from any class. These spells must be of a level you can cast and count as bard spells for you.",
            level: 6,
          },
          {
            name: "Peerless Skill",
            description:
              "When you make an ability check, you can expend one use of Bardic Inspiration to add the die to your ability check. You can choose to use this after you roll but before the DM tells you whether you succeed or fail.",
            level: 14,
          },
        ],
      },
      {
        name: "college of valor",
        description:
          "Bards of the College of Valor are daring skalds whose tales keep alive the memory of great heroes. They gather in mead halls to sing the deeds of the mighty, inspiring the next generation of heroes.",
        traits: [
          {
            name: "Bonus Proficiencies",
            description: "You gain proficiency with medium armor, shields, and martial weapons.",
            level: 3,
          },
          {
            name: "Combat Inspiration",
            description:
              "A creature that has a Bardic Inspiration die from you can roll that die and add the number rolled to a weapon damage roll it just made, or it can use its reaction to roll the die and add it to its AC against one attack.",
            level: 3,
          },
          {
            name: "Extra Attack",
            description:
              "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
            level: 6,
          },
          {
            name: "Battle Magic",
            description:
              "When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.",
            level: 14,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Spellcasting",
        description:
          "You can cast cleric spells using Wisdom as your spellcasting ability. You prepare spells from the cleric spell list, and you can change your prepared spells after a long rest.",
        level: 1,
      },
      {
        name: "Divine Domain",
        description:
          "You choose a domain related to your deity, which grants you domain spells and other features at 1st, 2nd, 6th, 8th, and 17th levels.",
        level: 1,
      },
      {
        name: "Channel Divinity",
        description:
          "You gain the ability to channel divine energy directly from your deity to fuel magical effects. You start with two effects: Turn Undead and an effect determined by your domain. You can use this feature once, regaining uses after a short or long rest (twice at 6th level, three times at 18th level).",
        level: 2,
      },
      {
        name: "Destroy Undead",
        description:
          "When an undead fails its saving throw against your Turn Undead feature, it is instantly destroyed if its challenge rating is at or below a certain threshold (CR 1/2 at 5th level, increasing at higher levels).",
        level: 5,
      },
      {
        name: "Divine Intervention",
        description:
          "You can call on your deity to intervene on your behalf when your need is great. You roll percentile dice - if you roll a number equal to or lower than your cleric level, your deity intervenes. If successful, you can't use this feature again for 7 days; otherwise, you can use it again after a long rest. At 20th level, it automatically succeeds.",
        level: 10,
      },
    ],
    subclasses: [
      {
        name: "knowledge",
        description:
          "The gods of knowledge value learning and understanding. Their clerics pursue scholarship and insight, seeking to preserve lore and uncover hidden truths through divine wisdom.",
        traits: [
          {
            name: "Blessings of Knowledge",
            description:
              "You learn two languages and gain proficiency in two skills from Arcana, History, Nature, or Religion. Your proficiency bonus is doubled for ability checks using these skills.",
            level: 1,
          },
          {
            name: "Channel Divinity: Knowledge of the Ages",
            description:
              "You can use your Channel Divinity to tap into a divine well of knowledge. As an action, choose one skill or tool. For 10 minutes, you have proficiency with the chosen skill or tool.",
            level: 2,
          },
          {
            name: "Channel Divinity: Read Thoughts",
            description:
              "You can use your Channel Divinity to read a creature's thoughts. Choose one creature within 60 feet. It must make a Wisdom saving throw or you can read its surface thoughts and have advantage on checks to influence it for 1 minute.",
            level: 6,
          },
          {
            name: "Potent Spellcasting",
            description:
              "You add your Wisdom modifier to the damage you deal with any cleric cantrip.",
            level: 8,
          },
          {
            name: "Visions of the Past",
            description:
              "You can call up visions of the past related to an object you hold or your immediate surroundings, gaining insights into recent or historical events.",
            level: 17,
          },
        ],
      },
      {
        name: "life",
        description:
          "The gods of life promote vitality and health. Their clerics are masters of healing, protecting their allies and granting life in abundance through the divine power that flows through them.",
        traits: [
          {
            name: "Bonus Proficiency",
            description: "You gain proficiency with heavy armor.",
            level: 1,
          },
          {
            name: "Disciple of Life",
            description:
              "Your healing spells are more effective. Whenever you use a spell of 1st level or higher to restore hit points to a creature, the creature regains additional hit points equal to 2 + the spell's level.",
            level: 1,
          },
          {
            name: "Channel Divinity: Preserve Life",
            description:
              "You can use your Channel Divinity to heal the badly injured. As an action, restore hit points equal to five times your cleric level, dividing them among creatures within 30 feet (up to half their maximum).",
            level: 2,
          },
          {
            name: "Blessed Healer",
            description:
              "When you cast a spell that restores hit points to another creature, you regain hit points equal to 2 + the spell's level.",
            level: 6,
          },
          {
            name: "Divine Strike",
            description:
              "You gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns, you can deal an extra 1d8 radiant damage to a creature you hit with a weapon attack (2d8 at 14th level).",
            level: 8,
          },
          {
            name: "Supreme Healing",
            description:
              "When you would normally roll one or more dice to restore hit points with a spell, you instead use the highest number possible for each die.",
            level: 17,
          },
        ],
      },
      {
        name: "light",
        description:
          "Gods of light promote ideals of rebirth and renewal, truth, and beauty. Their clerics wield radiant fire to scour away darkness and illuminate hidden truths.",
        traits: [
          {
            name: "Bonus Cantrip",
            description: "You gain the light cantrip if you don't already know it.",
            level: 1,
          },
          {
            name: "Warding Flare",
            description:
              "When you are attacked by a creature within 30 feet that you can see, you can use your reaction to impose disadvantage on the attack roll, causing light to flare before the attacker. You can use this a number of times equal to your Wisdom modifier (minimum of once) per long rest.",
            level: 1,
          },
          {
            name: "Channel Divinity: Radiance of the Dawn",
            description:
              "You can use your Channel Divinity to harness sunlight. As an action, magical darkness within 30 feet is dispelled, and each hostile creature within 30 feet must make a Constitution saving throw or take 2d10 + your cleric level radiant damage (half on success).",
            level: 2,
          },
          {
            name: "Improved Flare",
            description:
              "You can also use your Warding Flare feature when a creature you can see within 30 feet attacks a creature other than you.",
            level: 6,
          },
          {
            name: "Potent Spellcasting",
            description:
              "You add your Wisdom modifier to the damage you deal with any cleric cantrip.",
            level: 8,
          },
          {
            name: "Corona of Light",
            description:
              "You can use your action to activate an aura of sunlight that lasts for 1 minute. You emit bright light in a 60-foot radius, and enemies in the light have disadvantage on saving throws against any spell that deals fire or radiant damage.",
            level: 17,
          },
        ],
      },
      {
        name: "nature",
        description:
          "Gods of nature embody the forces of the natural world. Their clerics might be druids in all but name, channeling the primal power of storms, beasts, and growing things.",
        traits: [
          {
            name: "Acolyte of Nature",
            description:
              "You learn one druid cantrip and gain proficiency in one skill from Animal Handling, Nature, or Survival.",
            level: 1,
          },
          {
            name: "Bonus Proficiency",
            description: "You gain proficiency with heavy armor.",
            level: 1,
          },
          {
            name: "Channel Divinity: Charm Animals and Plants",
            description:
              "You can use your Channel Divinity to charm animals and plants. As an action, each beast or plant creature within 30 feet that can see you must make a Wisdom saving throw or be charmed by you for 1 minute or until it takes damage.",
            level: 2,
          },
          {
            name: "Dampen Elements",
            description:
              "When you or a creature within 30 feet takes acid, cold, fire, lightning, or thunder damage, you can use your reaction to grant resistance to that damage.",
            level: 6,
          },
          {
            name: "Divine Strike",
            description:
              "You gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns, you can deal an extra 1d8 cold, fire, or lightning damage to a creature you hit with a weapon attack (2d8 at 14th level).",
            level: 8,
          },
          {
            name: "Master of Nature",
            description:
              "You gain the ability to command animals and plant creatures. When creatures are charmed by your Charm Animals and Plants feature, you can use a bonus action to verbally command what each will do on its next turn.",
            level: 17,
          },
        ],
      },
      {
        name: "tempest",
        description:
          "Gods of the tempest send their clerics to inspire fear in the common folk through displays of divine wrath. They wield the power of storm and sea, commanding thunder and lightning.",
        traits: [
          {
            name: "Bonus Proficiencies",
            description: "You gain proficiency with martial weapons and heavy armor.",
            level: 1,
          },
          {
            name: "Wrath of the Storm",
            description:
              "When a creature within 5 feet that you can see hits you with an attack, you can use your reaction to cause them to make a Dexterity saving throw or take 2d8 lightning or thunder damage (half on success). You can use this a number of times equal to your Wisdom modifier per long rest.",
            level: 1,
          },
          {
            name: "Channel Divinity: Destructive Wrath",
            description:
              "You can use your Channel Divinity to deal maximum damage with lightning or thunder damage instead of rolling.",
            level: 2,
          },
          {
            name: "Thunderbolt Strike",
            description:
              "When you deal lightning damage to a Large or smaller creature, you can also push it up to 10 feet away from you.",
            level: 6,
          },
          {
            name: "Divine Strike",
            description:
              "You gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns, you can deal an extra 1d8 thunder damage to a creature you hit with a weapon attack (2d8 at 14th level).",
            level: 8,
          },
          {
            name: "Stormborn",
            description:
              "You have a flying speed equal to your current walking speed whenever you are not underground or indoors.",
            level: 17,
          },
        ],
      },
      {
        name: "trickery",
        description:
          "Gods of trickery are mischief-makers and instigators. Their clerics are a disruptive force in the world, using illusions and deception to tilt circumstances in their favor.",
        traits: [
          {
            name: "Blessing of the Trickster",
            description:
              "You can use your action to touch a willing creature other than yourself to give it advantage on Dexterity (Stealth) checks. This blessing lasts for 1 hour or until you use it again.",
            level: 1,
          },
          {
            name: "Channel Divinity: Invoke Duplicity",
            description:
              "You can use your Channel Divinity to create an illusory duplicate of yourself that lasts for 1 minute. As a bonus action, you can move it up to 30 feet. You can cast spells as though you were in its space, and you have advantage on attack rolls against creatures within 5 feet of it.",
            level: 2,
          },
          {
            name: "Channel Divinity: Cloak of Shadows",
            description:
              "You can use your Channel Divinity to become invisible until the end of your next turn or until you attack or cast a spell.",
            level: 6,
          },
          {
            name: "Divine Strike",
            description:
              "You gain the ability to infuse your weapon strikes with poison. Once on each of your turns, you can deal an extra 1d8 poison damage to a creature you hit with a weapon attack (2d8 at 14th level).",
            level: 8,
          },
          {
            name: "Improved Duplicity",
            description:
              "You can create up to four duplicates of yourself when you use Invoke Duplicity, instead of one, and you can move any number of them as part of the same bonus action.",
            level: 17,
          },
        ],
      },
      {
        name: "war",
        description:
          "War gods watch over warriors and reward them with acts of bravery. Their clerics excel in battle, inspiring others to fight and using divine magic to bolster their martial prowess.",
        traits: [
          {
            name: "Bonus Proficiencies",
            description: "You gain proficiency with martial weapons and heavy armor.",
            level: 1,
          },
          {
            name: "War Priest",
            description:
              "When you use the Attack action, you can make one weapon attack as a bonus action. You can use this feature a number of times equal to your Wisdom modifier (minimum of once) per long rest.",
            level: 1,
          },
          {
            name: "Channel Divinity: Guided Strike",
            description:
              "You can use your Channel Divinity to strike with supernatural accuracy. When you make an attack roll, you can use Channel Divinity to gain a +10 bonus to the roll. You make this choice after seeing the roll but before the DM says whether it hits or misses.",
            level: 2,
          },
          {
            name: "Channel Divinity: War God's Blessing",
            description:
              "When a creature within 30 feet makes an attack roll, you can use your reaction to grant that creature a +10 bonus to the roll using your Channel Divinity. You make this choice after seeing the roll but before knowing if it hits.",
            level: 6,
          },
          {
            name: "Divine Strike",
            description:
              "You gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns, you can deal an extra 1d8 damage of the weapon's type to a creature you hit with a weapon attack (2d8 at 14th level).",
            level: 8,
          },
          {
            name: "Avatar of Battle",
            description:
              "You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.",
            level: 17,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Druidic",
        description:
          "You know Druidic, the secret language of druids. You can speak it and use it to leave hidden messages. You and others who know this language automatically spot such messages.",
        level: 1,
      },
      {
        name: "Spellcasting",
        description:
          "You can cast druid spells using Wisdom as your spellcasting ability. You prepare spells from the druid spell list, and you can change your prepared spells after a long rest.",
        level: 1,
      },
      {
        name: "Wild Shape",
        description:
          "You can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice, regaining expended uses after a short or long rest. At 2nd level you can transform into beasts with CR 1/4 (no swimming or flying speed), improving at higher levels.",
        level: 2,
      },
      {
        name: "Timeless Body",
        description:
          "The primal magic that you wield causes you to age more slowly. For every 10 years that pass, your body ages only 1 year.",
        level: 18,
      },
      {
        name: "Beast Spells",
        description:
          "You can cast many of your druid spells in any shape you assume using Wild Shape. You can perform the somatic and verbal components while in beast form.",
        level: 18,
      },
      {
        name: "Archdruid",
        description:
          "You can use your Wild Shape an unlimited number of times. Additionally, you can ignore the verbal and somatic components of your druid spells, as well as any material components that lack a cost and aren't consumed by a spell.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "circle of the land",
        description:
          "The Circle of the Land is made up of mystics and sages who safeguard ancient knowledge and rites. These druids draw their spells from the land itself, channeling the magic of specific terrains.",
        traits: [
          {
            name: "Bonus Cantrip",
            description: "You learn one additional druid cantrip of your choice.",
            level: 2,
          },
          {
            name: "Natural Recovery",
            description:
              "During a short rest, you can recover some of your magical energy. Once per day, you can choose expended spell slots to recover. The spell slots can have a combined level equal to or less than half your druid level (rounded up), and none can be 6th level or higher.",
            level: 2,
          },
          {
            name: "Land's Stride",
            description:
              "Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed by them and without taking damage from them if they have thorns, spines, or a similar hazard. You have advantage on saves against plants that are magically created or manipulated.",
            level: 6,
          },
          {
            name: "Nature's Ward",
            description:
              "You can't be charmed or frightened by elementals or fey, and you are immune to poison and disease.",
            level: 10,
          },
          {
            name: "Nature's Sanctuary",
            description:
              "When a beast or plant creature attacks you, it must make a Wisdom saving throw against your druid spell save DC. On a failed save, the creature must choose a different target, or the attack automatically misses.",
            level: 14,
          },
        ],
      },
      {
        name: "circle of the moon",
        description:
          "Druids of the Circle of the Moon are fierce guardians of the wilds. They haunt the deepest parts of nature, where they might go for weeks before crossing paths with another humanoid. Changeable as the moon, they can adopt powerful beast forms.",
        traits: [
          {
            name: "Combat Wild Shape",
            description:
              "You can use Wild Shape as a bonus action on your turn. Additionally, while transformed by Wild Shape, you can use a bonus action to expend one spell slot to regain 1d8 hit points per level of the spell slot expended.",
            level: 2,
          },
          {
            name: "Circle Forms",
            description:
              "The rites of your circle grant you the ability to transform into more dangerous animal forms. You can transform into a beast with a challenge rating as high as 1 (ignoring the Max CR column). At 6th level, you can transform into a beast with CR as high as your druid level divided by 3, rounded down.",
            level: 2,
          },
          {
            name: "Primal Strike",
            description:
              "Your attacks in beast form count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.",
            level: 6,
          },
          {
            name: "Elemental Wild Shape",
            description:
              "You can expend two uses of Wild Shape at the same time to transform into an air elemental, an earth elemental, a fire elemental, or a water elemental.",
            level: 10,
          },
          {
            name: "Thousand Forms",
            description:
              "You have learned to use magic to alter your physical form in more subtle ways. You can cast the alter self spell at will.",
            level: 14,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Fighting Style",
        description:
          "You adopt a particular style of fighting as your specialty. Choose a fighting style: Archery, Defense, Dueling, Great Weapon Fighting, Protection, or Two-Weapon Fighting.",
        level: 1,
      },
      {
        name: "Second Wind",
        description:
          "You can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.",
        level: 1,
      },
      {
        name: "Action Surge",
        description:
          "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again. Starting at 17th level, you can use it twice before a rest.",
        level: 2,
      },
      {
        name: "Extra Attack",
        description:
          "You can attack twice, instead of once, whenever you take the Attack action on your turn. The number of attacks increases to three at 11th level and to four at 20th level.",
        level: 5,
      },
      {
        name: "Indomitable",
        description:
          "You can reroll a saving throw that you fail. If you do so, you must use the new roll. Once you use this feature, you can't use it again until you finish a long rest. You can use this feature twice at 13th level and three times at 17th level.",
        level: 9,
      },
    ],
    subclasses: [
      {
        name: "champion",
        description:
          "The archetypal Champion focuses on developing raw physical power honed to deadly perfection. Those who model themselves on this archetype combine rigorous training with physical excellence.",
        traits: [
          {
            name: "Improved Critical",
            description: "Your weapon attacks score a critical hit on a roll of 19 or 20.",
            level: 3,
          },
          {
            name: "Remarkable Athlete",
            description:
              "You can add half your proficiency bonus (rounded up) to any Strength, Dexterity, or Constitution check you make that doesn't already use your proficiency bonus. Additionally, when you make a running long jump, the distance you can cover increases by a number of feet equal to your Strength modifier.",
            level: 7,
          },
          {
            name: "Additional Fighting Style",
            description: "You can choose a second option from the Fighting Style class feature.",
            level: 10,
          },
          {
            name: "Superior Critical",
            description: "Your weapon attacks score a critical hit on a roll of 18-20.",
            level: 15,
          },
          {
            name: "Survivor",
            description:
              "At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half of your hit points left. You don't gain this benefit if you have 0 hit points.",
            level: 18,
          },
        ],
      },
      {
        name: "battle master",
        description:
          "Battle Masters employ martial techniques passed down through generations. They learn maneuvers that are fueled by special dice called superiority dice, using their tactical insight to turn the tide of battle.",
        traits: [
          {
            name: "Combat Superiority",
            description:
              "You learn three maneuvers of your choice and gain four superiority dice (d8s). You can expend a superiority die to fuel a maneuver. You regain all expended superiority dice after a short or long rest. You learn additional maneuvers at higher levels.",
            level: 3,
          },
          {
            name: "Student of War",
            description: "You gain proficiency with one type of artisan's tools of your choice.",
            level: 3,
          },
          {
            name: "Know Your Enemy",
            description:
              "If you spend at least 1 minute observing or interacting with another creature outside combat, you can learn certain information about its capabilities compared to yours (two characteristics: Strength, Dexterity, Constitution, AC, current HP, total class levels, or fighter class levels).",
            level: 7,
          },
          {
            name: "Improved Combat Superiority",
            description:
              "Your superiority dice turn into d10s. At 18th level, they turn into d12s.",
            level: 10,
          },
          {
            name: "Relentless",
            description:
              "When you roll initiative and have no superiority dice remaining, you regain one superiority die.",
            level: 15,
          },
        ],
      },
      {
        name: "eldritch knight",
        description:
          "Eldritch Knights combine martial mastery with magical study. They learn a number of wizard spells, focusing on abjuration and evocation to bolster their combat abilities with arcane power.",
        traits: [
          {
            name: "Spellcasting",
            description:
              "You learn to cast wizard spells. Intelligence is your spellcasting ability. You know a number of cantrips and spells as shown in the Fighter table (limited to abjuration and evocation schools primarily).",
            level: 3,
          },
          {
            name: "Weapon Bond",
            description:
              "You learn a ritual that creates a magical bond between yourself and one weapon. Once bonded, you can't be disarmed of that weapon unless you are incapacitated, and you can summon it as a bonus action if it's on the same plane.",
            level: 3,
          },
          {
            name: "War Magic",
            description:
              "When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.",
            level: 7,
          },
          {
            name: "Eldritch Strike",
            description:
              "When you hit a creature with a weapon attack, that creature has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.",
            level: 10,
          },
          {
            name: "Arcane Charge",
            description:
              "When you use your Action Surge, you can teleport up to 30 feet to an unoccupied space you can see. You can teleport before or after the additional action.",
            level: 15,
          },
          {
            name: "Improved War Magic",
            description:
              "When you use your action to cast a spell, you can make one weapon attack as a bonus action.",
            level: 18,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Unarmored Defense",
        description:
          "While wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.",
        level: 1,
      },
      {
        name: "Martial Arts",
        description:
          "Your practice of martial arts gives you mastery of unarmed strikes and monk weapons. You can use Dexterity instead of Strength for attack and damage rolls with unarmed strikes and monk weapons. You can roll a d4 (increasing at higher levels) in place of normal damage, and when you use the Attack action with unarmed strikes or monk weapons, you can make one unarmed strike as a bonus action.",
        level: 1,
      },
      {
        name: "Ki",
        description:
          "You gain access to mystical energy called ki. You have a number of ki points equal to your monk level. You can spend ki points to fuel various ki features. You regain all expended ki points after a short or long rest.",
        level: 2,
      },
      {
        name: "Unarmored Movement",
        description:
          "Your speed increases by 10 feet while you are not wearing armor or wielding a shield. This bonus increases at higher levels. At 9th level, you gain the ability to move along vertical surfaces and across liquids without falling.",
        level: 2,
      },
      {
        name: "Deflect Missiles",
        description:
          "You can use your reaction to deflect or catch a missile when you are hit by a ranged weapon attack. The damage is reduced by 1d10 + your Dexterity modifier + your monk level. If you reduce the damage to 0, you can catch the missile and spend 1 ki point to make a ranged attack with it as part of the same reaction.",
        level: 3,
      },
      {
        name: "Slow Fall",
        description:
          "You can use your reaction when you fall to reduce any falling damage you take by an amount equal to five times your monk level.",
        level: 4,
      },
      {
        name: "Extra Attack",
        description:
          "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "Stunning Strike",
        description:
          "When you hit another creature with a melee weapon attack, you can spend 1 ki point to attempt a stunning strike. The target must succeed on a Constitution saving throw or be stunned until the end of your next turn.",
        level: 5,
      },
      {
        name: "Ki-Empowered Strikes",
        description:
          "Your unarmed strikes count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.",
        level: 6,
      },
      {
        name: "Evasion",
        description:
          "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed, and only half damage if you fail.",
        level: 7,
      },
      {
        name: "Stillness of Mind",
        description:
          "You can use your action to end one effect on yourself that is causing you to be charmed or frightened.",
        level: 7,
      },
      {
        name: "Purity of Body",
        description: "You are immune to disease and poison.",
        level: 10,
      },
      {
        name: "Tongue of the Sun and Moon",
        description:
          "You learn to touch the ki of other minds so that you understand all spoken languages and any creature that can understand a language can understand what you say.",
        level: 13,
      },
      {
        name: "Diamond Soul",
        description:
          "Your mastery of ki grants you proficiency in all saving throws. Additionally, whenever you make a saving throw and fail, you can spend 1 ki point to reroll it and take the second result.",
        level: 14,
      },
      {
        name: "Timeless Body",
        description:
          "Your ki sustains you so that you suffer none of the frailty of old age, and you can't be aged magically. You still die of old age. Additionally, you no longer need food or water.",
        level: 15,
      },
      {
        name: "Empty Body",
        description:
          "You can spend 4 ki points to become invisible for 1 minute. During that time, you also have resistance to all damage except force damage. Additionally, you can spend 8 ki points to cast the astral projection spell without needing material components.",
        level: 18,
      },
      {
        name: "Perfect Self",
        description:
          "When you roll for initiative and have no ki points remaining, you regain 4 ki points.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "way of the open hand",
        description:
          "Monks of the Way of the Open Hand are the ultimate masters of martial arts combat. They learn techniques to push and trip their opponents, manipulate ki to heal damage, and practice advanced meditation.",
        traits: [
          {
            name: "Open Hand Technique",
            description:
              "When you hit a creature with one of the attacks granted by your Flurry of Blows, you can impose one of the following effects: it must make a Dexterity save or be knocked prone, it must make a Strength save or be pushed 15 feet, or it can't take reactions until the end of your next turn.",
            level: 3,
          },
          {
            name: "Wholeness of Body",
            description:
              "You can use an action to regain hit points equal to three times your monk level. You must finish a long rest before you can use this feature again.",
            level: 6,
          },
          {
            name: "Tranquility",
            description:
              "At the end of a long rest, you gain the effect of a sanctuary spell that lasts until the start of your next long rest (save DC equals 8 + your Wisdom modifier + your proficiency bonus).",
            level: 11,
          },
          {
            name: "Quivering Palm",
            description:
              "When you hit a creature with an unarmed strike, you can spend 3 ki points to start imperceptible vibrations. Within a number of days equal to your monk level, you can use your action to end the vibrations, forcing the creature to make a Constitution save. If it fails, it is reduced to 0 hit points. If it succeeds, it takes 10d10 necrotic damage.",
            level: 17,
          },
        ],
      },
      {
        name: "way of shadow",
        description:
          "Monks of the Way of Shadow follow a tradition that values stealth and subterfuge. These monks are called ninjas or shadowdancers, and they serve as spies and assassins, walking unseen through the darkness.",
        traits: [
          {
            name: "Shadow Arts",
            description:
              "You can use ki to duplicate the effects of certain spells. As an action, you can spend 2 ki points to cast darkness, darkvision, pass without trace, or silence without providing material components. Additionally, you gain the minor illusion cantrip.",
            level: 3,
          },
          {
            name: "Shadow Step",
            description:
              "You can step from one shadow into another. When you are in dim light or darkness, you can use a bonus action to teleport up to 60 feet to an unoccupied space you can see that is also in dim light or darkness. You then have advantage on the first melee attack you make before the end of the turn.",
            level: 6,
          },
          {
            name: "Cloak of Shadows",
            description:
              "You can use your action to become invisible in dim light or darkness. You remain invisible until you make an attack, cast a spell, or are in bright light.",
            level: 11,
          },
          {
            name: "Opportunist",
            description:
              "You can exploit a creature's momentary distraction. When a creature within 5 feet of you is hit by an attack made by a creature other than you, you can use your reaction to make a melee attack against that creature.",
            level: 17,
          },
        ],
      },
      {
        name: "way of the four elements",
        description:
          "Monks of the Way of Four Elements follow a monastic tradition that harnesses the power of the elements. They learn to channel their ki into elemental energy, allowing them to wield fire, water, air, and earth.",
        traits: [
          {
            name: "Disciple of the Elements",
            description:
              "You learn magical disciplines that harness the power of the four elements. You learn one elemental discipline of your choice (such as Fangs of the Fire Snake or Water Whip). You learn one additional discipline at 6th, 11th, and 17th level. Whenever you gain a monk level, you can replace one discipline with another.",
            level: 3,
          },
          {
            name: "Elemental Attunement",
            description:
              "You can use your action to briefly control elemental forces nearby, causing a minor elemental effect: create a harmless sensory effect related to an element, instantly light or snuff out a candle/torch/small fire, chill or warm up to 1 pound of nonliving material for 1 hour, or cause earth/fire/water/mist to shape into a crude form.",
            level: 3,
          },
          {
            name: "Additional Disciplines",
            description:
              "You learn additional elemental disciplines, expanding your mastery over the elements and allowing you to emulate spell effects like burning hands, gust of wind, and more by spending ki points.",
            level: 6,
          },
          {
            name: "Advanced Disciplines",
            description:
              "Your elemental mastery deepens, allowing you to emulate more powerful spells.",
            level: 11,
          },
          {
            name: "Master of Elements",
            description:
              "Your control over elemental forces reaches its peak, allowing you to emulate high-level spells like cone of cold and wall of stone.",
            level: 17,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Divine Sense",
        description:
          "As an action, you can detect the presence of strong evil or good within 60 feet. You know the type (celestial, fiend, or undead) of any being whose presence you sense, but not its identity. You can use this feature a number of times equal to 1 + your Charisma modifier, regaining uses after a long rest.",
        level: 1,
      },
      {
        name: "Lay on Hands",
        description:
          "You have a pool of healing power that can restore hit points equal to your paladin level x 5. As an action, you can touch a creature and restore any number of hit points from your pool. You can also cure one disease or poison. The pool refills after a long rest.",
        level: 1,
      },
      {
        name: "Fighting Style",
        description:
          "You adopt a style of fighting. Choose from Defense, Dueling, Great Weapon Fighting, or Protection.",
        level: 2,
      },
      {
        name: "Spellcasting",
        description:
          "You can cast paladin spells using Charisma as your spellcasting ability. You prepare spells from the paladin spell list, and you can change your prepared spells after a long rest.",
        level: 2,
      },
      {
        name: "Divine Smite",
        description:
          "When you hit a creature with a melee weapon attack, you can expend one spell slot to deal additional radiant damage (2d8 for a 1st-level slot, plus 1d8 for each slot level higher, and an extra 1d8 against undead or fiends).",
        level: 2,
      },
      {
        name: "Divine Health",
        description: "You are immune to disease.",
        level: 3,
      },
      {
        name: "Extra Attack",
        description:
          "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "Aura of Protection",
        description:
          "Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier. At 18th level, the range of this aura increases to 30 feet.",
        level: 6,
      },
      {
        name: "Aura of Courage",
        description:
          "You and friendly creatures within 10 feet of you can't be frightened while you are conscious. At 18th level, the range of this aura increases to 30 feet.",
        level: 10,
      },
      {
        name: "Improved Divine Smite",
        description:
          "Whenever you hit a creature with a melee weapon, the creature takes an extra 1d8 radiant damage.",
        level: 11,
      },
      {
        name: "Cleansing Touch",
        description:
          "You can use your action to end one spell on yourself or on one willing creature you touch. You can use this feature a number of times equal to your Charisma modifier, regaining uses after a long rest.",
        level: 14,
      },
    ],
    subclasses: [
      {
        name: "oath of devotion",
        description:
          "Paladins who take the Oath of Devotion bind themselves to the loftiest ideals of justice, virtue, and order. They hold themselves to the highest standards of conduct, embodying the angels themselves.",
        traits: [
          {
            name: "Channel Divinity: Sacred Weapon",
            description:
              "As an action, you can imbue one weapon with positive energy for 1 minute. For the duration, you add your Charisma modifier to attack rolls made with that weapon, and it emits bright light in a 20-foot radius.",
            level: 3,
          },
          {
            name: "Channel Divinity: Turn the Unholy",
            description:
              "As an action, each fiend or undead within 30 feet that can see or hear you must make a Wisdom saving throw or be turned for 1 minute.",
            level: 3,
          },
          {
            name: "Aura of Devotion",
            description:
              "You and friendly creatures within 10 feet of you can't be charmed while you are conscious. At 18th level, the range increases to 30 feet.",
            level: 7,
          },
          {
            name: "Purity of Spirit",
            description:
              "You are always under the effects of a protection from evil and good spell.",
            level: 15,
          },
          {
            name: "Holy Nimbus",
            description:
              "As an action, you can emanate sunlight for 1 minute. You emit bright light in a 30-foot radius, and enemies that start their turn in the light take 10 radiant damage. You also have advantage on saving throws against spells cast by fiends or undead. Once used, you can't use this feature again until you finish a long rest.",
            level: 20,
          },
        ],
      },
      {
        name: "oath of the ancients",
        description:
          "Paladins who swear the Oath of the Ancients pledge themselves to protecting the light, life, and beauty of the world. They are the guardians of nature and preserve the spark of life against the encroaching darkness.",
        traits: [
          {
            name: "Channel Divinity: Nature's Wrath",
            description:
              "As an action, spectral vines spring up and reach for a creature within 10 feet. The creature must succeed on a Strength or Dexterity saving throw or be restrained. While restrained, the creature repeats the save at the end of each of its turns.",
            level: 3,
          },
          {
            name: "Channel Divinity: Turn the Faithless",
            description:
              "As an action, each fey or fiend within 30 feet that can see or hear you must make a Wisdom saving throw or be turned for 1 minute.",
            level: 3,
          },
          {
            name: "Aura of Warding",
            description:
              "You and friendly creatures within 10 feet of you have resistance to damage from spells. At 18th level, the range increases to 30 feet.",
            level: 7,
          },
          {
            name: "Undying Sentinel",
            description:
              "When you are reduced to 0 hit points and are not killed outright, you can choose to drop to 1 hit point instead. Once used, you can't use this feature again until you finish a long rest. Additionally, you suffer none of the drawbacks of old age and can't be aged magically.",
            level: 15,
          },
          {
            name: "Elder Champion",
            description:
              "As an action, you assume the form of an ancient force of nature for 1 minute. You regain 10 hit points at the start of each of your turns, you can cast paladin spells as a bonus action, and enemies within 10 feet have disadvantage on saves against your spells and Channel Divinity. Once used, you can't use this again until you finish a long rest.",
            level: 20,
          },
        ],
      },
      {
        name: "oath of vengeance",
        description:
          "Paladins who swear the Oath of Vengeance set aside mercy in favor of pursuing greater justice. They are relentless in their hunt for the forces of wickedness, delivering swift and terrible vengeance on wrongdoers.",
        traits: [
          {
            name: "Channel Divinity: Abjure Enemy",
            description:
              "As an action, present your holy symbol and choose one creature within 60 feet. It must make a Wisdom save or be frightened for 1 minute or until it takes damage. Frightened creatures have 0 speed, and if the creature is an aberration, celestial, elemental, fey, fiend, or undead, it is also paralyzed.",
            level: 3,
          },
          {
            name: "Channel Divinity: Vow of Enmity",
            description:
              "As a bonus action, you can utter a vow of enmity against a creature within 10 feet for 1 minute. You have advantage on attack rolls against the creature.",
            level: 3,
          },
          {
            name: "Relentless Avenger",
            description:
              "When you hit a creature with an opportunity attack, you can move up to half your speed immediately after the attack as part of the same reaction. This movement doesn't provoke opportunity attacks.",
            level: 7,
          },
          {
            name: "Soul of Vengeance",
            description:
              "When a creature under the effect of your Vow of Enmity makes an attack, you can use your reaction to make a melee weapon attack against that creature.",
            level: 15,
          },
          {
            name: "Avenging Angel",
            description:
              "As an action, you sprout spectral wings for 1 hour. You have a flying speed of 60 feet, and when you appear, you can frighten enemies within 30 feet (Wisdom save). Once used, you can't use this again until you finish a long rest.",
            level: 20,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Favored Enemy",
        description:
          "You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them. You choose additional favored enemies at higher levels.",
        level: 1,
      },
      {
        name: "Natural Explorer",
        description:
          "You are particularly familiar with one type of natural environment. When you make an Intelligence or Wisdom check related to your favored terrain, your proficiency bonus is doubled. While traveling in your favored terrain, you gain several benefits including difficult terrain doesn't slow your group's travel and you can't become lost except by magical means.",
        level: 1,
      },
      {
        name: "Fighting Style",
        description:
          "You adopt a particular style of fighting. Choose from Archery, Defense, Dueling, or Two-Weapon Fighting.",
        level: 2,
      },
      {
        name: "Spellcasting",
        description:
          "You learn to cast ranger spells using Wisdom as your spellcasting ability. You know a number of spells as shown in the Ranger table, choosing from the ranger spell list.",
        level: 2,
      },
      {
        name: "Primeval Awareness",
        description:
          "You can expend one spell slot to sense whether any aberrations, celestials, dragons, elementals, fey, fiends, or undead are present within 1 mile of you (or 6 miles if in your favored terrain).",
        level: 3,
      },
      {
        name: "Extra Attack",
        description:
          "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "Land's Stride",
        description:
          "Moving through nonmagical difficult terrain costs you no extra movement. You can pass through nonmagical plants without being slowed and without taking damage if they have thorns, spines, or a similar hazard.",
        level: 8,
      },
      {
        name: "Hide in Plain Sight",
        description:
          "You can spend 1 minute creating camouflage for yourself. Once camouflaged, you can try to hide by pressing yourself against a solid surface that is at least as tall and wide as you are. You gain a +10 bonus to Dexterity (Stealth) checks as long as you remain there.",
        level: 10,
      },
      {
        name: "Vanish",
        description:
          "You can use the Hide action as a bonus action. Also, you can't be tracked by nonmagical means unless you choose to leave a trail.",
        level: 14,
      },
      {
        name: "Feral Senses",
        description:
          "You gain preternatural senses that help you fight creatures you can't see. When you attack a creature you can't see, your inability to see it doesn't impose disadvantage on your attack rolls. You are also aware of the location of any invisible creature within 30 feet, provided it isn't hidden from you and you aren't blinded or deafened.",
        level: 18,
      },
      {
        name: "Foe Slayer",
        description:
          "Once on each of your turns, you can add your Wisdom modifier to the attack roll or the damage roll of an attack you make against one of your favored enemies. You can choose to use this before or after the roll, but before any effects of the roll are applied.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "hunter",
        description:
          "Rangers who follow the Hunter archetype learn specialized techniques for fighting threats that range from rampaging ogres to hordes of orcs, from raging dragons to towering giants.",
        traits: [
          {
            name: "Hunter's Prey",
            description:
              "You gain one of the following features: Colossus Slayer (once per turn, deal an extra 1d8 damage to a creature you hit with a weapon attack if it's below its hit point maximum), Giant Killer (when a Large or larger creature attacks you, you can use your reaction to attack it), or Horde Breaker (once per turn, when you make a weapon attack, you can make another attack against a different creature within 5 feet of the original target).",
            level: 3,
          },
          {
            name: "Defensive Tactics",
            description:
              "You gain one of the following features: Escape the Horde (opportunity attacks against you have disadvantage), Multiattack Defense (when a creature hits you, you gain +4 AC against all subsequent attacks from that creature for the rest of the turn), or Steel Will (you have advantage on saving throws against being frightened).",
            level: 7,
          },
          {
            name: "Multiattack",
            description:
              "You gain one of the following features: Volley (you can attack all creatures in a 10-foot radius within range with your ranged weapon) or Whirlwind Attack (you can attack all creatures within 5 feet of you with your melee weapon).",
            level: 11,
          },
          {
            name: "Superior Hunter's Defense",
            description:
              "You gain one of the following features: Evasion (when subjected to an effect that allows a Dexterity save for half damage, you take no damage on success and half on failure), Stand Against the Tide (when a hostile creature misses you with a melee attack, you can use your reaction to force it to repeat the attack against another creature of your choice), or Uncanny Dodge (when an attacker you can see hits you, you can use your reaction to halve the attack's damage).",
            level: 15,
          },
        ],
      },
      {
        name: "beast master",
        description:
          "Rangers of the Beast Master archetype form a deep bond with a beast from the lands they wander. United in focus, beast and ranger work as one to fight the monstrous foes that threaten civilization.",
        traits: [
          {
            name: "Ranger's Companion",
            description:
              "You gain a beast companion that accompanies you on your adventures. Choose a beast that is no larger than Medium and has a challenge rating of 1/4 or lower. The beast obeys your commands and takes its turn on your initiative. It uses your proficiency bonus rather than its own and gains proficiency in two skills of your choice. Its hit point maximum equals its normal maximum or four times your ranger level, whichever is higher.",
            level: 3,
          },
          {
            name: "Exceptional Training",
            description:
              "On any of your turns when your beast companion doesn't attack, you can use a bonus action to command it to take the Dash, Disengage, Dodge, or Help action on its turn.",
            level: 7,
          },
          {
            name: "Bestial Fury",
            description:
              "When you command your beast companion to take the Attack action, the beast can make two attacks, or it can take the Multiattack action if it has that action.",
            level: 11,
          },
          {
            name: "Share Spells",
            description:
              "When you cast a spell targeting yourself, you can also affect your beast companion with the spell if the beast is within 30 feet of you.",
            level: 15,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Expertise",
        description:
          "Choose two of your skill proficiencies or one skill proficiency and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check using these chosen proficiencies. At 6th level, you can choose two more of your proficiencies to gain this benefit.",
        level: 1,
      },
      {
        name: "Sneak Attack",
        description:
          "You know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage or if another enemy of the target is within 5 feet of it. This damage increases as you gain levels (2d6 at 3rd, 3d6 at 5th, etc.).",
        level: 1,
      },
      {
        name: "Thieves' Cant",
        description:
          "You know thieves' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation. It takes four times longer to convey such a message than it does to speak the same idea plainly.",
        level: 1,
      },
      {
        name: "Cunning Action",
        description:
          "You can take a bonus action on each of your turns in combat to take the Dash, Disengage, or Hide action.",
        level: 2,
      },
      {
        name: "Uncanny Dodge",
        description:
          "When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you.",
        level: 5,
      },
      {
        name: "Evasion",
        description:
          "When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed on the saving throw, and only half damage if you fail.",
        level: 7,
      },
      {
        name: "Reliable Talent",
        description:
          "Whenever you make an ability check that lets you add your proficiency bonus, you can treat a d20 roll of 9 or lower as a 10.",
        level: 11,
      },
      {
        name: "Blindsense",
        description:
          "If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.",
        level: 14,
      },
      {
        name: "Slippery Mind",
        description:
          "You have acquired greater mental strength. You gain proficiency in Wisdom saving throws.",
        level: 15,
      },
      {
        name: "Elusive",
        description:
          "You are so evasive that attackers rarely gain the upper hand against you. No attack roll has advantage against you while you aren't incapacitated.",
        level: 18,
      },
      {
        name: "Stroke of Luck",
        description:
          "If your attack misses a target within range, you can turn the miss into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once you use this feature, you can't use it again until you finish a short or long rest.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "thief",
        description:
          "Thieves hone their skills in larceny and stealth. They have a knack for finding the solution to any problem, demonstrating resourcefulness and adaptability in their pursuit of wealth and secrets.",
        traits: [
          {
            name: "Fast Hands",
            description:
              "You can use the bonus action granted by your Cunning Action to make a Dexterity (Sleight of Hand) check, use your thieves' tools to disarm a trap or open a lock, or take the Use an Object action.",
            level: 3,
          },
          {
            name: "Second-Story Work",
            description:
              "You gain the ability to climb faster than normal. Climbing no longer costs you extra movement. Additionally, when you make a running jump, the distance you cover increases by a number of feet equal to your Dexterity modifier.",
            level: 3,
          },
          {
            name: "Supreme Sneak",
            description:
              "You have advantage on Dexterity (Stealth) checks if you move no more than half your speed on the same turn.",
            level: 9,
          },
          {
            name: "Use Magic Device",
            description:
              "You ignore all class, race, and level requirements on the use of magic items.",
            level: 13,
          },
          {
            name: "Thief's Reflexes",
            description:
              "You can take two turns during the first round of any combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10.",
            level: 17,
          },
        ],
      },
      {
        name: "assassin",
        description:
          "Assassins focus their training on the grim art of death. They are masters of dealing swift and deadly strikes, approaching their quarry undetected and ending lives before their victims even realize the danger.",
        traits: [
          {
            name: "Bonus Proficiencies",
            description: "You gain proficiency with the disguise kit and the poisoner's kit.",
            level: 3,
          },
          {
            name: "Assassinate",
            description:
              "You have advantage on attack rolls against any creature that hasn't taken a turn in the combat yet. Additionally, any hit you score against a creature that is surprised is a critical hit.",
            level: 3,
          },
          {
            name: "Infiltration Expertise",
            description:
              "You can unfailingly create false identities for yourself. You must spend seven days and 25 gp to establish the history, profession, and affiliations for an identity. You can't establish an identity that belongs to someone else.",
            level: 9,
          },
          {
            name: "Impostor",
            description:
              "You gain the ability to unerringly mimic another person's speech, writing, and behavior. You must spend at least three hours studying these patterns. You have advantage on Charisma (Deception) checks when trying to pass yourself off as that person.",
            level: 13,
          },
          {
            name: "Death Strike",
            description:
              "When you attack and hit a creature that is surprised, it must make a Constitution saving throw (DC 8 + your Dexterity modifier + your proficiency bonus). On a failed save, double the damage of your attack against the creature.",
            level: 17,
          },
        ],
      },
      {
        name: "arcane trickster",
        description:
          "Arcane Tricksters enhance their skills of stealth and agility with magic, learning tricks of enchantment and illusion. They use magical deception and misdirection to accomplish their roguish goals.",
        traits: [
          {
            name: "Spellcasting",
            description:
              "You gain the ability to cast wizard spells. Intelligence is your spellcasting ability. You learn cantrips and spells primarily from the enchantment and illusion schools.",
            level: 3,
          },
          {
            name: "Mage Hand Legerdemain",
            description:
              "When you cast mage hand, you can make the spectral hand invisible and you can perform additional tasks with it: stow or retrieve an object from a container, pick locks and disarm traps with thieves' tools, or use an action to control the hand for one of these tasks. You can use the bonus action granted by Cunning Action to control the hand.",
            level: 3,
          },
          {
            name: "Magical Ambush",
            description:
              "If you are hidden from a creature when you cast a spell on it, the creature has disadvantage on any saving throw it makes against the spell this turn.",
            level: 9,
          },
          {
            name: "Versatile Trickster",
            description:
              "You gain the ability to distract targets with your mage hand. As a bonus action, you can designate a creature within 5 feet of the spectral hand. Doing so gives you advantage on attack rolls against that creature until the end of the turn.",
            level: 13,
          },
          {
            name: "Spell Thief",
            description:
              "You gain the ability to magically steal the knowledge of how to cast a spell from another spellcaster. Immediately after a creature casts a spell that targets you or includes you in its area of effect, you can use your reaction to force the creature to make a saving throw. On a failed save, you negate the spell's effect against you, and you steal the knowledge of the spell if it's at least 1st level and of a level you can cast.",
            level: 17,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Spellcasting",
        description:
          "You can cast sorcerer spells using Charisma as your spellcasting ability. You know a number of cantrips and spells as shown in the Sorcerer table. Unlike other spellcasters, you know spells innately and don't prepare them.",
        level: 1,
      },
      {
        name: "Sorcerous Origin",
        description:
          "You choose a sorcerous origin, which describes the source of your innate magical power. Your choice grants you features at 1st level and again at 6th, 14th, and 18th level.",
        level: 1,
      },
      {
        name: "Font of Magic",
        description:
          "You tap into a deep wellspring of magic within yourself. You have a number of sorcery points equal to your sorcerer level. You can use sorcery points to create spell slots or convert spell slots into sorcery points. You regain all spent sorcery points after a long rest.",
        level: 2,
      },
      {
        name: "Metamagic",
        description:
          "You gain the ability to twist your spells to suit your needs. You learn two Metamagic options of your choice from options like Careful Spell, Distant Spell, Empowered Spell, Extended Spell, Heightened Spell, Quickened Spell, Subtle Spell, and Twinned Spell. You learn one additional option at 10th level and one more at 17th level.",
        level: 3,
      },
      {
        name: "Sorcerous Restoration",
        description:
          "When you finish a short rest, you regain a number of sorcery points equal to your Charisma modifier (minimum of 1).",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "draconic bloodline",
        description:
          "Sorcerers with Draconic Bloodline trace their magic to a powerful dragon ancestor. The magic flowing through their veins manifests in draconic features and an affinity for the raw elemental power of dragons.",
        traits: [
          {
            name: "Dragon Ancestor",
            description:
              "You choose one type of dragon as your ancestor. This determines the damage type associated with your draconic powers. You can speak, read, and write Draconic. Additionally, whenever you make a Charisma check when interacting with dragons, your proficiency bonus is doubled.",
            level: 1,
          },
          {
            name: "Draconic Resilience",
            description:
              "Your hit point maximum increases by 1 and increases by 1 again whenever you gain a level in this class. Additionally, parts of your skin are covered by dragon-like scales. When you aren't wearing armor, your AC equals 13 + your Dexterity modifier.",
            level: 1,
          },
          {
            name: "Elemental Affinity",
            description:
              "When you cast a spell that deals damage of the type associated with your draconic ancestry, you add your Charisma modifier to that damage. Additionally, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour.",
            level: 6,
          },
          {
            name: "Dragon Wings",
            description:
              "You gain the ability to sprout a pair of dragon wings from your back, gaining a flying speed equal to your current speed. You can create these wings as a bonus action on your turn and they last until you dismiss them as a bonus action.",
            level: 14,
          },
          {
            name: "Draconic Presence",
            description:
              "You can channel the dread presence of your dragon ancestor. As an action, you can spend 5 sorcery points to draw on this power and exude an aura of awe or fear (your choice) to a distance of 60 feet. Each hostile creature in that area must succeed on a Wisdom saving throw or be charmed (if you chose awe) or frightened (if you chose fear) for 1 minute.",
            level: 18,
          },
        ],
      },
      {
        name: "wild magic",
        description:
          "Sorcerers with Wild Magic have chaotic magic surging through their veins, a consequence of raw magic or powerful planar influence. Their spells can unleash unpredictable effects, bending the fabric of reality in strange and wondrous ways.",
        traits: [
          {
            name: "Wild Magic Surge",
            description:
              "Your spellcasting can unleash surges of untamed magic. Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. If you roll a 1, roll on the Wild Magic Surge table to create a random magical effect.",
            level: 1,
          },
          {
            name: "Tides of Chaos",
            description:
              "You can manipulate the forces of chance and chaos to gain advantage on one attack roll, ability check, or saving throw. Once you do so, you must finish a long rest before you can use this feature again. Any time before you regain the use of this feature, the DM can have you roll on the Wild Magic Surge table immediately after you cast a sorcerer spell of 1st level or higher. You then regain the use of this feature.",
            level: 1,
          },
          {
            name: "Bend Luck",
            description:
              "You have the ability to twist fate using your wild magic. When another creature you can see makes an attack roll, an ability check, or a saving throw, you can use your reaction and spend 2 sorcery points to roll 1d4 and apply the number rolled as a bonus or penalty to the creature's roll.",
            level: 6,
          },
          {
            name: "Controlled Chaos",
            description:
              "You gain a modicum of control over the surges of your wild magic. Whenever you roll on the Wild Magic Surge table, you can roll twice and use either number.",
            level: 14,
          },
          {
            name: "Spell Bombardment",
            description:
              "When you roll damage for a spell and roll the highest number possible on any of the dice, choose one of those dice, roll it again, and add that roll to the damage. You can use this feature only once per turn.",
            level: 18,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Otherworldly Patron",
        description:
          "You have struck a bargain with an otherworldly being. Your choice grants you features at 1st level and again at 6th, 10th, and 14th level.",
        level: 1,
      },
      {
        name: "Pact Magic",
        description:
          "Your patron bestows upon you a small amount of powerful magic. You have a limited number of spell slots that recharge on a short rest. You know cantrips and a small number of spells, using Charisma as your spellcasting ability.",
        level: 1,
      },
      {
        name: "Eldritch Invocations",
        description:
          "You learn two eldritch invocations of your choice, pieces of forbidden knowledge that grant magical abilities. You learn additional invocations at higher levels and can replace one invocation with another when you gain certain levels.",
        level: 2,
      },
      {
        name: "Pact Boon",
        description:
          "Your otherworldly patron bestows a gift upon you. You choose from Pact of the Chain (gain a familiar), Pact of the Blade (summon a weapon), or Pact of the Tome (receive a grimoire with cantrips).",
        level: 3,
      },
      {
        name: "Mystic Arcanum",
        description:
          "Your patron grants you a magical secret called an arcanum. Choose one 6th-level spell from the warlock spell list as this arcanum. You can cast it once without expending a spell slot and must finish a long rest before you can do so again. At higher levels, you gain more arcanum spells (7th at 13th level, 8th at 15th, 9th at 17th).",
        level: 11,
      },
      {
        name: "Eldritch Master",
        description:
          "You can draw on your inner reserve of mystical power. You can spend 1 minute entreating your patron for aid to regain all your expended spell slots from your Pact Magic feature. Once you use this feature, you must finish a long rest before you can do so again.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "the archfey",
        description:
          "Warlocks bound to an Archfey patron serve beings from the Feywild, creatures of ancient power and caprice. These patrons include princes and princesses of faerie courts, whose presence fills the hearts of mortals with wonder and dread.",
        traits: [
          {
            name: "Fey Presence",
            description:
              "You can cause each creature in a 10-foot cube originating from you to make a Wisdom saving throw or be charmed or frightened by you (your choice) until the end of your next turn. Once you use this feature, you can't use it again until you finish a short or long rest.",
            level: 1,
          },
          {
            name: "Misty Escape",
            description:
              "When you take damage, you can use your reaction to turn invisible and teleport up to 60 feet to an unoccupied space you can see. You remain invisible until the start of your next turn or until you attack or cast a spell. Once you use this feature, you can't use it again until you finish a short or long rest.",
            level: 6,
          },
          {
            name: "Beguiling Defenses",
            description:
              "You are immune to being charmed. When another creature attempts to charm you, you can use your reaction to attempt to turn the charm back on that creature. The creature must succeed on a Wisdom saving throw or be charmed by you for 1 minute or until it takes damage.",
            level: 10,
          },
          {
            name: "Dark Delirium",
            description:
              "You can plunge a creature into an illusory realm. As an action, choose a creature within 60 feet. It must make a Wisdom saving throw or be charmed or frightened by you for 1 minute or until your concentration is broken. While charmed or frightened, the creature believes it is lost in a misty realm. Once you use this feature, you can't use it again until you finish a short or long rest.",
            level: 14,
          },
        ],
      },
      {
        name: "the fiend",
        description:
          "Warlocks who forge a pact with a fiend from the lower planes serve devils, demons, or other creatures of fire and brimstone. These patrons desire the corruption or destruction of all things, and they reward their servants with infernal power.",
        traits: [
          {
            name: "Dark One's Blessing",
            description:
              "When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).",
            level: 1,
          },
          {
            name: "Dark One's Own Luck",
            description:
              "You can call on your patron to alter fate in your favor. When you make an ability check or saving throw, you can add a d10 to your roll. You can use this feature after seeing the initial roll but before any of the roll's effects occur. Once you use this feature, you can't use it again until you finish a short or long rest.",
            level: 6,
          },
          {
            name: "Fiendish Resilience",
            description:
              "You can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.",
            level: 10,
          },
          {
            name: "Hurl Through Hell",
            description:
              "When you hit a creature with an attack, you can use this feature to instantly transport the target through the lower planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, the target returns to the space it previously occupied, or the nearest unoccupied space, and takes 10d10 psychic damage if it is not a fiend. Once you use this feature, you can't use it again until you finish a long rest.",
            level: 14,
          },
        ],
      },
      {
        name: "the great old one",
        description:
          "Warlocks bound to the Great Old One serve entities whose nature is utterly foreign to the fabric of reality. These beings exist in realms beyond mortal comprehension, their alien minds whispering secrets that drive lesser beings to madness.",
        traits: [
          {
            name: "Awakened Mind",
            description:
              "You can communicate telepathically with any creature you can see within 30 feet of you. You don't need to share a language with the creature for it to understand your telepathic utterances, but the creature must be able to understand at least one language.",
            level: 1,
          },
          {
            name: "Entropic Ward",
            description:
              "You learn to magically ward yourself against attack and to turn an enemy's failed strike into good luck for yourself. When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on that roll. If the attack misses, your next attack roll against the creature has advantage if you make it before the end of your next turn. Once you use this feature, you can't use it again until you finish a short or long rest.",
            level: 6,
          },
          {
            name: "Thought Shield",
            description:
              "Your thoughts can't be read by telepathy or other means unless you allow it. You also have resistance to psychic damage, and whenever a creature deals psychic damage to you, that creature takes the same amount of damage that you do.",
            level: 10,
          },
          {
            name: "Create Thrall",
            description:
              "You gain the ability to infect a humanoid's mind with the alien magic of your patron. You can use your action to touch an incapacitated humanoid. That creature is then charmed by you until a remove curse spell is cast on it, the charmed condition is removed from it, or you use this feature again. You can communicate telepathically with the charmed creature as long as the two of you are on the same plane of existence.",
            level: 14,
          },
        ],
      },
    ],
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
    traits: [
      {
        name: "Spellcasting",
        description:
          "You can cast wizard spells using Intelligence as your spellcasting ability. You have a spellbook containing wizard spells that you can prepare. You prepare a list of wizard spells from your spellbook after a long rest.",
        level: 1,
      },
      {
        name: "Arcane Recovery",
        description:
          "Once per day when you finish a short rest, you can recover some expended spell slots. The spell slots can have a combined level equal to or less than half your wizard level (rounded up), and none of the slots can be 6th level or higher.",
        level: 1,
      },
      {
        name: "Spell Mastery",
        description:
          "You have achieved such mastery over certain spells that you can cast them at will. Choose a 1st-level wizard spell and a 2nd-level wizard spell from your spellbook. You can cast those spells at their lowest level without expending a spell slot when you have them prepared.",
        level: 18,
      },
      {
        name: "Signature Spells",
        description:
          "You gain mastery over two powerful spells and can cast them with little effort. Choose two 3rd-level wizard spells in your spellbook as your signature spells. These spells are always prepared and don't count against the number of spells you can prepare. If you cast either spell using a spell slot of 3rd level, you can do so once without expending a spell slot, regaining the ability after a short or long rest.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "school of abjuration",
        description:
          "Wizards of the School of Abjuration are masters of protective magic. They weave wards that shield themselves and others from harm, learning to use magic to impose their will upon enemies and turn aside attacks.",
        traits: [
          {
            name: "Abjuration Savant",
            description:
              "The gold and time you must spend to copy an abjuration spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Arcane Ward",
            description:
              "You can weave magic around yourself for protection. When you cast an abjuration spell of 1st level or higher, you create a magical ward that has hit points equal to twice your wizard level + your Intelligence modifier. Whenever you take damage, the ward takes the damage instead. If this damage reduces the ward to 0 hit points, you take any remaining damage.",
            level: 2,
          },
          {
            name: "Projected Ward",
            description:
              "When a creature within 30 feet of you takes damage, you can use your reaction to cause your Arcane Ward to absorb that damage instead. If this damage reduces the ward to 0 hit points, the warded creature takes any remaining damage.",
            level: 6,
          },
          {
            name: "Improved Abjuration",
            description:
              "When you cast an abjuration spell that requires you to make an ability check as a part of casting that spell (as in counterspell and dispel magic), you add your proficiency bonus to that ability check.",
            level: 10,
          },
          {
            name: "Spell Resistance",
            description:
              "You have advantage on saving throws against spells, and you have resistance against the damage of spells.",
            level: 14,
          },
        ],
      },
      {
        name: "school of conjuration",
        description:
          "Wizards of the School of Conjuration specialize in producing creatures and objects seemingly out of thin air, summoning forth allies and items from across the multiverse to aid them.",
        traits: [
          {
            name: "Conjuration Savant",
            description:
              "The gold and time you must spend to copy a conjuration spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Minor Conjuration",
            description:
              "You can use your action to conjure an inanimate object in your hand or on the ground in an unoccupied space within 10 feet. The object can be no larger than 3 feet on a side and weigh no more than 10 pounds. The object is visibly magical and disappears after 1 hour, if you use this feature again, or if it takes any damage.",
            level: 2,
          },
          {
            name: "Benign Transposition",
            description:
              "You can use your action to teleport up to 30 feet to an unoccupied space you can see. Alternatively, you can choose a willing creature within 5 feet and swap places with it. Once you use this feature, you can't use it again until you finish a long rest or cast a conjuration spell of 1st level or higher.",
            level: 6,
          },
          {
            name: "Focused Conjuration",
            description:
              "While you are concentrating on a conjuration spell, your concentration can't be broken as a result of taking damage.",
            level: 10,
          },
          {
            name: "Durable Summons",
            description:
              "Any creature that you summon or create with a conjuration spell has 30 temporary hit points.",
            level: 14,
          },
        ],
      },
      {
        name: "school of divination",
        description:
          "Wizards of the School of Divination peer through the mists of time to see glimpses of the future. They use their knowledge to help their allies and thwart their foes, wielding omens and portents as weapons.",
        traits: [
          {
            name: "Divination Savant",
            description:
              "The gold and time you must spend to copy a divination spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Portent",
            description:
              "Glimpses of the future begin to press in on your awareness. When you finish a long rest, roll two d20s and record the numbers rolled. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these foretelling rolls. You must choose to do so before the roll. You can use each foretelling roll only once.",
            level: 2,
          },
          {
            name: "Expert Divination",
            description:
              "When you cast a divination spell of 2nd level or higher using a spell slot, you regain one expended spell slot. The slot you regain must be of a level lower than the spell you cast and can't be higher than 5th level.",
            level: 6,
          },
          {
            name: "The Third Eye",
            description:
              "You can use your action to increase your powers of perception. Choose one benefit: Darkvision (60 feet), Ethereal Sight (see into the Ethereal Plane within 60 feet), Greater Comprehension (read any language), or See Invisibility (see invisible creatures within 10 feet). The benefit lasts until you are incapacitated or take a short or long rest.",
            level: 10,
          },
          {
            name: "Greater Portent",
            description:
              "The visions in your dreams intensify. You roll three d20s for your Portent feature, rather than two.",
            level: 14,
          },
        ],
      },
      {
        name: "school of enchantment",
        description:
          "Wizards of the School of Enchantment have honed their ability to magically entrance and beguile others. They weave magic that captivates the mind and influences the behavior of others, bending them to their will.",
        traits: [
          {
            name: "Enchantment Savant",
            description:
              "The gold and time you must spend to copy an enchantment spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Hypnotic Gaze",
            description:
              "As an action, choose one creature within 5 feet. It must make a Wisdom saving throw or be charmed by you until the end of your next turn. The charmed creature's speed drops to 0, and it is incapacitated and visibly dazed. On subsequent turns, you can use your action to maintain this effect, extending its duration until the end of your next turn. This effect ends if you move more than 5 feet away, if the creature takes damage, or if the creature can't see or hear you.",
            level: 2,
          },
          {
            name: "Instinctive Charm",
            description:
              "When a creature you can see within 30 feet makes an attack roll against you, you can use your reaction to divert the attack. The attacker must make a Wisdom saving throw. On a failed save, the attacker must target the creature closest to it. On a successful save, you can't use this feature on the attacker again until you finish a long rest. You must choose to use this before knowing if the attack hits.",
            level: 6,
          },
          {
            name: "Split Enchantment",
            description:
              "When you cast an enchantment spell of 1st level or higher that targets only one creature, you can have it target a second creature.",
            level: 10,
          },
          {
            name: "Alter Memories",
            description:
              "When you cast an enchantment spell to charm one or more creatures, you can alter one creature's understanding so it remains unaware of being charmed. Additionally, before the spell expires, you can use your action to make the creature forget some of the time it spent charmed (up to 1 + your Charisma modifier hours, minimum 1 hour).",
            level: 14,
          },
        ],
      },
      {
        name: "school of evocation",
        description:
          "Wizards of the School of Evocation focus their study on magic that creates powerful elemental effects. They channel raw magical energy into devastating attacks, hurling bolts of fire and lightning at their enemies.",
        traits: [
          {
            name: "Evocation Savant",
            description:
              "The gold and time you must spend to copy an evocation spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Sculpt Spells",
            description:
              "When you cast an evocation spell that affects other creatures you can see, you can choose a number of them equal to 1 + the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.",
            level: 2,
          },
          {
            name: "Potent Cantrip",
            description:
              "When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip's damage (if any) but suffers no additional effect.",
            level: 6,
          },
          {
            name: "Empowered Evocation",
            description:
              "You can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast.",
            level: 10,
          },
          {
            name: "Overchannel",
            description:
              "When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before finishing a long rest, you take 2d12 necrotic damage for each level of the spell (this damage can't be reduced). Each time you use this before a long rest, the necrotic damage per spell level increases by 1d12.",
            level: 14,
          },
        ],
      },
      {
        name: "school of illusion",
        description:
          "Wizards of the School of Illusion focus their studies on magic that dazzles the senses and tricks the mind. They craft phantoms from shadow and sound, weaving illusions so convincing they can make the unreal seem real.",
        traits: [
          {
            name: "Illusion Savant",
            description:
              "The gold and time you must spend to copy an illusion spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Improved Minor Illusion",
            description:
              "You learn the minor illusion cantrip. If you already know it, you learn a different wizard cantrip. When you cast minor illusion, you can create both a sound and an image with a single casting.",
            level: 2,
          },
          {
            name: "Malleable Illusions",
            description:
              "When you cast an illusion spell that has a duration of 1 minute or longer, you can use your action to change the nature of that illusion (using the spell's normal parameters), provided you can see the illusion.",
            level: 6,
          },
          {
            name: "Illusory Self",
            description:
              "When a creature makes an attack roll against you, you can use your reaction to interpose an illusory duplicate between the attacker and yourself. The attack automatically misses you, then the illusion dissipates. Once you use this feature, you can't use it again until you finish a short or long rest.",
            level: 10,
          },
          {
            name: "Illusory Reality",
            description:
              "You have learned to weave shadow magic into your illusions to give them a semi-reality. When you cast an illusion spell of 1st level or higher, you can choose one inanimate, nonmagical object that is part of the illusion and make that object real. The object remains real for 1 minute and can't deal damage or directly harm anyone.",
            level: 14,
          },
        ],
      },
      {
        name: "school of necromancy",
        description:
          "Wizards of the School of Necromancy explore the cosmic forces of life, death, and undeath. They learn to manipulate the energy that animates all living things, using it to extend their own life or create thralls from the fallen.",
        traits: [
          {
            name: "Necromancy Savant",
            description:
              "The gold and time you must spend to copy a necromancy spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Grim Harvest",
            description:
              "Once per turn when you kill one or more creatures with a spell of 1st level or higher, you regain hit points equal to twice the spell's level, or three times its level if the spell belongs to the School of Necromancy. You don't gain this benefit for killing constructs or undead.",
            level: 2,
          },
          {
            name: "Undead Thralls",
            description:
              "You add the animate dead spell to your spellbook if it is not there already. When you cast animate dead, you can target one additional corpse or pile of bones, creating another zombie or skeleton. Whenever you create an undead using a necromancy spell, it has additional benefits: its hit point maximum is increased by an amount equal to your wizard level, and it adds your proficiency bonus to its weapon damage rolls.",
            level: 6,
          },
          {
            name: "Inured to Undeath",
            description:
              "You have resistance to necrotic damage, and your hit point maximum can't be reduced. You have spent so much time dealing with undead that you've become inured to their touch.",
            level: 10,
          },
          {
            name: "Command Undead",
            description:
              "As an action, you can choose one undead you can see within 60 feet. It must make a Charisma saving throw against your wizard spell save DC. If it succeeds, you can't use this feature on it again. If it fails, it becomes friendly to you and obeys your commands until you use this feature again. Intelligent undead are harder to control in this way.",
            level: 14,
          },
        ],
      },
      {
        name: "school of transmutation",
        description:
          "Wizards of the School of Transmutation are masters of changing the physical world. They alter matter and energy at a fundamental level, transforming one substance into another or reshaping reality to suit their needs.",
        traits: [
          {
            name: "Transmutation Savant",
            description:
              "The gold and time you must spend to copy a transmutation spell into your spellbook is halved.",
            level: 2,
          },
          {
            name: "Minor Alchemy",
            description:
              "You can temporarily alter the physical properties of one nonmagical object. You perform a special alchemical procedure on one object composed entirely of wood, stone, iron, copper, or silver, transforming it into a different one of those materials. For each 10 minutes you spend performing the procedure, you can transform up to 1 cubic foot of material. After 1 hour or until you lose concentration, the material reverts to its original substance.",
            level: 2,
          },
          {
            name: "Transmuter's Stone",
            description:
              "You can spend 8 hours creating a transmuter's stone. The bearer gains one benefit of your choice: darkvision 60 feet, an increase to speed of 10 feet, proficiency in Constitution saving throws, or resistance to acid/cold/fire/lightning/thunder damage (your choice). Each time you cast a transmutation spell of 1st level or higher, you can change the effect. You can have only one stone at a time.",
            level: 6,
          },
          {
            name: "Shapechanger",
            description:
              "You add the polymorph spell to your spellbook if it is not there already. You can cast polymorph without expending a spell slot. When you do so, you can target only yourself and transform into a beast whose challenge rating is 1 or lower. Once you cast polymorph in this way, you can't do so again until you finish a short or long rest.",
            level: 10,
          },
          {
            name: "Master Transmuter",
            description:
              "You can use your action to consume the reserve of transmutation magic stored in your transmuter's stone. You can choose one of four effects: Major Transformation (transmute one nonmagical object into another), Panacea (remove all curses/diseases/poisons from one creature you touch and restore maximum HP), Restore Life (cast raise dead without a spell slot or material components), or Restore Youth (reduce a willing creature's apparent age by 3d10 years). You then need to create a new stone.",
            level: 14,
          },
        ],
      },
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
const SubclassNames = Object.values(Classes).flatMap((c) => c.subclasses.map((sc) => sc.name))

type SpellProgressionTableRow = {
  level: number
  cantrips: number
  prepared?: number // Spells known for "known" casters
  slots: number[] // 1st to 9th level slots
  arcanum?: Record<number, number> // warlock-only
}

// biome-ignore format: easier to read as table
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
    { level: 0, cantrips: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 3, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 3, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 3, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 4, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 4, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 4, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 4, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 4, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 4, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 5, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 5, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 5, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 5, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
  druid: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 2, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 2, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 2, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 3, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 3, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 3, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 3, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 3, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 3, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 4, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 4, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 4, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 4, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 4, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
  paladin: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 0, slots: [2, 0, 0, 0, 0] },
    { level: 2, cantrips: 0, slots: [2, 0, 0, 0, 0] },
    { level: 3, cantrips: 0, slots: [3, 0, 0, 0, 0] },
    { level: 4, cantrips: 0, slots: [3, 0, 0, 0, 0] },
    { level: 5, cantrips: 0, slots: [4, 2, 0, 0, 0] },
    { level: 6, cantrips: 0, slots: [4, 2, 0, 0, 0] },
    { level: 7, cantrips: 0, slots: [4, 3, 0, 0, 0] },
    { level: 8, cantrips: 0, slots: [4, 3, 0, 0, 0] },
    { level: 9, cantrips: 0, slots: [4, 3, 2, 0, 0] },
    { level: 10, cantrips: 0, slots: [4, 3, 2, 0, 0] },
    { level: 11, cantrips: 0, slots: [4, 3, 3, 0, 0] },
    { level: 12, cantrips: 0, slots: [4, 3, 3, 0, 0] },
    { level: 13, cantrips: 0, slots: [4, 3, 3, 1, 0] },
    { level: 14, cantrips: 0, slots: [4, 3, 3, 1, 0] },
    { level: 15, cantrips: 0, slots: [4, 3, 3, 2, 0] },
    { level: 16, cantrips: 0, slots: [4, 3, 3, 2, 0] },
    { level: 17, cantrips: 0, slots: [4, 3, 3, 3, 1] },
    { level: 18, cantrips: 0, slots: [4, 3, 3, 3, 1] },
    { level: 19, cantrips: 0, slots: [4, 3, 3, 3, 2] },
    { level: 20, cantrips: 0, slots: [4, 3, 3, 3, 2] },
  ],
  ranger: [
    { level: 0, cantrips: 0, prepared: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 0, slots: [2, 0, 0, 0, 0] },
    { level: 2, cantrips: 0, slots: [2, 0, 0, 0, 0] },
    { level: 3, cantrips: 0, slots: [3, 0, 0, 0, 0] },
    { level: 4, cantrips: 0, slots: [3, 0, 0, 0, 0] },
    { level: 5, cantrips: 0, slots: [4, 2, 0, 0, 0] },
    { level: 6, cantrips: 0, slots: [4, 2, 0, 0, 0] },
    { level: 7, cantrips: 0, slots: [4, 3, 0, 0, 0] },
    { level: 8, cantrips: 0, slots: [4, 3, 0, 0, 0] },
    { level: 9, cantrips: 0, slots: [4, 3, 2, 0, 0] },
    { level: 10, cantrips: 0, slots: [4, 3, 2, 0, 0] },
    { level: 11, cantrips: 0, slots: [4, 3, 3, 0, 0] },
    { level: 12, cantrips: 0, slots: [4, 3, 3, 0, 0] },
    { level: 13, cantrips: 0, slots: [4, 3, 3, 1, 0] },
    { level: 14, cantrips: 0, slots: [4, 3, 3, 1, 0] },
    { level: 15, cantrips: 0, slots: [4, 3, 3, 2, 0] },
    { level: 16, cantrips: 0, slots: [4, 3, 3, 2, 0] },
    { level: 17, cantrips: 0, slots: [4, 3, 3, 3, 1] },
    { level: 18, cantrips: 0, slots: [4, 3, 3, 3, 1] },
    { level: 19, cantrips: 0, slots: [4, 3, 3, 3, 2] },
    { level: 20, cantrips: 0, slots: [4, 3, 3, 3, 2] },
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
    { level: 0, cantrips: 0, slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 1, cantrips: 3, slots: [2, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 2, cantrips: 3, slots: [3, 0, 0, 0, 0, 0, 0, 0, 0] },
    { level: 3, cantrips: 3, slots: [4, 2, 0, 0, 0, 0, 0, 0, 0] },
    { level: 4, cantrips: 4, slots: [4, 3, 0, 0, 0, 0, 0, 0, 0] },
    { level: 5, cantrips: 4, slots: [4, 3, 2, 0, 0, 0, 0, 0, 0] },
    { level: 6, cantrips: 4, slots: [4, 3, 3, 0, 0, 0, 0, 0, 0] },
    { level: 7, cantrips: 4, slots: [4, 3, 3, 1, 0, 0, 0, 0, 0] },
    { level: 8, cantrips: 4, slots: [4, 3, 3, 2, 0, 0, 0, 0, 0] },
    { level: 9, cantrips: 4, slots: [4, 3, 3, 3, 1, 0, 0, 0, 0] },
    { level: 10, cantrips: 5, slots: [4, 3, 3, 3, 2, 0, 0, 0, 0] },
    { level: 11, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 12, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 0, 0, 0] },
    { level: 13, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 14, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 0, 0] },
    { level: 15, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 16, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 1, 0] },
    { level: 17, cantrips: 5, slots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
    { level: 18, cantrips: 5, slots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
    { level: 19, cantrips: 5, slots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
    { level: 20, cantrips: 5, slots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
  ],
}

type SpellProgression = number[]

// biome-ignore format: easier to read this way
const THIRD_CASTER_CANTRIPS_KNOWN: SpellProgression = [
  0, 0, 0, // 0-2 (unused / not yet a caster)
  2, 2, 2, 2, 2, 2, 2, 3, // 3-10
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3, // 11-20
]

// biome-ignore format: easier to read this way
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

const srd51: Ruleset = {
  species: SpeciesData,
  classes: Classes,
  backgrounds: Backgrounds,

  listLineages(speciesName?: string): Lineage[] {
    if (speciesName) {
      const species = SpeciesData.find((s) => s.name === speciesName)
      return species?.lineages || []
    }
    return SpeciesData.flatMap((s) => s.lineages || [])
  },

  listSubclasses(className?: ClassNameType): string[] {
    if (className) {
      return Classes[className]?.subclasses.map((sc) => sc.name) || []
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

  maxSpellsPrepared(className: ClassNameType, level: number, abilityModifier: number): number {
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

    // Dynamic calculation for classes without fixed prepared counts
    switch (className) {
      case "wizard":
      case "cleric":
      case "druid":
        // Full casters: abilityModifier + level
        return abilityModifier + level
      case "paladin":
      case "ranger":
        // Half casters: abilityModifier + Math.floor(level / 2)
        return abilityModifier + Math.floor(level / 2)
      case "fighter": // Eldritch Knight
      case "rogue": // Arcane Trickster
        return THIRD_CASTER_SPELLS_PREPARED[level] || 0
      default:
        return 0
    }
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

export default srd51
