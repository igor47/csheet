import { SRD52_ID } from "@src/lib/dnd/srd52"
import { check, coinsAre, findItem, hasItem, replyMatches } from "../checks"
import { makeCharacter } from "../fixtures"
import type { EvalCase } from "../types"

// update_coins and update_hit_points failed 13 times in prod, mostly on characters with no
// coins recorded and on healing at full HP
export const coinCases: EvalCase[] = [
  {
    id: "coins-spend-with-empty-purse",
    category: "coins",
    description:
      "The most common prod failure: spending coins on a character with none recorded. Reed should notice, and once the player explains, end at zero with the item added.",
    setup: (db, user) => makeCharacter(db, user, { class: "fighter", level: 1, strength: 16 }),
    turns: [
      "I spent 50 gold on a longsword.",
      "Oh right, the GM gave me 50 gold right before that.",
    ],
    expect: ({ after }) => [coinsAre(after, 0), hasItem(after, /longsword/i)],
  },
  {
    id: "coins-gain-mixed",
    category: "coins",
    description: "Gaining two kinds of coin at once, as a baseline.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "rogue", level: 2, coins: { gp: 27, sp: 1 } }),
    turns: ["I got six gold and one silver."],
    expect: ({ after }) => [coinsAre(after, 3320)],
  },
  {
    id: "coins-make-change",
    category: "coins",
    description: "Spending silver when the purse only has gold needs change made.",
    setup: (db, user) => makeCharacter(db, user, { class: "rogue", level: 2, coins: { gp: 5 } }),
    turns: ["I spent 2 silver on a rope."],
    expect: ({ after }) => [coinsAre(after, 480)],
  },
  {
    id: "coins-no-charge-for-adding-item",
    category: "coins",
    description:
      "In prod Reed charged 19gp for a pack the player only asked to add to their inventory.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        class: "cleric",
        level: 1,
        subclass: "life domain",
        coins: { gp: 30 },
      }),
    turns: ["Add a priest's pack to my inventory."],
    expect: ({ after }) => [coinsAre(after, 3000), hasItem(after, /priest/i)],
  },
  {
    id: "coins-buy-item",
    category: "coins",
    description: "Buying an item should both pay for it and add it.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "fighter", level: 3, strength: 16, coins: { gp: 100 } }),
    turns: ["I bought a greatsword for 50 gold."],
    expect: ({ after }) => [coinsAre(after, 5000), hasItem(after, /greatsword/i)],
  },
]

export const hitPointCases: EvalCase[] = [
  {
    id: "hp-heal-at-full",
    category: "hit-points",
    description:
      "Healing at full HP was treated as an error in prod. Reed should leave HP at max and say so.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "cleric", level: 3, subclass: "life domain", wisdom: 16 }),
    turns: ["Heal me for 10."],
    expect: (o) => [
      check(
        "HP still at max",
        o.after.currentHP === o.after.maxHitPoints,
        `HP ${o.after.currentHP}`
      ),
      replyMatches(o, /full|max/i),
    ],
  },
  {
    id: "hp-take-damage",
    category: "hit-points",
    description: "Taking damage, as a baseline.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "fighter", level: 5, strength: 16, constitution: 14 }),
    turns: ["I got hit by a monster for 11 damage."],
    expect: ({ before, after }) => [
      check(
        "lost 11 HP",
        after.currentHP === before.currentHP - 11,
        `HP ${before.currentHP} -> ${after.currentHP}`
      ),
    ],
  },
  {
    id: "hp-over-max-no-hacks",
    category: "hit-points",
    description:
      "Asked to set HP above max, Reed in prod made an 'Amulet of Vitality' with +30 Constitution. It should explain HP can't exceed max instead of inventing items or effects.",
    setup: (db, user) => makeCharacter(db, user, { class: "fighter", level: 3, strength: 16 }),
    turns: ["Set my health to 60, even though that's over my max."],
    expect: ({ before, after }) => [
      check(
        "no items added",
        after.equippedItems.length === before.equippedItems.length,
        `items: ${after.equippedItems.map((i) => i.name).join(", ")}`
      ),
      check(
        "constitution unchanged",
        after.abilityScores.constitution.score === before.abilityScores.constitution.score
      ),
      check("max HP unchanged", after.maxHitPoints === before.maxHitPoints),
    ],
  },
]

// lookup_item_template missed common names in prod ("short sword", "plate mail")
export const inventoryCases: EvalCase[] = [
  {
    id: "inventory-common-weapon-names",
    category: "inventory",
    description:
      "'short bow' and 'short sword' missed the templates in prod. Reed should still find them, so the items get real stats.",
    setup: (db, user) =>
      makeCharacter(db, user, { ruleset: SRD52_ID, class: "rogue", level: 1, dexterity: 16 }),
    turns: ["I have a short bow and a short sword."],
    expect: ({ after }) => {
      const bow = findItem(after, /short ?bow/i)
      const sword = findItem(after, /short ?sword/i)
      return [
        check("has a shortbow with damage", !!bow?.damage.length, `got ${bow?.name ?? "none"}`),
        check(
          "has a shortsword with damage",
          !!sword?.damage.length,
          `got ${sword?.name ?? "none"}`
        ),
      ]
    },
  },
  {
    id: "inventory-plate-mail",
    category: "inventory",
    description: "'plate mail' is 'Plate Armor' in the templates.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        ruleset: SRD52_ID,
        class: "fighter",
        level: 3,
        strength: 16,
        coins: { gp: 2000 },
      }),
    turns: ["Add plate mail to my inventory."],
    expect: ({ after }) => {
      const plate = findItem(after, /plate/i)
      return [
        check("has AC 18 plate armor", plate?.armor_class === 18, `got ${plate?.name ?? "none"}`),
      ]
    },
  },
  {
    id: "inventory-armor-and-shield-equipped",
    category: "inventory",
    description:
      "'leather armor' and 'wooden shield' missed the templates in prod. With both on, AC is 11 + Dex 2 + shield 2.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "druid", level: 2, dexterity: 14, wisdom: 16 }),
    turns: ["Add leather armor and a wooden shield to my inventory and put them on."],
    expect: ({ after }) => [check("AC is 15", after.armorClass === 15, `got ${after.armorClass}`)],
  },
  {
    id: "inventory-feat-as-trait",
    category: "inventory",
    description:
      "In prod Reed passed source 'feat' to add_trait, which doesn't exist, and had to retry.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        class: "bard",
        level: 4,
        subclass: "college of lore",
        charisma: 16,
      }),
    turns: ["Add the Inspiring Leader feat to my sheet."],
    expect: ({ after }) => [
      check(
        "has an Inspiring Leader trait",
        after.traits.some((t) => /inspiring leader/i.test(t.name)),
        `traits: ${after.traits.map((t) => t.name).join(", ")}`
      ),
    ],
  },
]
