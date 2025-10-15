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
          "Elves don't need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day. (The Common word for such meditation is \"trance.\") While meditating, you can dream after a fashion; such dreams are actually mental exercises that have become reflexive through years of practice. After resting in this way, you gain the same benefit that a human does from 8 hours of sleep.",
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
            description:
              "You have proficiency with rapiers, shortswords, and hand crossbows.",
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
        description: "As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle. You might also have ties to a specific temple dedicated to your chosen deity or pantheon, and you have a residence there. This could be the temple where you used to serve, if you remain on good terms with it, or a temple where you have found a new home. While near your temple, you can call upon the priests for assistance, provided the assistance you ask for is not hazardous and you remain in good standing with your temple.",
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
        description: "You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona. Additionally, you can forge documents including official papers and personal letters, as long as you have seen an example of the kind of document or the handwriting you are trying to copy.",
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
        description: "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you.",
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
        description: "You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble's court. At such a place, you receive free lodging and food of a modest or comfortable standard (depending on the quality of the establishment), as long as you perform each night. In addition, your performance makes you something of a local figure. When strangers recognize you in a town where you have performed, they typically take a liking to you.",
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
        description: "Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you.",
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
        description: "As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a guildhall offers a central place to meet other members of your profession, which can be a good place to meet potential patrons, allies, or hirelings. Guilds often wield tremendous political power. If you are accused of a crime, your guild will support you if a good case can be made for your innocence or the crime is justifiable. You can also gain access to powerful political figures through the guild, if you are a member in good standing. Such connections might require the donation of money or magic items to the guild's coffers. You must pay dues of 5 gp per month to the guild. If you miss payments, you must make up back dues to remain in the guild's good graces.",
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
        description: "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. It might be a great truth about the cosmos, the deities, the powerful beings of the outer planes, or the forces of nature. It could be a site that no one else has ever seen. You might have uncovered a fact that has long been forgotten, or unearthed some relic of the past that could rewrite history. It might be information that would be damaging to the people who or consigned you to exile, and hence the reason for your return to society. Work with your DM to determine the details of your discovery and its impact on the campaign.",
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
        description: "Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure, and other people of high birth treat you as a member of the same social sphere. You can secure an audience with a local noble if you need to.",
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
        description: "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day, provided that the land offers berries, small game, water, and so forth.",
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
        description: "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature. Your DM might rule that the knowledge you seek is secreted away in an almost inaccessible place, or that it simply cannot be found. Unearthing the deepest secrets of the multiverse can require an adventure or even a whole campaign.",
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
        description: "When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions. You might sail on the ship you served on, or another ship you have good relations with (perhaps one captained by a former crewmate). Because you're calling in a favor, you can't be certain of a schedule or route that will meet your every need. Your Dungeon Master will determine how long it takes to get where you need to go. In return for your free passage, you and your companions are expected to assist the crew during the voyage.",
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
        description: "No matter where you go, people are afraid of you due to your reputation. When you are in a civilized settlement, you can get away with minor criminal offenses, such as refusing to pay for food at a tavern or breaking down doors at a local shop, since most people will not report your activity to the authorities.",
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
        description: "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you when you are in positions of authority. You can invoke your rank to exert influence over other soldiers and requisition simple equipment or horses for temporary use. You can also usually gain access to friendly military encampments and fortresses where your rank is recognized.",
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
        description: "You know the secret patterns and flow of cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed would normally allow.",
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
const SubclassNames = Object.values(Classes).flatMap((c) => (c.subclasses ? c.subclasses : []))

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
    abilityModifier: number
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
    if (entry.prepared !== undefined) {
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
