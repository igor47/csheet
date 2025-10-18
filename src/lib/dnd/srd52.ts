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

export const SRD52_ID = "srd52" as const
export const SRD52_DESCRIPTION = "D&D 5e (2024)"

const SpeciesData: Species[] = [
  {
    name: "dragonborn",
    description:
      "Dragonborn look very much like dragons standing erect in humanoid form, though they lack wings or a tail. They are tall and strongly built, often standing close to 6½ feet tall and weighing 300 pounds or more. Their draconic heritage manifests in a variety of traits they share with true dragons.",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "draconic ancestry",
        description:
          "Your lineage stems from a dragon progenitor. Choose the kind of dragon from your lineage. Your choice determines your Breath Weapon and Damage Resistance as well as your appearance.",
      },
      {
        name: "darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "draconic flight",
        description:
          "As a Bonus Action, you sprout spectral wings on your back that last for 10 minutes or until you retract the wings (no action required) or have the Incapacitated condition. During that time, you have a Fly Speed equal to your Speed. Your wings appear to be made of the same energy as your Breath Weapon. Once you use this trait, you can't use it again until you finish a Long Rest.",
        level: 5,
      },
    ],
    lineages: [
      {
        name: "black",
        description: "Black dragon ancestry, associated with acid and swamps.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of acid in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 acid damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to acid damage.",
          },
        ],
      },
      {
        name: "blue",
        description: "Blue dragon ancestry, associated with lightning and deserts.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of lightning in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 lightning damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to lightning damage.",
          },
        ],
      },
      {
        name: "brass",
        description: "Brass dragon ancestry, associated with fire and deserts.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of fire in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 fire damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to fire damage.",
          },
        ],
      },
      {
        name: "bronze",
        description: "Bronze dragon ancestry, associated with lightning and coastlines.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of lightning in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 lightning damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to lightning damage.",
          },
        ],
      },
      {
        name: "copper",
        description: "Copper dragon ancestry, associated with acid and hills.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of acid in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 acid damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to acid damage.",
          },
        ],
      },
      {
        name: "gold",
        description: "Gold dragon ancestry, associated with fire and noble causes.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of fire in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 fire damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to fire damage.",
          },
        ],
      },
      {
        name: "green",
        description: "Green dragon ancestry, associated with poison and forests.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of poison in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 poison damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to poison damage.",
          },
        ],
      },
      {
        name: "red",
        description: "Red dragon ancestry, associated with fire and mountains.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of fire in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 fire damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to fire damage.",
          },
        ],
      },
      {
        name: "silver",
        description: "Silver dragon ancestry, associated with cold and mountains.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of cold in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 cold damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to cold damage.",
          },
        ],
      },
      {
        name: "white",
        description: "White dragon ancestry, associated with cold and arctic regions.",
        traits: [
          {
            name: "breath weapon",
            description:
              "When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of cold in either a 15-foot Cone or a 30-foot Line that is 5 feet wide. Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 cold damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10). You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
          {
            name: "damage resistance",
            description: "You have Resistance to cold damage.",
          },
        ],
      },
    ],
  },
  {
    name: "dwarf",
    description:
      "Kingdoms rich in ancient grandeur, halls carved into the roots of mountains, the echoing of picks and hammers in deep mines and blazing forges, a commitment to clan and tradition, and a burning hatred of goblins and orcs—these common threads unite all dwarves.",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "darkvision",
        description: "You have Darkvision with a range of 120 feet.",
      },
      {
        name: "dwarven resilience",
        description:
          "You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.",
      },
      {
        name: "dwarven toughness",
        description:
          "Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a level.",
      },
      {
        name: "stonecunning",
        description:
          "As a Bonus Action, you gain Tremorsense with a range of 60 feet for 10 minutes. You must be on a stone surface or touching a stone surface to use this Tremorsense. The stone can be natural or worked. You can use this Bonus Action a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
      },
    ],
  },
  {
    name: "elf",
    description:
      "Elves are a magical people of otherworldly grace, living in places of ethereal beauty, in the midst of ancient forests or in silvery spires glittering with faerie light, where soft music drifts through the air and gentle fragrances waft on the breeze.",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "elven lineage",
        description:
          "You are part of a lineage that grants you supernatural abilities. Choose a lineage from your available options. You gain the level 1 benefit of that lineage. When you reach character levels 3 and 5, you learn a higher-level spell as shown in your lineage. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
      },
      {
        name: "fey ancestry",
        description:
          "You have Advantage on saving throws you make to avoid or end the Charmed condition.",
      },
      {
        name: "keen senses",
        description: "You have proficiency in the Insight, Perception, or Survival skill.",
      },
      {
        name: "trance",
        description:
          "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours if you spend those hours in a trancelike meditation, during which you retain consciousness.",
      },
    ],
    lineages: [
      {
        name: "drow",
        description:
          "Drow, also known as dark elves, typically dwell in the Underdark and have adapted to its harsh environment. They are known for their innate magical abilities and affinity for darkness.",
        traits: [
          {
            name: "superior darkvision",
            description:
              "The range of your Darkvision increases to 120 feet. You also know the Dancing Lights cantrip.",
          },
          {
            name: "faerie fire",
            description:
              "You learn the Faerie Fire spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 3,
          },
          {
            name: "darkness",
            description:
              "You learn the Darkness spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
      {
        name: "high elf",
        description:
          "High elves are known for their mastery of magic and their keen intellect. They often dwell in elegant cities and have a deep appreciation for the arcane arts.",
        traits: [
          {
            name: "cantrip",
            description:
              "You know the Prestidigitation cantrip. Whenever you finish a Long Rest, you can replace that cantrip with a different cantrip from the Wizard spell list.",
          },
          {
            name: "detect magic",
            description:
              "You learn the Detect Magic spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 3,
          },
          {
            name: "misty step",
            description:
              "You learn the Misty Step spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
      {
        name: "wood elf",
        description:
          "Wood elves are fleet of foot and attuned to nature. They are reclusive and distrustful of non-elves, dwelling in ancient forests far from civilization.",
        traits: [
          {
            name: "fleet of foot",
            description: "Your Speed increases to 35 feet. You also know the Druidcraft cantrip.",
          },
          {
            name: "longstrider",
            description:
              "You learn the Longstrider spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 3,
          },
          {
            name: "pass without trace",
            description:
              "You learn the Pass without Trace spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
    ],
  },
  {
    name: "gnome",
    description:
      "A gnome's energy and enthusiasm for living shines through every inch of their tiny body. Gnomes average slightly over 3 feet tall and weigh 40 to 45 pounds. Their tan or brown faces are usually adorned with broad smiles, and their bright eyes shine with excitement.",
    size: "small",
    speed: 30,
    traits: [
      {
        name: "darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "gnomish cunning",
        description: "You have Advantage on Intelligence, Wisdom, and Charisma saving throws.",
      },
      {
        name: "gnomish lineage",
        description:
          "You are part of a lineage that grants you supernatural abilities. Choose one of the available lineages. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the lineage).",
      },
    ],
    lineages: [
      {
        name: "forest gnome",
        description:
          "Forest gnomes have an innate knack for illusion and a natural bond with animals. They are shy and secretive, dwelling in sylvan forests where they use illusions to conceal themselves.",
        traits: [
          {
            name: "natural illusionist",
            description:
              "You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest. You can also use any spell slots you have to cast the spell.",
          },
        ],
      },
      {
        name: "rock gnome",
        description:
          "Rock gnomes are the most common type of gnome, known for their inventiveness and skill with gadgets and devices. They are natural tinkerers who love creating mechanical wonders.",
        traits: [
          {
            name: "tinker",
            description:
              "You know the Mending and Prestidigitation cantrips. In addition, you can spend 10 minutes casting Prestidigitation to create a Tiny clockwork device (AC 5, 1 HP), such as a toy, fire starter, or music box. When you create the device, you determine its function by choosing one effect from Prestidigitation; the device produces that effect whenever you or another creature takes a Bonus Action to activate it with a touch. If the chosen effect has options within it, you choose one of those options for the device when you create it. For example, if you choose the spell's ignite-extinguish effect, you determine whether the device ignites or extinguishes fire; the device doesn't do both. You can have three such devices in existence at a time, and each falls apart 8 hours after its creation or when you dismantle it with a touch as a Utilize action.",
          },
        ],
      },
    ],
  },
  {
    name: "goliath",
    description:
      "At the highest mountain peaks dwell the reclusive goliaths, wandering a bleak realm of rock, wind, and cold. Their bodies look as if they are carved from mountain stone and give them great physical power. Their spirits take after the wandering wind, making them nomads who wander from peak to peak.",
    size: "medium",
    speed: 35,
    traits: [
      {
        name: "large form",
        description:
          "You can change your size to Large as a Bonus Action if you're in a big enough space. This transformation lasts for 10 minutes or until you end it (no action required). For that duration, you have Advantage on Strength checks, and your Speed increases by 10 feet. Once you use this trait, you can't use it again until you finish a Long Rest.",
        level: 5,
      },
      {
        name: "powerful build",
        description:
          "You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.",
      },
    ],
    lineages: [
      {
        name: "cloud giant",
        description:
          "Your giant ancestry is tied to the Cloud Giants, granting you abilities associated with air and flight.",
        traits: [
          {
            name: "cloud's jaunt",
            description:
              "As a Bonus Action, you magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
        ],
      },
      {
        name: "fire giant",
        description:
          "Your giant ancestry is tied to the Fire Giants, granting you abilities associated with fire and heat.",
        traits: [
          {
            name: "fire's burn",
            description:
              "When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 fire damage to that target. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
        ],
      },
      {
        name: "frost giant",
        description:
          "Your giant ancestry is tied to the Frost Giants, granting you abilities associated with cold and ice.",
        traits: [
          {
            name: "frost's chill",
            description:
              "When you hit a target with an attack roll and deal damage to it, you can also deal 1d6 cold damage to that target and reduce its Speed by 10 feet until the start of your next turn. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
        ],
      },
      {
        name: "hill giant",
        description:
          "Your giant ancestry is tied to the Hill Giants, granting you abilities associated with strength and endurance.",
        traits: [
          {
            name: "hill's tumble",
            description:
              "When you hit a Large or smaller creature with an attack roll and deal damage to it, you can give that target the Prone condition. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
        ],
      },
      {
        name: "stone giant",
        description:
          "Your giant ancestry is tied to the Stone Giants, granting you abilities associated with earth and resilience.",
        traits: [
          {
            name: "stone's endurance",
            description:
              "When you take damage, you can take a Reaction to roll 1d12. Add your Constitution modifier to the number rolled and reduce the damage by that total. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
        ],
      },
      {
        name: "storm giant",
        description:
          "Your giant ancestry is tied to the Storm Giants, granting you abilities associated with storms and thunder.",
        traits: [
          {
            name: "storm’s thunder",
            description:
              "When you take damage from a creature within 60 feet of you, you can take a Reaction to deal 1d8 Thunder damage to that creature. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.",
          },
        ],
      },
    ],
  },
  {
    name: "halfling",
    description:
      "The comforts of home are the goals of most halflings' lives: a place to settle in peace and quiet, far from marauding monsters and clashing armies. Others form wandering bands that travel constantly, lured by the open road and the wide horizon to discover the wonders of new lands and peoples.",
    size: "small",
    speed: 30,
    traits: [
      {
        name: "brave",
        description:
          "You have Advantage on saving throws you make to avoid or end the Frightened condition.",
      },
      {
        name: "halfling nimbleness",
        description:
          "You can move through the space of any creature that is a size larger than you, but you can't stop in the same space.",
      },
      {
        name: "luck",
        description:
          "When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.",
      },
      {
        name: "naturally stealthy",
        description:
          "You can take the Hide action even when you are obscured only by a creature that is at least one size larger than you.",
      },
    ],
  },
  {
    name: "human",
    description:
      "Humans are the most adaptable and ambitious people among the common species. They have widely varying tastes, morals, and customs in the many different lands where they have settled. Individually and as a group, humans are adaptable opportunists, and they stay alert to changing political and social dynamics.",
    size: "medium", // or small
    speed: 30,
    traits: [
      {
        name: "resourceful",
        description: "You gain Heroic Inspiration whenever you finish a Long Rest.",
      },
      {
        name: "skillful",
        description: "You gain proficiency in one skill of your choice.",
      },
      {
        name: "versatile",
        description: "You gain an Origin feat of your choice. Skilled is recommended.",
      },
    ],
  },
  {
    name: "orc",
    description:
      "Orcs trace their creation to Gruumsh, an orc god who came into being in the formless void and created the orcs. In his unending battle with the goblin god Maglubiyet and the elf god Corellon Larethian, Gruumsh seeks to gather all orcs under his banner and destroy the realms of his foes. Many orcs carry Gruumsh's blessings, and the god's aggressive nature is mirrored in the ferocity of orcs.",
    size: "medium",
    speed: 30,
    traits: [
      {
        name: "adrenaline rush",
        description:
          "You can take the Dash action as a Bonus Action. When you do so, you gain a number of Temporary Hit Points equal to your Proficiency Bonus. You can use this trait a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Short or Long Rest.",
      },
      {
        name: "darkvision",
        description: "You have Darkvision with a range of 120 feet.",
      },
      {
        name: "relentless endurance",
        description:
          "When you are reduced to 0 Hit Points but not killed outright, you can drop to 1 Hit Point instead. Once you use this trait, you can't do so again until you finish a Long Rest.",
      },
    ],
  },
  {
    name: "tiefling",
    description:
      "Tieflings are derived from human bloodlines infused with the essence of fiends. Some tieflings trace their ancestry to Mount Celestia or the Infinite Layers of the Abyss, while others are connected to Baator and other infernal realms. Whatever their origin, tieflings carry a supernatural heritage that influences their appearance and grants them innate magical abilities.",
    size: "medium", // or small
    speed: 30,
    traits: [
      {
        name: "darkvision",
        description: "You have Darkvision with a range of 60 feet.",
      },
      {
        name: "fiendish legacy",
        description:
          "You are the recipient of a legacy that grants you supernatural abilities. Choose a legacy from the available options (Abyssal, Chthonic, or Infernal). You gain the level 1 benefit of the chosen legacy. When you reach character levels 3 and 5, you learn a higher-level spell. You always have that spell prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait (choose the ability when you select the legacy).",
      },
      {
        name: "otherworldly presence",
        description:
          "You know the Thaumaturgy cantrip. When you cast it with this trait, the spell uses the same spellcasting ability you use for your Fiendish Legacy trait.",
      },
    ],
    lineages: [
      {
        name: "abyssal",
        description:
          "Your infernal heritage is tainted by the chaotic energies of the Abyss. You have a connection to demonic forces and can tap into their power.",
        traits: [
          {
            name: "resistance to poison",
            description: "You have Resistance to Poison damage.",
          },
          {
            name: "poison spray",
            description:
              "You learn the Poison Spray cantrip. Intelligence, Wisdom, or Charisma is your spellcasting ability for this cantrip (choose when you select this lineage).",
          },
          {
            name: "ray of sickness",
            description:
              "You learn the Ray of Sickness spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Your spellcasting ability for this spell is the same one you choose for your Fiendish Legacy trait.",
            level: 3,
          },
          {
            name: "hold person",
            description:
              "You learn the Hold Person spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
      {
        name: "chthonic",
        description:
          "Your infernal heritage is influenced by the dark powers of the underworld. You have a connection to shadowy forces and can tap into their power.",
        traits: [
          {
            name: "resistance to necrotic",
            description: "You have Resistance to Necrotic damage.",
          },
          {
            name: "chill touch",
            description:
              "You learn the Chill Touch cantrip. Intelligence, Wisdom, or Charisma is your spellcasting ability for this cantrip (choose when you select this lineage).",
          },
          {
            name: "false life",
            description:
              "You learn the False Life spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Your spellcasting ability for this spell is the same one you choose for your Fiendish Legacy trait.",
            level: 3,
          },
          {
            name: "ray of enfeeblement",
            description:
              "You learn the Ray of Enfeeblement spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
      {
        name: "infernal",
        description:
          "Your infernal heritage is closely tied to the Nine Hells. You have a connection to devilish forces and can tap into their power.",
        traits: [
          {
            name: "resistance to fire",
            description: "You have Resistance to Fire damage.",
          },
          {
            name: "fire bolt",
            description:
              "You know the Fire Bolt cantrip. Intelligence, Wisdom, or Charisma is your spellcasting ability for this cantrip (choose when you select this lineage).",
          },
          {
            name: "hellish rebuke",
            description:
              "You learn the Hellish Rebuke spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have of the appropriate level. Your spellcasting ability for this spell is the same one you choose for your Fiendish Legacy trait.",
            level: 3,
          },
          {
            name: "darkness",
            description:
              "You learn the Darkness spell and always have it prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest.",
            level: 5,
          },
        ],
      },
    ],
  },
] as const

const BackgroundNames = [
  "acolyte",
  "charlatan",
  "criminal",
  "entertainer",
  "folk hero",
  "guild artisan",
  "hermit",
  "noble",
  "outlander",
  "pirate",
  "sage",
  "sailor",
  "soldier",
  "urchin",
] as const
export type BackgroundNameType = (typeof BackgroundNames)[number]

const Backgrounds: Record<BackgroundNameType, Background> = {
  acolyte: {
    name: "acolyte",
    description:
      "You have spent your life in the service of a temple to a specific god or pantheon of gods. You act as an intermediary between the realm of the holy and the mortal world, performing sacred rites and offering sacrifices in order to conduct worshipers into the presence of the divine.",
    skillProficiencies: ["insight", "religion"],
    abilityScoresModified: ["intelligence", "wisdom", "charisma"],
    equipment: [
      "Calligrapher's Supplies",
      "Book (prayers)",
      "Holy Symbol",
      "Parchment (10 sheets)",
      "Robe",
      "8 GP",
    ],
    traits: [
      {
        name: "magic initiate (cleric)",
        description:
          "You learn two cantrips of your choice from the Cleric spell list. You also always have a level 1 spell from that list prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you gain this feat).",
      },
      {
        name: "Shelter of the Faithful",
        description:
          "As an acolyte, you command the respect of those who share your faith, and you can perform the religious ceremonies of your deity. You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith, though you must provide any material components needed for spells. Those who share your religion will support you (but only you) at a modest lifestyle. You might also have ties to a specific temple dedicated to your chosen deity or pantheon, and you have a residence there. This could be the temple where you used to serve, if you remain on good terms with it, or a temple where you have found a new home. While near your temple, you can call upon the priests for assistance, provided the assistance you ask for is not hazardous and you remain in good standing with your temple.",
      },
    ],
  },
  charlatan: {
    name: "charlatan",
    description:
      "You have always had a way with people. You know what makes them tick, you can tease out their hearts' desires after a few minutes of conversation, and with a few leading questions you can read them like they were children's books. It's a useful talent, and one that you're perfectly willing to use for your advantage.",
    skillProficiencies: ["deception", "sleight of hand"],
    toolProficiencies: ["disguise kit", "forgery kit"],
    abilityScoresModified: ["dexterity", "intelligence", "charisma"],
    equipment: ["Disguise Kit", "Forgery Kit", "Fine Clothes", "Signet Ring (fake)", "15 GP"],
    traits: [
      {
        name: "skilled",
        description:
          "You gain proficiency in any combination of three skills or tools of your choice.",
      },
      {
        name: "false identity",
        description:
          "You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona. Additionally, you can forge documents including official papers and personal letters, as long as you have seen an example of the kind of document or the handwriting you are trying to copy.",
      },
    ],
  },
  criminal: {
    name: "criminal",
    description:
      "You are an experienced criminal with a history of breaking the law. You have spent a lot of time among other criminals and still have contacts within the criminal underworld. You're far closer than most people to the world of murder, theft, and violence that pervades the underbelly of civilization.",
    skillProficiencies: ["sleight of hand", "stealth"],
    toolProficiencies: ["thieves' tools"],
    abilityScoresModified: ["dexterity", "constitution", "intelligence"],
    equipment: [
      "2 Daggers",
      "Thieves' Tools",
      "Crowbar",
      "2 Pouches",
      "Traveler's Clothes",
      "16 GP",
    ],
    traits: [
      {
        name: "alert",
        description:
          "You gain the following benefits. Initiative Proficiency: When you roll Initiative, you can add your Proficiency Bonus to the roll. Initiative Swap: Immediately after you roll Initiative, you can swap your Initiative with the Initiative of one willing ally in the same combat. You can't make this swap if you or the ally has the Incapacitated condition.",
      },
      {
        name: "criminal contact",
        description:
          "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances; specifically, you know the local messengers, corrupt caravan masters, and seedy sailors who can deliver messages for you.",
      },
    ],
  },
  entertainer: {
    name: "entertainer",
    description:
      "You thrive in front of an audience. You know how to entrance them, entertain them, and even inspire them. Your poetics can stir the hearts of those who hear you, awakening grief or joy, laughter or anger. Your music raises their spirits or captures their sorrow. Your dance steps captivate, your humor cuts to the quick.",
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
    abilityScoresModified: ["dexterity", "intelligence", "charisma"],
    equipment: ["Musical Instrument", "Disguise Kit", "Costume", "Token from an Admirer", "15 GP"],
    traits: [
      {
        name: "musician",
        description:
          "You gain proficiency with three musical instruments of your choice. You also gain Advantage on Charisma (Performance) checks to entertain an audience with music.",
      },
      {
        name: "by popular demand",
        description:
          "You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble's court. At such a place, you receive free lodging and food of a modest or comfortable standard (depending on the quality of the establishment), as long as you perform each night. In addition, your performance makes you something of a local figure. When strangers recognize you in a town where you have performed, they typically take a liking to you.",
      },
    ],
  },
  "folk hero": {
    name: "folk hero",
    description:
      "You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion, and your destiny calls you to stand against the tyrants and monsters that threaten the common folk everywhere.",
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
    abilityScoresModified: ["strength", "constitution", "wisdom"],
    equipment: ["Artisan's Tools", "Shovel", "Iron Pot", "Common Clothes", "10 GP"],
    traits: [
      {
        name: "tough",
        description:
          "Your Hit Point maximum increases by an amount equal to twice your character level when you gain this feat. Whenever you gain a character level thereafter, your Hit Point maximum increases by an additional 2 Hit Points.",
      },
      {
        name: "rustic hospitality",
        description:
          "Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners, unless you have shown yourself to be a danger to them. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you.",
      },
    ],
  },
  "guild artisan": {
    name: "guild artisan",
    description:
      "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans. You are a well-established part of the mercantile world, freed by talent and wealth from the constraints of a feudal social order. You learned your skills as an apprentice to a master artisan.",
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
    abilityScoresModified: ["intelligence", "wisdom", "charisma"],
    equipment: [
      "Artisan's Tools",
      "Letter of Introduction from Guild",
      "Traveler's Clothes",
      "15 GP",
    ],
    traits: [
      {
        name: "crafter",
        description:
          "You gain proficiency with one type of artisan's tools of your choice. Additionally, whenever you purchase a nonmagical item, you receive a 20 percent discount on it.",
      },
      {
        name: "guild membership",
        description:
          "As an established and respected member of a guild, you can rely on certain benefits that membership provides. Your fellow guild members will provide you with lodging and food if necessary, and pay for your funeral if needed. In some cities and towns, a guildhall offers a central place to meet other members of your profession, which can be a good place to meet potential patrons, allies, or hirelings. Guilds often wield tremendous political power. If you are accused of a crime, your guild will support you if a good case can be made for your innocence or the crime is justifiable. You can also gain access to powerful political figures through the guild, if you are a member in good standing. Such connections might require the donation of money or magic items to the guild's coffers. You must pay dues of 5 gp per month to the guild. If you miss payments, you must make up back dues to remain in the guild's good graces.",
      },
    ],
  },
  hermit: {
    name: "hermit",
    description:
      "You lived in seclusion—either in a sheltered community such as a monastery, or entirely alone—for a formative part of your life. In your time apart from the clamor of society, you found quiet, solitude, and perhaps some of the answers you were looking for.",
    skillProficiencies: ["medicine", "religion"],
    toolProficiencies: ["herbalism kit"],
    additionalLanguages: 1,
    abilityScoresModified: ["constitution", "intelligence", "wisdom"],
    equipment: [
      "Herbalism Kit",
      "Scroll Case with Notes",
      "Winter Blanket",
      "Common Clothes",
      "5 GP",
    ],
    traits: [
      {
        name: "healer",
        description:
          "When you use a Healer's Kit to stabilize a dying creature, that creature also regains 1 Hit Point. As a Bonus Action, you can expend one use of a Healer's Kit to tend to a creature and restore 1d6 + 4 Hit Points to it, plus additional Hit Points equal to the creature's maximum number of Hit Dice. The creature can't regain Hit Points from this feat again until it finishes a Short or Long Rest.",
      },
      {
        name: "discovery",
        description:
          "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery. The exact nature of this revelation depends on the nature of your seclusion. It might be a great truth about the cosmos, the deities, the powerful beings of the outer planes, or the forces of nature. It could be a site that no one else has ever seen. You might have uncovered a fact that has long been forgotten, or unearthed some relic of the past that could rewrite history. It might be information that would be damaging to the people who or consigned you to exile, and hence the reason for your return to society. Work with your DM to determine the details of your discovery and its impact on the campaign.",
      },
    ],
  },
  noble: {
    name: "noble",
    description:
      "You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence. You might be a pampered aristocrat unfamiliar with work or discomfort, a former merchant just elevated to the nobility, or a disinherited scoundrel with a disproportionate sense of entitlement.",
    skillProficiencies: ["history", "persuasion"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }],
    additionalLanguages: 1,
    abilityScoresModified: ["intelligence", "wisdom", "charisma"],
    equipment: ["Fine Clothes", "Signet Ring", "Scroll of Pedigree", "25 GP"],
    traits: [
      {
        name: "skilled",
        description:
          "You gain proficiency in any combination of three skills or tools of your choice.",
      },
      {
        name: "position of privilege",
        description:
          "Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you and avoid your displeasure, and other people of high birth treat you as a member of the same social sphere. You can secure an audience with a local noble if you need to.",
      },
    ],
  },
  outlander: {
    name: "outlander",
    description:
      "You grew up in the wilds, far from civilization and the comforts of town and technology. You've witnessed the migration of herds larger than forests, survived weather more extreme than any city-dweller could comprehend, and enjoyed the solitude of being the only thinking creature for miles in any direction.",
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
    abilityScoresModified: ["strength", "dexterity", "wisdom"],
    equipment: ["Staff", "Hunting Trap", "Trophy from Animal", "Traveler's Clothes", "10 GP"],
    traits: [
      {
        name: "savage attacker",
        description:
          "You've trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target.",
      },
      {
        name: "wanderer",
        description:
          "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you. In addition, you can find food and fresh water for yourself and up to five other people each day, provided that the land offers berries, small game, water, and so forth.",
      },
    ],
  },
  pirate: {
    name: "pirate",
    description:
      "You spent your youth under the sway of a dread pirate, a ruthless cutthroat who taught you how to survive in a world of sharks and savages. You've indulged in larceny on the high seas and sent more than one deserving soul to a briny grave. Fear and bloodshed are no strangers to you.",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator's tools", "vehicles (water)"],
    abilityScoresModified: ["strength", "dexterity", "wisdom"],
    equipment: [
      "Belaying Pin (Club)",
      "50 feet of Silk Rope",
      "Lucky Charm",
      "Common Clothes",
      "10 GP",
    ],
    traits: [
      {
        name: "lucky",
        description:
          "You have inexplicable luck that seems to kick in at just the right moment. You have a number of Luck Points equal to your Proficiency Bonus. You can spend a Luck Point to reroll any D20 Test you make, and you must use the new roll. You regain all expended Luck Points when you finish a Long Rest.",
      },
      {
        name: "bad reputation",
        description:
          "No matter where you go, people are afraid of you due to your reputation. When you are in a civilized settlement, you can get away with minor criminal offenses, such as refusing to pay for food at a tavern or breaking down doors at a local shop, since most people will not report your activity to the authorities.",
      },
    ],
  },
  sage: {
    name: "sage",
    description:
      "You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you. Your efforts have made you a master in your fields of study.",
    skillProficiencies: ["arcana", "history"],
    toolProficiencies: ["calligrapher's supplies"],
    abilityScoresModified: ["constitution", "intelligence", "wisdom"],
    equipment: [
      "Quarterstaff",
      "Calligrapher's Supplies",
      "Book (history)",
      "Parchment (8 sheets)",
      "Robe",
      "8 GP",
    ],
    traits: [
      {
        name: "magic initiate (wizard)",
        description:
          "You learn two cantrips of your choice from the Wizard spell list. You also always have a level 1 spell from that list prepared. You can cast it once without a spell slot, and you regain the ability to cast it in that way when you finish a Long Rest. You can also cast the spell using any spell slots you have. Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells (choose when you gain this feat).",
      },
      {
        name: "researcher",
        description:
          "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually, this information comes from a library, scriptorium, university, or a sage or other learned person or creature. Your DM might rule that the knowledge you seek is secreted away in an almost inaccessible place, or that it simply cannot be found. Unearthing the deepest secrets of the multiverse can require an adventure or even a whole campaign.",
      },
    ],
  },
  sailor: {
    name: "sailor",
    description:
      "You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, monsters of the deep, and those who wanted to sink your craft to the bottomless depths. Your first love is the distant line of the horizon, but the time has come to try your hand at something new.",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["navigator's tools", "vehicles (water)"],
    abilityScoresModified: ["strength", "dexterity", "wisdom"],
    equipment: [
      "Belaying Pin (Club)",
      "50 feet of Silk Rope",
      "Lucky Charm",
      "Common Clothes",
      "10 GP",
    ],
    traits: [
      {
        name: "tavern brawler",
        description:
          "You gain proficiency with improvised weapons. Your unarmed strike uses a d4 for damage. When you hit a creature with an unarmed strike or an improvised weapon on your turn, you can use a Bonus Action to attempt to grapple the target.",
      },
      {
        name: "ship's passage",
        description:
          "When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions. You might sail on the ship you served on, or another ship you have good relations with (perhaps one captained by a former crewmate). Because you're calling in a favor, you can't be certain of a schedule or route that will meet your every need. Your Dungeon Master will determine how long it takes to get where you need to go. In return for your free passage, you and your companions are expected to assist the crew during the voyage.",
      },
    ],
  },
  soldier: {
    name: "soldier",
    description:
      "War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, including how to stay alive on the battlefield. You might have been part of a standing national army or a mercenary company, or perhaps a member of a local militia.",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: [{ choose: 1, from: ["dice set", "playing card set"] }],
    abilityScoresModified: ["strength", "dexterity", "constitution"],
    equipment: [
      "Spear",
      "Shortbow",
      "20 Arrows",
      "Gaming Set",
      "Healer's Kit",
      "Quiver",
      "Traveler's Clothes",
      "14 GP",
    ],
    traits: [
      {
        name: "savage attacker",
        description:
          "You've trained to deal particularly damaging strikes. Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll against the target.",
      },
      {
        name: "military rank",
        description:
          "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence, and they defer to you when you are in positions of authority. You can invoke your rank to exert influence over other soldiers and requisition simple equipment or horses for temporary use. You can also usually gain access to friendly military encampments and fortresses where your rank is recognized.",
      },
    ],
  },
  urchin: {
    name: "urchin",
    description:
      "You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or to provide for you, so you learned to provide for yourself. You fought fiercely over food and kept a constant watch out for other desperate souls who might steal from you. You slept on rooftops and in alleyways, exposed to the elements.",
    skillProficiencies: ["sleight of hand", "stealth"],
    toolProficiencies: ["disguise kit", "thieves' tools"],
    abilityScoresModified: ["dexterity", "constitution", "wisdom"],
    equipment: [
      "Small Knife",
      "Map of City",
      "Pet Mouse",
      "Token from Parents",
      "Common Clothes",
      "10 GP",
    ],
    traits: [
      {
        name: "skilled",
        description:
          "You gain proficiency in any combination of three skills or tools of your choice.",
      },
      {
        name: "city secrets",
        description:
          "You know the secret patterns and flow of cities and can find passages through the urban sprawl that others would miss. When you are not in combat, you (and companions you lead) can travel between any two locations in the city twice as fast as your speed would normally allow.",
      },
    ],
  },
} as const

const Classes: Record<ClassNameType, ClassDef> = {
  barbarian: {
    name: "barbarian",
    description:
      "A fierce warrior of primitive background who can enter a battle rage. Barbarians come alive in the chaos of combat, using their rage to fuel powerful attacks and shrug off damage that would fell lesser warriors.",
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
        name: "rage",
        description:
          "You can enter a Rage as a Bonus Action. While raging, you gain damage resistance to physical damage, bonus damage on Strength attacks, and Advantage on Strength checks and saves. You can't maintain Concentration or cast spells while raging.",
        level: 1,
      },
      {
        name: "unarmored defense",
        description:
          "While not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier. You can use a shield and still gain this benefit.",
        level: 1,
      },
      {
        name: "danger sense",
        description:
          "You have Advantage on Dexterity saving throws unless you have the Incapacitated condition.",
        level: 2,
      },
      {
        name: "reckless attack",
        description:
          "When you make your first attack on your turn, you can attack recklessly. Doing so gives you Advantage on attack rolls using Strength until your next turn, but attack rolls against you have Advantage.",
        level: 2,
      },
      {
        name: "primal knowledge",
        description:
          "You gain proficiency in another Barbarian skill. While raging, you can use Strength for ability checks with Acrobatics, Intimidation, Perception, Stealth, or Survival.",
        level: 3,
      },
      {
        name: "extra attack",
        description: "You can attack twice whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "fast movement",
        description: "Your speed increases by 10 feet while you aren't wearing Heavy armor.",
        level: 5,
      },
      {
        name: "feral instinct",
        description: "You have Advantage on Initiative rolls.",
        level: 7,
      },
      {
        name: "brutal strike",
        description:
          "If you use Reckless Attack, you can forgo Advantage to make your hit a Brutal Strike, dealing extra damage with special effects.",
        level: 9,
      },
      {
        name: "relentless rage",
        description:
          "If you drop to 0 HP while raging, you can make a DC 10 Constitution save to instead drop to a number equal to twice your Barbarian level. The DC increases by 5 each use.",
        level: 11,
      },
      {
        name: "persistent rage",
        description:
          "When you roll Initiative, you can regain all expended uses of Rage. Your Rage now lasts for 10 minutes without needing extension.",
        level: 15,
      },
      {
        name: "primal champion",
        description:
          "Your Strength and Constitution scores increase by 4, and their maximum increases by 4.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "path of the berserker",
        description:
          "Barbarians who walk the Path of the Berserker direct their Rage primarily toward violence. Their path is one of untrammeled fury, thrilling in the chaos of battle.",
        traits: [
          {
            name: "frenzy",
            description:
              "If you use Reckless Attack while raging, you deal extra damage equal to your Rage Damage bonus in d6s to the first target you hit with a Strength attack.",
            level: 3,
          },
          {
            name: "mindless rage",
            description:
              "You have Immunity to the Charmed and Frightened conditions while raging. If Charmed or Frightened when you rage, the condition ends.",
            level: 6,
          },
          {
            name: "retaliation",
            description:
              "When you take damage from a creature within 5 feet, you can use a Reaction to make one melee attack against that creature.",
            level: 10,
          },
          {
            name: "intimidating presence",
            description:
              "As a Bonus Action, strike terror into creatures within 30 feet with a Wisdom save (DC 8 + Strength mod + proficiency). Failed saves cause Frightened for 1 minute. Once used, can't use again until you finish a Long Rest unless you expend a Rage use.",
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
    description:
      "An inspiring magician whose power echoes the music of creation. Bards are masters of song, speech, and magic, using their artistic talents to inspire allies, demoralize foes, manipulate minds, and create illusions.",
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
        name: "bardic inspiration",
        description:
          "As a Bonus Action, you can inspire a creature within 60 feet who can see or hear you, granting them one Bardic Inspiration die (d6). The creature can add the die to a D20 Test within the next hour.",
        level: 1,
      },
      {
        name: "spellcasting",
        description:
          "You cast spells through your bardic arts using Charisma as your spellcasting ability. You can use a musical instrument as a spellcasting focus.",
        level: 1,
      },
      {
        name: "expertise",
        description: "You gain Expertise in two of your skill proficiencies of your choice.",
        level: 2,
      },
      {
        name: "jack of all trades",
        description:
          "You can add half your Proficiency Bonus to any ability check that uses a skill proficiency you lack.",
        level: 2,
      },
      {
        name: "font of inspiration",
        description:
          "You regain all expended uses of Bardic Inspiration when you finish a Short or Long Rest. You can also expend a spell slot to regain one use.",
        level: 5,
      },
      {
        name: "countercharm",
        description:
          "When you or a creature within 30 feet fails a save against Charmed or Frightened, you can use a Reaction to cause the save to be rerolled with Advantage.",
        level: 7,
      },
      {
        name: "magical secrets",
        description:
          "You can choose any of your new prepared spells from the Bard, Cleric, Druid, and Wizard spell lists. Your mastery of diverse magical traditions expands.",
        level: 10,
      },
      {
        name: "superior inspiration",
        description:
          "When you roll Initiative, you regain expended uses of Bardic Inspiration until you have two if you have fewer than that.",
        level: 18,
      },
      {
        name: "words of creation",
        description:
          "You always have Power Word Heal and Power Word Kill prepared. When you cast either spell, you can target a second creature within 10 feet of the first.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "college of lore",
        description:
          "Masters of knowledge and secrets, these bards plumb the depths of magical learning from diverse sources, wielding wit and words as their weapons in courts and libraries alike.",
        traits: [
          {
            name: "bonus proficiencies",
            description: "You gain proficiency with three skills of your choice.",
            level: 3,
          },
          {
            name: "cutting words",
            description:
              "When a creature you can see within 60 feet makes a damage roll or succeeds on a check or attack, you can use a Reaction to expend a Bardic Inspiration die and subtract the roll from theirs.",
            level: 3,
          },
          {
            name: "magical discoveries",
            description:
              "You learn two spells from the Cleric, Druid, or Wizard spell lists. You always have these spells prepared.",
            level: 6,
          },
          {
            name: "peerless skill",
            description:
              "When you fail an ability check or attack roll, you can expend a Bardic Inspiration die to add it to the roll, potentially turning failure into success.",
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
    description:
      "A priestly champion who wields divine magic in service of a higher power. Clerics are intermediaries between the mortal world and the distant planes of the gods, channeling divine power to heal wounds, protect allies, and smite enemies.",
    hitDie: 8,
    primaryAbilities: ["wisdom"],
    savingThrows: ["wisdom", "charisma"],
    armorProficiencies: ["light", "medium", "heavy", "shields"],
    weaponProficiencies: ["simple"],
    toolProficiencies: [],
    skillChoices: { choose: 2, from: ["history", "insight", "medicine", "persuasion", "religion"] },
    traits: [
      {
        name: "spellcasting",
        description:
          "You cast spells through prayer and meditation using Wisdom as your spellcasting ability. You can use a holy symbol as a spellcasting focus.",
        level: 1,
      },
      {
        name: "divine order",
        description:
          "You dedicate yourself to a sacred role: Protector (proficiency with Martial weapons and Heavy armor) or Thaumaturge (extra cantrip and bonus to Arcana/Religion checks).",
        level: 1,
      },
      {
        name: "channel divinity",
        description:
          "You can channel divine energy to fuel magical effects like Divine Spark and Turn Undead. You can use this feature twice, regaining one use on a Short Rest and all uses on a Long Rest.",
        level: 2,
      },
      {
        name: "sear undead",
        description:
          "When you use Turn Undead, you can deal Radiant damage equal to your Wisdom modifier in d8s to each Undead that fails its saving throw.",
        level: 5,
      },
      {
        name: "blessed strikes",
        description:
          "Divine power infuses your attacks. Choose Divine Strike (extra 1d8 damage on weapon hits) or Potent Spellcasting (add Wisdom modifier to cantrip damage).",
        level: 7,
      },
      {
        name: "divine intervention",
        description:
          "As a Magic action, you can cast any Cleric spell of level 5 or lower without expending a spell slot or Material components. Once used, you can't use this again until you finish a Long Rest.",
        level: 10,
      },
      {
        name: "improved blessed strikes",
        description:
          "Your Blessed Strikes option grows more powerful. Divine Strike increases to 2d8, or Potent Spellcasting grants Temporary HP when you deal cantrip damage.",
        level: 14,
      },
      {
        name: "greater divine intervention",
        description:
          "When using Divine Intervention, you can choose the Wish spell. If you do, you can't use Divine Intervention again until you finish 2d4 Long Rests.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "life domain",
        description:
          "Devoted healers who channel the positive energy sustaining all life, these clerics are masters of restoration, soothing hurts and tending wounds with divine grace.",
        traits: [
          {
            name: "disciple of life",
            description:
              "When you cast a spell with a spell slot that restores Hit Points, the creature regains additional Hit Points equal to 2 plus the spell slot's level.",
            level: 3,
          },
          {
            name: "preserve life",
            description:
              "As a Magic action, expend a Channel Divinity use to restore Hit Points equal to five times your Cleric level, distributed among Bloodied creatures within 30 feet.",
            level: 3,
          },
          {
            name: "blessed healer",
            description:
              "When you cast a spell with a spell slot that restores Hit Points to another creature, you regain Hit Points equal to 2 plus the spell slot's level.",
            level: 6,
          },
          {
            name: "supreme healing",
            description:
              "When you restore Hit Points with a spell or Channel Divinity, use the highest number possible for each die instead of rolling.",
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
    description:
      "A priest of the Old Faith, wielding the powers of nature and adopting animal forms. Druids revere nature above all, gaining their spells and other magical powers from the force of nature itself or from a nature deity, using these powers to preserve the natural world.",
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
        name: "spellcasting",
        description:
          "You cast spells through studying the mystical forces of nature using Wisdom as your spellcasting ability. You can use a Druidic Focus as a spellcasting focus.",
        level: 1,
      },
      {
        name: "druidic",
        description:
          "You know Druidic, the secret language of Druids. You always have the Speak with Animals spell prepared.",
        level: 1,
      },
      {
        name: "primal order",
        description:
          "You dedicate yourself to a sacred role: Magician (extra cantrip and bonus to Arcana/Nature checks) or Warden (proficiency with Martial weapons and Medium armor).",
        level: 1,
      },
      {
        name: "wild shape",
        description:
          "As a Bonus Action, you shape-shift into a Beast form you have learned. You can use this twice, regaining uses on Short or Long Rests.",
        level: 2,
      },
      {
        name: "wild companion",
        description:
          "You can expend a spell slot or Wild Shape use to cast Find Familiar without Material components. The familiar is Fey and disappears when you finish a Long Rest.",
        level: 2,
      },
      {
        name: "wild resurgence",
        description:
          "Once per turn, if you have no Wild Shape uses left, you can expend a spell slot to give yourself one use. You can also expend a Wild Shape use to regain a level 1 spell slot.",
        level: 5,
      },
      {
        name: "elemental fury",
        description:
          "The elements flow through you. Choose Potent Spellcasting (add Wisdom modifier to cantrip damage) or Primal Strike (extra 1d8 elemental damage once per turn).",
        level: 7,
      },
      {
        name: "improved elemental fury",
        description:
          "Your Elemental Fury grows stronger. Potent Spellcasting increases cantrip range by 300 feet, or Primal Strike increases to 2d8.",
        level: 15,
      },
      {
        name: "beast spells",
        description:
          "While using Wild Shape, you can cast spells in Beast form, except for spells with costly or consumed Material components.",
        level: 18,
      },
      {
        name: "archdruid",
        description:
          "Nature's vitality blooms within you. When you roll Initiative with no Wild Shape uses, you regain one. You can convert Wild Shape uses into spell slots.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "circle of the land",
        description:
          "Mystics attuned to the magic of specific terrains, these druids draw power from the land itself, channeling nature's vitality to both heal and harm.",
        traits: [
          {
            name: "circle spells",
            description:
              "You always have certain spells prepared based on your chosen land type (Arid, Polar, Temperate, or Tropical), expanding your connection to that terrain.",
            level: 3,
          },
          {
            name: "land's aid",
            description:
              "As a Magic action, expend a Wild Shape use to create flowers and thorns in a 10-foot-radius Sphere. Creatures you choose make a Constitution save, taking 2d6 Necrotic damage on a fail (half on success), while one creature of your choice regains 2d6 HP.",
            level: 3,
          },
          {
            name: "natural recovery",
            description:
              "You can cast a Circle Spell once without expending a spell slot per Long Rest. When you finish a Short Rest, you can recover spell slots with a combined level up to half your Druid level.",
            level: 6,
          },
          {
            name: "nature's ward",
            description:
              "You are immune to the Poisoned condition and gain Resistance to a damage type based on your land choice (Fire, Cold, Lightning, or Poison).",
            level: 10,
          },
          {
            name: "nature's sanctuary",
            description:
              "As a Magic action, expend a Wild Shape use to create a 15-foot Cube of spectral trees lasting 1 minute. You and allies have Half Cover and gain your Nature's Ward Resistance while in the area.",
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
    description:
      "A master of martial combat, skilled with a variety of weapons and armor. Fighters learn the basics of all combat styles and can master any weapon they choose, combining rigorous training with physical excellence to deadly effect.",
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
        name: "fighting style",
        description:
          "You gain a Fighting Style feat of your choice, honing your martial prowess with specialized combat techniques.",
        level: 1,
      },
      {
        name: "second wind",
        description:
          "As a Bonus Action, you can regain Hit Points equal to 1d10 plus your Fighter level. You can use this twice, regaining uses on Short or Long Rests.",
        level: 1,
      },
      {
        name: "weapon mastery",
        description:
          "Your training allows you to use the mastery properties of three kinds of weapons. You can change one choice after a Long Rest.",
        level: 1,
      },
      {
        name: "action surge",
        description:
          "On your turn, you can take one additional action (except the Magic action). Once used, you can't use it again until you finish a Short or Long Rest.",
        level: 2,
      },
      {
        name: "tactical mind",
        description:
          "When you fail an ability check, you can expend a use of Second Wind to roll 1d10 and add it to the check instead of regaining HP.",
        level: 2,
      },
      {
        name: "extra attack",
        description:
          "You can attack twice instead of once whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "tactical shift",
        description:
          "When you activate Second Wind with a Bonus Action, you can move up to half your Speed without provoking Opportunity Attacks.",
        level: 5,
      },
      {
        name: "indomitable",
        description:
          "If you fail a saving throw, you can reroll it with a bonus equal to your Fighter level. Once used, you can't use it again until you finish a Long Rest.",
        level: 9,
      },
      {
        name: "tactical master",
        description:
          "When you attack with a weapon whose mastery property you can use, you can replace that property with the Push, Sap, or Slow property for that attack.",
        level: 9,
      },
      {
        name: "two extra attacks",
        description:
          "You can attack three times instead of once whenever you take the Attack action on your turn.",
        level: 11,
      },
      {
        name: "studied attacks",
        description:
          "If you miss an attack roll against a creature, you have Advantage on your next attack roll against that creature before the end of your next turn.",
        level: 13,
      },
      {
        name: "three extra attacks",
        description:
          "You can attack four times instead of once whenever you take the Attack action on your turn.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "champion",
        description:
          "Paragons of physical excellence who pursue victory through relentless training and devastating prowess, these warriors strive for the crown of the victor in any contest.",
        traits: [
          {
            name: "improved critical",
            description:
              "Your attack rolls with weapons and Unarmed Strikes can score a Critical Hit on a roll of 19 or 20 on the d20.",
            level: 3,
          },
          {
            name: "remarkable athlete",
            description:
              "You have Advantage on Initiative rolls and Strength (Athletics) checks. After you score a Critical Hit, you can move up to half your Speed without provoking Opportunity Attacks.",
            level: 3,
          },
          {
            name: "additional fighting style",
            description:
              "You gain another Fighting Style feat of your choice, further refining your combat techniques.",
            level: 7,
          },
          {
            name: "heroic warrior",
            description:
              "The thrill of battle drives you. During combat, you can give yourself Heroic Inspiration whenever you start your turn without it.",
            level: 10,
          },
          {
            name: "superior critical",
            description:
              "Your attack rolls with weapons and Unarmed Strikes can now score a Critical Hit on a roll of 18-20 on the d20.",
            level: 15,
          },
          {
            name: "survivor",
            description:
              "You attain the pinnacle of resilience. You have Advantage on Death Saving Throws, and at the start of each turn while Bloodied with at least 1 HP, you regain 5 plus your Constitution modifier HP.",
            level: 18,
          },
        ],
      },
      {
        name: "eldritch knight",
        description:
          "Eldritch Knights combine martial mastery with magical study. They learn a number of wizard spells, focusing on abjuration and evocation to bolster their combat abilities with arcane power.",
        traits: [
          {
            name: "spellcasting",
            description:
              "You learn to cast wizard spells. Intelligence is your spellcasting ability. You know two cantrips and can learn a third at level 10. You know three 1st-level wizard spells, and you learn more as you level up. When you gain a fighter level, you can replace one cantrip and one spell you know with another from the wizard spell list.",
            level: 3,
          },
          {
            name: "weapon bond",
            description:
              "You learn a ritual that creates a magical bond between yourself and one weapon. Once bonded, you can't be disarmed of that weapon unless you are incapacitated, and you can summon it as a bonus action if it's on the same plane.",
            level: 3,
          },
          {
            name: "war magic",
            description:
              "When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.",
            level: 7,
          },
          {
            name: "eldritch strike",
            description:
              "When you hit a creature with a weapon attack, that creature has disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn.",
            level: 10,
          },
          {
            name: "arcane charge",
            description:
              "When you use your Action Surge, you can teleport up to 30 feet to an unoccupied space you can see. You can teleport before or after the additional action.",
            level: 15,
          },
          {
            name: "improved war magic",
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
    description:
      "A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection. Monks make careful study of a magical energy that most monastic traditions call ki, using this energy to perform amazing feats of speed and strength.",
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
        name: "martial arts",
        description:
          "You gain mastery of combat with Unarmed Strikes and Monk weapons. You can make an Unarmed Strike as a Bonus Action, roll a Martial Arts die for damage, and use Dexterity for attacks.",
        level: 1,
      },
      {
        name: "unarmored defense",
        description:
          "While not wearing armor or wielding a Shield, your AC equals 10 plus your Dexterity and Wisdom modifiers.",
        level: 1,
      },
      {
        name: "monk's focus",
        description:
          "You harness extraordinary energy represented by Focus Points. You can expend them for Flurry of Blows, Patient Defense, and Step of the Wind.",
        level: 2,
      },
      {
        name: "unarmored movement",
        description:
          "Your speed increases by 10 feet while you aren't wearing armor or wielding a Shield.",
        level: 2,
      },
      {
        name: "uncanny metabolism",
        description:
          "When you roll Initiative, you can regain all expended Focus Points. Once used, you can't use it again until you finish a Long Rest.",
        level: 2,
      },
      {
        name: "deflect attacks",
        description:
          "When hit by an attack, you can use your Reaction to reduce the damage. If you reduce it to 0, you can expend 1 Focus Point to redirect the attack to a creature within 5 feet.",
        level: 3,
      },
      {
        name: "slow fall",
        description:
          "You can use your Reaction when you fall to reduce falling damage by an amount equal to five times your Monk level.",
        level: 4,
      },
      {
        name: "extra attack",
        description:
          "You can attack twice instead of once whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "stunning strike",
        description:
          "Once per turn when you hit a creature with a Monk weapon or Unarmed Strike, you can expend 1 Focus Point to attempt to stun it.",
        level: 5,
      },
      {
        name: "empowered strikes",
        description:
          "Your Unarmed Strikes count as magical for the purpose of overcoming Resistance and Immunity to nonmagical attacks and damage.",
        level: 6,
      },
      {
        name: "evasion",
        description:
          "When subjected to an effect that allows a Dexterity saving throw for half damage, you take no damage on a success and half damage on a failure.",
        level: 7,
      },
      {
        name: "acrobatic movement",
        description:
          "You can move along vertical surfaces and across liquids during your turn without falling.",
        level: 9,
      },
      {
        name: "heightened focus",
        description:
          "Your Flurry of Blows, Patient Defense, and Step of the Wind gain additional benefits.",
        level: 10,
      },
      {
        name: "self-restoration",
        description:
          "At the end of each turn, you can remove Charmed, Frightened, or Poisoned from yourself. Forgoing food and drink doesn't give you Exhaustion.",
        level: 10,
      },
      {
        name: "deflect energy",
        description: "You can now use Deflect Attacks against attacks that deal any damage type.",
        level: 13,
      },
      {
        name: "disciplined survivor",
        description:
          "You gain proficiency in all saving throws. When you fail a save, you can expend 1 Focus Point to reroll it.",
        level: 14,
      },
      {
        name: "perfect focus",
        description:
          "When you roll Initiative and don't use Uncanny Metabolism, you regain expended Focus Points until you have 4 if you have 3 or fewer.",
        level: 15,
      },
      {
        name: "superior defense",
        description:
          "You can expend 3 Focus Points to gain Resistance to all damage except Force for 1 minute.",
        level: 18,
      },
      {
        name: "body and mind",
        description: "Your Dexterity and Wisdom scores increase by 4, to a maximum of 25.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "warrior of the open hand",
        description:
          "Masters of unarmed combat who learn devastating techniques to manipulate opponents and channel their own energy into protection and healing.",
        traits: [
          {
            name: "open hand technique",
            description:
              "When you hit with a Flurry of Blows attack, you can impose Addle (no Opportunity Attacks), Push (15 feet away on failed Strength save), or Topple (Prone on failed Dexterity save).",
            level: 3,
          },
          {
            name: "wholeness of body",
            description:
              "As a Bonus Action, roll your Martial Arts die and regain that many HP plus your Wisdom modifier. Use this a number of times equal to your Wisdom modifier per Long Rest.",
            level: 6,
          },
          {
            name: "fleet step",
            description:
              "When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind immediately after that Bonus Action.",
            level: 11,
          },
          {
            name: "quivering palm",
            description:
              "When you hit with an Unarmed Strike, you can expend 4 Focus Points to set up lethal vibrations. Later, you can force the target to make a Constitution save, taking 10d12 Force damage on a fail or half on a success.",
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
    description:
      "A holy warrior bound to a sacred oath. Paladins are united by their oaths to stand against the forces of evil, wielding divine magic and martial prowess to smite evil, protect the innocent, and uphold justice.",
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
        name: "lay on hands",
        description:
          "You have a pool of healing power that replenishes on a Long Rest. You can restore a total number of Hit Points equal to five times your Paladin level.",
        level: 1,
      },
      {
        name: "spellcasting",
        description:
          "You cast spells through divine power using Charisma as your spellcasting ability. You can use a holy symbol as a spellcasting focus.",
        level: 1,
      },
      {
        name: "weapon mastery",
        description:
          "Your training allows you to use the mastery properties of two kinds of weapons.",
        level: 1,
      },
      {
        name: "fighting style",
        description:
          "You gain a Fighting Style feat of your choice, specializing your combat approach.",
        level: 2,
      },
      {
        name: "paladin's smite",
        description:
          "You always have the Divine Smite spell prepared. As a Bonus Action after hitting with a Melee weapon, you can cast it to deal extra Radiant damage.",
        level: 2,
      },
      {
        name: "aura of protection",
        description:
          "You and allies within 10 feet of you gain a bonus to saving throws equal to your Charisma modifier while you're conscious.",
        level: 6,
      },
      {
        name: "abjure foes",
        description:
          "As a Magic action, force creatures of your choice within 60 feet to make a Wisdom save or be Dazed for 1 minute.",
        level: 9,
      },
      {
        name: "extra attack",
        description:
          "You can attack twice instead of once whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "restoring touch",
        description:
          "When you use Lay On Hands, you can also end one disease or Poisoned condition on the target.",
        level: 10,
      },
      {
        name: "aura of courage",
        description:
          "You and allies in your Aura of Protection have Immunity to the Frightened condition.",
        level: 10,
      },
      {
        name: "cleansing touch",
        description:
          "You can end one spell on yourself or a willing creature by expending a spell slot. You can use this a number of times equal to your Charisma modifier per Long Rest.",
        level: 14,
      },
      {
        name: "radiant strikes",
        description:
          "Your attacks deal an extra 1d8 Radiant damage. This increases to 2d8 at level 17.",
        level: 11,
      },
    ],
    subclasses: [
      {
        name: "oath of devotion",
        description:
          "Knights in shining armor who hold themselves to the highest standards of justice and order, these paladins embody the archetype of righteous defenders.",
        traits: [
          {
            name: "oath spells",
            description:
              "You always have certain spells prepared: Protection from Evil and Good, Shield of Faith, Aid, Zone of Truth, Beacon of Hope, and more as you level.",
            level: 3,
          },
          {
            name: "sacred weapon",
            description:
              "As part of the Attack action, expend a Channel Divinity use to imbue a Melee weapon with positive energy for 10 minutes, adding your Charisma modifier to attack rolls and causing it to emit Bright Light.",
            level: 3,
          },
          {
            name: "aura of devotion",
            description:
              "You and allies in your Aura of Protection have Immunity to the Charmed condition.",
            level: 7,
          },
          {
            name: "smite of protection",
            description:
              "When you cast Divine Smite, you and allies in your Aura of Protection have Half Cover until the start of your next turn.",
            level: 15,
          },
          {
            name: "holy nimbus",
            description:
              "As a Bonus Action, imbue your Aura of Protection with holy power for 10 minutes. You gain Advantage on saves vs Fiends/Undead, enemies in the aura take Radiant damage, and the aura fills with Bright Light.",
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
    description:
      "A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization. Rangers are skilled hunters and trackers who use both combat skills and spellcasting to pursue and defeat their enemies.",
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
        name: "spellcasting",
        description:
          "You cast spells through your attunement to nature using Wisdom as your spellcasting ability. You can use a Druidic Focus as a spellcasting focus.",
        level: 1,
      },
      {
        name: "favored enemy",
        description:
          "You always have the Hunter's Mark spell prepared. You can cast it twice without expending a spell slot, regaining uses on a Long Rest.",
        level: 1,
      },
      {
        name: "weapon mastery",
        description:
          "Your training allows you to use the mastery properties of two kinds of weapons.",
        level: 1,
      },
      {
        name: "deft explorer",
        description:
          "You gain Expertise in two of your skill proficiencies. You also gain climbing and swimming speeds equal to your walking speed.",
        level: 1,
      },
      {
        name: "fighting style",
        description:
          "You gain a Fighting Style feat of your choice, specializing your combat approach.",
        level: 2,
      },
      {
        name: "extra attack",
        description:
          "You can attack twice instead of once whenever you take the Attack action on your turn.",
        level: 5,
      },
      {
        name: "roving",
        description:
          "Your Speed increases by 10 feet. You also gain climbing and swimming speeds equal to your Speed if you don't already have them.",
        level: 6,
      },
      {
        name: "tireless",
        description:
          "You can give yourself Temporary HP equal to 1d8 plus your Wisdom modifier a number of times equal to your Proficiency Bonus per Long Rest.",
        level: 10,
      },
      {
        name: "nature's veil",
        description:
          "You can take the Hide action as a Bonus Action. You can use this a number of times equal to your Proficiency Bonus per Long Rest.",
        level: 14,
      },
      {
        name: "feral senses",
        description: "You gain Blindsight with a range of 30 feet.",
        level: 18,
      },
      {
        name: "foe slayer",
        description:
          "Once on each of your turns, you can add your Wisdom modifier to an attack roll or damage roll you make against a creature marked by your Hunter's Mark.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "hunter",
        description:
          "Specialists in tracking and eliminating threats, these rangers hone techniques to take down dangerous prey and protect civilization from monstrous foes.",
        traits: [
          {
            name: "hunter's prey",
            description:
              "You gain one of the following features of your choice: Colossus Slayer (extra 1d8 damage to Bloodied creatures once per turn), Giant Killer (Reaction attack when Large+ creature misses you), or Horde Breaker (extra attack against creature within 5 feet of another target you hit).",
            level: 3,
          },
          {
            name: "hunter's lore",
            description:
              "You can use a Bonus Action to make an Intelligence (Nature) or Wisdom (Survival) check to reveal info about a creature you can see within 60 feet.",
            level: 3,
          },
          {
            name: "defensive tactics",
            description:
              "You gain one defensive feature: Escape the Horde (Opportunity Attacks have Disadvantage), Multiattack Defense (+4 AC vs remaining attacks after being hit), or Steel Will (Advantage on saves vs Frightened).",
            level: 7,
          },
          {
            name: "multiattack",
            description:
              "You gain one offensive feature: Volley (ranged attack vs all creatures in 10-foot radius), or Whirlwind Attack (melee attack vs all creatures within 5 feet).",
            level: 11,
          },
          {
            name: "superior hunter's defense",
            description:
              "You gain one ultimate defensive feature: Evasion, Stand Against the Tide (redirect missed melee attack to another creature), or Uncanny Dodge (use Reaction to halve damage from one attack).",
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
    description:
      "A scoundrel who uses stealth and trickery to overcome obstacles and enemies. Rogues rely on skill, stealth, and their foes' vulnerabilities to get the upper hand in any situation, having a knack for finding the solution to just about any problem.",
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
        name: "expertise",
        description: "You gain Expertise in two of your skill proficiencies of your choice.",
        level: 1,
      },
      {
        name: "sneak attack",
        description:
          "Once per turn, you can deal extra damage to one creature you hit with a Finesse or Ranged weapon if you have Advantage or an ally is within 5 feet of the target.",
        level: 1,
      },
      {
        name: "thieves' cant",
        description:
          "You know Thieves' Cant, a secret mix of dialect and jargon that allows you to hide messages in seemingly normal conversation.",
        level: 1,
      },
      {
        name: "weapon mastery",
        description:
          "Your training allows you to use the mastery properties of two kinds of weapons.",
        level: 1,
      },
      {
        name: "cunning action",
        description: "You can take a Bonus Action to Dash, Disengage, or Hide.",
        level: 2,
      },
      {
        name: "steady aim",
        description:
          "As a Bonus Action, you give yourself Advantage on your next attack roll if you haven't moved this turn.",
        level: 3,
      },
      {
        name: "uncanny dodge",
        description:
          "When an attacker you can see hits you, you can use your Reaction to halve the attack's damage against you.",
        level: 5,
      },
      {
        name: "evasion",
        description:
          "When subjected to an effect that allows a Dexterity saving throw for half damage, you take no damage on a success and half damage on a failure.",
        level: 7,
      },
      {
        name: "reliable talent",
        description:
          "Whenever you make an ability check using a skill or tool with which you have proficiency, you treat a d20 roll of 9 or lower as a 10.",
        level: 11,
      },
      {
        name: "blindsense",
        description: "You gain Blindsight with a range of 10 feet.",
        level: 14,
      },
      {
        name: "slippery mind",
        description: "You gain proficiency in Wisdom and Charisma saving throws.",
        level: 15,
      },
      {
        name: "elusive",
        description:
          "No attack roll has Advantage against you unless you have the Incapacitated condition.",
        level: 18,
      },
      {
        name: "stroke of luck",
        description:
          "If you miss an attack roll, you can turn it into a hit. Alternatively, if you fail an ability check, you can treat the d20 roll as a 20. Once used, you can't use it again until you finish a Short or Long Rest.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "thief",
        description:
          "Cunning opportunists who excel at using their environment to their advantage, these rogues are masters of infiltration, burglary, and exploiting magical items.",
        traits: [
          {
            name: "fast hands",
            description:
              "You can take a Bonus Action to make a Dexterity (Sleight of Hand) check, use Thieves' Tools to disarm a trap or open a lock, or take the Utilize action.",
            level: 3,
          },
          {
            name: "second-story work",
            description:
              "You gain a climbing speed equal to your Speed. When you take the Dash action, your jump distance increases by a number of feet equal to your Dexterity modifier.",
            level: 3,
          },
          {
            name: "supreme sneak",
            description:
              "You have Advantage on Dexterity (Stealth) checks if you move no more than half your Speed on the same turn.",
            level: 9,
          },
          {
            name: "use magic device",
            description:
              "You can attune to any magic item, and you ignore all class, species, and level requirements for using magic items.",
            level: 13,
          },
          {
            name: "thief's reflexes",
            description:
              "You can take two turns during the first round of any combat. You take your first turn at your normal Initiative and your second turn at your Initiative minus 10.",
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
            name: "spellcasting",
            description:
              "You gain the ability to cast wizard spells. Intelligence is your spellcasting ability. You learn cantrips and spells primarily from the enchantment and illusion schools.",
            level: 3,
          },
          {
            name: "mage hand legerdemain",
            description:
              "When you cast mage hand, you can make the spectral hand invisible and you can perform additional tasks with it: stow or retrieve an object from a container, pick locks and disarm traps with thieves' tools, or use an action to control the hand for one of these tasks. You can use the bonus action granted by Cunning Action to control the hand.",
            level: 3,
          },
          {
            name: "magical ambush",
            description:
              "If you are hidden from a creature when you cast a spell on it, the creature has disadvantage on any saving throw it makes against the spell this turn.",
            level: 9,
          },
          {
            name: "versatile trickster",
            description:
              "You gain the ability to distract targets with your mage hand. As a bonus action, you can designate a creature within 5 feet of the spectral hand. Doing so gives you advantage on attack rolls against that creature until the end of the turn.",
            level: 13,
          },
          {
            name: "spell thief",
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
    description:
      "A spellcaster who draws on inherent magic from a gift or bloodline. Sorcerers carry a magical birthright conferred upon them by an exotic bloodline, some otherworldly influence, or exposure to unknown cosmic forces, wielding raw magic with their very being.",
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
        name: "spellcasting",
        description:
          "You cast spells through innate magic using Charisma as your spellcasting ability. You can use an Arcane Focus as a spellcasting focus.",
        level: 1,
      },
      {
        name: "innate sorcery",
        description:
          "You can tap into your inner wellspring of magic. As a Bonus Action, you can expend a spell slot to boost one damage roll or healing roll of a spell you cast this turn by 1d4 per spell slot level.",
        level: 1,
      },
      {
        name: "font of magic",
        description:
          "You gain Sorcery Points equal to your Sorcerer level. You can transform Sorcery Points into spell slots and vice versa.",
        level: 2,
      },
      {
        name: "metamagic",
        description:
          "You gain two Metamagic options from a list that lets you twist spells to suit your needs, such as Careful Spell, Distant Spell, Extended Spell, and more.",
        level: 3,
      },
      {
        name: "sorcerous restoration",
        description:
          "When you finish a Short Rest, you can regain expended Sorcery Points equal to half your Sorcerer level (round down). Once used, you can't use it again until you finish a Long Rest.",
        level: 5,
      },
      {
        name: "sorcery incarnate",
        description:
          "If you have no uses of Innate Sorcery left when you roll Initiative, you regain one use.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "draconic sorcery",
        description:
          "Inheritors of draconic bloodlines whose magic crackles with the primal power of dragons, these sorcerers possess scales, claws, and destructive elemental fury.",
        traits: [
          {
            name: "draconic resilience",
            description:
              "Your Hit Point maximum increases by 1, and it increases by 1 again whenever you gain a Sorcerer level. Parts of you are also covered by dragon-like scales. While you aren't wearing armor, your base AC equals 10 plus your Dexterity and Charisma modifiers.",
            level: 1,
          },
          {
            name: "draconic ancestry",
            description:
              "You choose a type of dragon as your ancestor (such as Black, Blue, Gold, Red). You gain Resistance to the damage type associated with that dragon, and when you cast a spell that deals that damage type, you can add your Charisma modifier to one damage roll.",
            level: 1,
          },
          {
            name: "elemental affinity",
            description:
              "When you cast a spell that deals the damage type associated with your Draconic Ancestry, you can add your Charisma modifier to one damage roll of that spell.",
            level: 6,
          },
          {
            name: "dragon wings",
            description:
              "As a Bonus Action, you can sprout spectral dragon wings that last for 1 hour or until you retract them. While manifested, you have a Fly Speed equal to your Speed. You can use this a number of times equal to your Proficiency Bonus per Long Rest.",
            level: 14,
          },
          {
            name: "dragon companion",
            description:
              "You can cast Summon Dragon without Material components. Once you do so, you can't do it again until you finish a Long Rest. You can also cast it using spell slots you have.",
            level: 14,
          },
        ],
      },
    ],
    subclassLevel: 1,
    spellcasting: { enabled: true, kind: "full", ability: "charisma", changePrepared: "levelup" },
  },
  warlock: {
    name: "warlock",
    description:
      "A wielder of magic that is derived from a bargain with an extraplanar entity. Warlocks are seekers of the knowledge that lies hidden in the fabric of the multiverse, piecing together arcane secrets to bolster their own power through pacts with mysterious beings.",
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
        name: "spellcasting",
        description:
          "You cast spells through your pact with an otherworldly patron using Charisma as your spellcasting ability. You can use an Arcane Focus as a spellcasting focus.",
        level: 1,
      },
      {
        name: "pact magic",
        description:
          "Your spellcasting uses Pact Magic: you have a small number of spell slots that are all the same level, but you regain them all on a Short or Long Rest.",
        level: 1,
      },
      {
        name: "eldritch invocations",
        description:
          "You gain two Eldritch Invocations of your choice, such as Agonizing Blast, Armor of Shadows, or Devil's Sight. You gain more invocations as you level.",
        level: 2,
      },
      {
        name: "magical cunning",
        description:
          "You can perform a 1-minute ritual to regain expended Pact Magic spell slots. The number of slots equals half your maximum (round up). Once used, you can't use it again until you finish a Long Rest.",
        level: 2,
      },
      {
        name: "pact boon",
        description:
          "You gain a boon from your patron: Pact of the Blade (summon a pact weapon), Pact of the Chain (gain a special familiar), or Pact of the Tome (gain a grimoire with cantrips).",
        level: 3,
      },
      {
        name: "contact patron",
        description:
          "You can cast Divination or Contact Other Plane (contacting your patron) without Material components. Once used, you can't use it again until you finish a Long Rest.",
        level: 5,
      },
      {
        name: "mystic arcanum",
        description:
          "Your patron grants you a 6th-level spell that you can cast once per Long Rest without expending a spell slot. You gain 7th, 8th, and 9th level spells at later levels.",
        level: 11,
      },
      {
        name: "eldritch master",
        description:
          "As a Magic action, you can regain all expended Pact Magic spell slots. Once used, you can't use it again until you finish a Long Rest.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "fiend patron",
        description:
          "Warlocks bound to powerful beings from the Lower Planes, channeling infernal power to incinerate foes and fortify themselves with dark blessings.",
        traits: [
          {
            name: "dark one's blessing",
            description:
              "When you reduce a creature to 0 HP, you gain Temporary HP equal to your Charisma modifier plus your Warlock level (minimum of 1).",
            level: 1,
          },
          {
            name: "fiend spells",
            description:
              "You always have certain spells prepared: Burning Hands, Command, Scorching Ray, Suggestion, Fireball, and more as you level.",
            level: 1,
          },
          {
            name: "dark one's own luck",
            description:
              "When you make an ability check or saving throw, you can add a d10 to your roll. You can use this a number of times equal to your Charisma modifier per Long Rest.",
            level: 6,
          },
          {
            name: "fiendish resilience",
            description:
              "You can choose one damage type at the end of a Short or Long Rest. You gain Resistance to that damage type until you choose a different one.",
            level: 10,
          },
          {
            name: "hurl through hell",
            description:
              "When you hit a creature with an attack roll, you can send it to the Lower Planes until the end of your next turn. When it returns, it takes 8d10 Psychic damage if it's not a Fiend. Once used, you can't use it again until you finish a Long Rest.",
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
    description:
      "A scholarly magic-user capable of manipulating the structures of reality. Wizards are supreme magic-users, defined and united by the spells they cast, drawing on the subtle weave of magic through scholarly study and dedication to unravel arcane mysteries.",
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
        name: "spellcasting",
        description:
          "You cast spells through arcane study using Intelligence as your spellcasting ability. You can use an Arcane Focus as a spellcasting focus.",
        level: 1,
      },
      {
        name: "ritual adept",
        description:
          "You can cast spells as Rituals if they have the Ritual tag and are in your spellbook. You don't need to have them prepared.",
        level: 1,
      },
      {
        name: "arcane recovery",
        description:
          "Once per day when you finish a Short Rest, you can recover expended spell slots with a combined level equal to or less than half your Wizard level (round up).",
        level: 1,
      },
      {
        name: "scholar",
        description:
          "You gain proficiency in one skill or tool of your choice from the Wizard's skill list.",
        level: 2,
      },
      {
        name: "memorize spell",
        description:
          "You can memorize a spell in your spellbook. While memorized, you always have that spell prepared, but it doesn't count against your prepared spells. You can change which spell is memorized when you finish a Long Rest.",
        level: 5,
      },
      {
        name: "spell mastery",
        description:
          "Choose a level 1 and a level 2 spell in your spellbook that have a casting time of an Action. You can cast them at their lowest level without expending a spell slot.",
        level: 18,
      },
      {
        name: "signature spells",
        description:
          "Choose two level 3 spells in your spellbook as signature spells. You always have them prepared, and you can cast each once per Long Rest without expending a spell slot.",
        level: 20,
      },
    ],
    subclasses: [
      {
        name: "evoker",
        description:
          "Wielders of raw magical energy who sculpt destructive forces with precision, these wizards are masters of evocation spells that blast, burn, and devastate their enemies.",
        traits: [
          {
            name: "evocation savant",
            description:
              "Copying an Evocation spell into your spellbook takes half the time and gold normally required.",
            level: 2,
          },
          {
            name: "potent cantrip",
            description:
              "When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip's damage (if any) but suffers no additional effect.",
            level: 2,
          },
          {
            name: "sculpt spells",
            description:
              "When you cast an Evocation spell that forces other creatures to make a saving throw, you can choose a number of them equal to 1 plus the spell's level. The chosen creatures automatically succeed on their saves and take no damage if they would normally take half damage.",
            level: 6,
          },
          {
            name: "empowered evocation",
            description:
              "When you cast a Wizard Evocation spell, you can add your Intelligence modifier to one damage roll of that spell.",
            level: 10,
          },
          {
            name: "overchannel",
            description:
              "When you cast a Wizard spell of level 1-5 that deals damage, you can deal maximum damage with that spell. After the first use, each subsequent use before a Long Rest deals 2d12 Necrotic damage to you per spell level.",
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
const SubclassNames = Object.values(Classes).flatMap((c) =>
  c.subclasses ? c.subclasses.map((sc) => sc.name) : []
)

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
        3,  4,  4,  4,  5,  6,  6,  7, // 3-10
  8, 8, 9, 10, 10, 11, 11, 11, 12, 13, // 11-20
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
  id: SRD52_ID,
  description: SRD52_DESCRIPTION,
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

  maxSpellsPrepared(className: ClassNameType, level: number, _abilityModifier: number): number {
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

    if (["fighter", "rogue"].includes(className)) {
      return THIRD_CASTER_SPELLS_PREPARED[level] || 0
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
