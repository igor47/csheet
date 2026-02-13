import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { SRD51, SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52, SRD52_ID } from "@src/lib/dnd/srd52"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { addLevel } from "./addLevel"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"
import { type CreateCharacterResult, createCharacter } from "./createCharacter"

/**
 * Type-safe assertion for CreateCharacterResult success
 * Throws a helpful error with details if the result indicates failure
 */
function assertSuccess(result: CreateCharacterResult): asserts result is {
  complete: true
  character: ReturnType<typeof createCharacter> extends Promise<infer R>
    ? R extends { complete: true; character: infer C }
      ? C
      : never
    : never
} {
  if (!result.complete) {
    const errorDetails = Object.entries(result.errors)
      .map(([field, message]) => `  ${field}: ${message}`)
      .join("\n")

    throw new Error(
      `Expected result.complete to be true, but got false.\n` +
        `Errors:\n${errorDetails}\n` +
        `Values: ${JSON.stringify(result.values, null, 2)}`
    )
  }
  expect(result.complete).toBe(true)
}

/**
 * Helper to create and add levels to a character
 */
async function createCharacterWithLevels(
  db: any,
  user: User,
  baseClass: string,
  subclass: string | null,
  levels: Array<{
    class: string
    subclass?: string | null
    hitDieRoll?: number
  }>
): Promise<Character> {
  // Create level 1 character
  const result = await createCharacter(db, user, {
    name: "Test Character",
    species: "human",
    lineage: undefined,
    class: baseClass,
    subclass,
    background: "acolyte",
    alignment: "Neutral Good",
    ruleset: SRD51_ID,
  })
  assertSuccess(result)

  const char = result.character

  // Add additional levels
  for (const levelData of levels) {
    const classDef = SRD51.classes[levelData.class]
    const hitDie = classDef.hitDie
    const hitDieRoll = levelData.hitDieRoll || hitDie

    const addResult = await addLevel(db, char, {
      character_id: char.id,
      class: levelData.class,
      level: "0", // Not used by addLevel
      subclass: levelData.subclass !== undefined ? levelData.subclass || "" : "",
      hit_die_roll: hitDieRoll.toString(),
      note: "",
    })

    if (!addResult.complete) {
      throw new Error(
        `Failed to add level: ${JSON.stringify(addResult.errors)}`
      )
    }
  }

  return char
}

describe("computeCharacter", () => {
  const testCtx = useTestApp()

  describe("Full Casters", () => {
    describe("Wizard", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has correct cantrip count", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.cantripSlots.length).toBe(3)
        })

        test("has d6 hit die", () => {
          expect(computed?.hitDice).toEqual([6])
        })

        test("has spellcasting trait", () => {
          const spellcastingTrait = computed?.traits.find(
            (t) => t.name === "spellcasting" && t.source === "class"
          )
          expect(spellcastingTrait).toBeTruthy()
          expect(spellcastingTrait?.source_detail).toBe("wizard")
        })
      })

      describe("at level 3", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            [{ class: "wizard", subclass: "evocation" }, { class: "wizard", subclass: "evocation" }]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 2, 2, 2, 2])
        })

        test("has correct cantrip count", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.cantripSlots.length).toBe(3)
        })

        test("has 3 d6 hit dice", () => {
          expect(computed?.hitDice).toEqual([6, 6, 6])
        })

        test("has max spell level 2", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.maxSpellLevel).toBe(2)
        })
      })

      describe("at level 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            [
              { class: "wizard", subclass: "evocation" },
              { class: "wizard", subclass: "evocation" },
              { class: "wizard", subclass: "evocation" },
              { class: "wizard", subclass: "evocation" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
        })

        test("has correct cantrip count", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.cantripSlots.length).toBe(4)
        })

        test("has max spell level 3", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.maxSpellLevel).toBe(3)
        })
      })

      describe("at level 9", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            Array(8).fill({ class: "wizard", subclass: "evocation" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
          ])
        })

        test("has max spell level 5", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.maxSpellLevel).toBe(5)
        })
      })

      describe("at level 17", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            Array(16).fill({ class: "wizard", subclass: "evocation" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
            6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9,
          ])
        })

        test("has max spell level 9", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.maxSpellLevel).toBe(9)
        })

        test("has correct cantrip count", () => {
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          expect(wizardSpells?.cantripSlots.length).toBe(5)
        })
      })
    })

    describe("Cleric", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "cleric",
            "life domain",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has correct cantrip count", () => {
          const clericSpells = computed?.spells.find((s) => s.class === "cleric")
          expect(clericSpells?.cantripSlots.length).toBe(3)
        })

        test("has d8 hit die", () => {
          expect(computed?.hitDice).toEqual([8])
        })

        test("has wisdom as spellcasting ability", () => {
          const clericSpells = computed?.spells.find((s) => s.class === "cleric")
          expect(clericSpells?.ability).toBe("wisdom")
        })
      })

      describe("at level 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "cleric",
            "life domain",
            Array(4).fill({ class: "cleric", subclass: "life domain" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
        })

        test("has destroy undead trait", () => {
          const destroyUndead = computed?.traits.find(
            (t) => t.name === "destroy undead"
          )
          expect(destroyUndead).toBeTruthy()
          expect(destroyUndead?.level).toBe(5)
        })
      })
    })

    describe("Sorcerer", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "sorcerer",
            "draconic bloodline",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has d6 hit die", () => {
          expect(computed?.hitDice).toEqual([6])
        })

        test("has charisma as spellcasting ability", () => {
          const sorcererSpells = computed?.spells.find((s) => s.class === "sorcerer")
          expect(sorcererSpells?.ability).toBe("charisma")
        })
      })

      describe("at level 3", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "sorcerer",
            "draconic bloodline",
            Array(2).fill({ class: "sorcerer", subclass: "draconic bloodline" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 2, 2, 2, 2])
        })

        test("has metamagic trait", () => {
          const metamagic = computed?.traits.find((t) => t.name === "metamagic")
          expect(metamagic).toBeTruthy()
          expect(metamagic?.level).toBe(3)
        })
      })
    })

    describe("Druid", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 2", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "druid",
            "circle of the land",
            [{ class: "druid", subclass: "circle of the land" }]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2])
        })

        test("has wild shape trait", () => {
          const wildShape = computed?.traits.find((t) => t.name === "wild shape")
          expect(wildShape).toBeTruthy()
          expect(wildShape?.level).toBe(2)
        })

        test("has d8 hit dice", () => {
          expect(computed?.hitDice).toEqual([8, 8])
        })
      })
    })

    describe("Bard", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "bard",
            "college of lore",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has d8 hit die", () => {
          expect(computed?.hitDice).toEqual([8])
        })

        test("has charisma as spellcasting ability", () => {
          const bardSpells = computed?.spells.find((s) => s.class === "bard")
          expect(bardSpells?.ability).toBe("charisma")
        })
      })

      describe("at level 10", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "bard",
            "college of lore",
            Array(9).fill({ class: "bard", subclass: "college of lore" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
            5, 5,
          ])
        })

        test("has correct cantrip count", () => {
          const bardSpells = computed?.spells.find((s) => s.class === "bard")
          expect(bardSpells?.cantripSlots.length).toBe(4)
        })
      })
    })
  })

  describe("Half Casters", () => {
    describe("Paladin", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has no spell slots", () => {
          expect(computed?.spellSlots).toEqual([])
        })

        test("has d10 hit die", () => {
          expect(computed?.hitDice).toEqual([10])
        })

        test("has lay on hands trait", () => {
          const layOnHands = computed?.traits.find((t) => t.name === "lay on hands")
          expect(layOnHands).toBeTruthy()
          expect(layOnHands?.level).toBe(1)
        })
      })

      describe("at level 2", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            [{ class: "paladin", subclass: "oath of devotion" }]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has charisma as spellcasting ability", () => {
          const paladinSpells = computed?.spells.find((s) => s.class === "paladin")
          expect(paladinSpells?.ability).toBe("charisma")
        })

        test("has no cantrips", () => {
          const paladinSpells = computed?.spells.find((s) => s.class === "paladin")
          expect(paladinSpells?.cantripSlots.length).toBe(0)
        })
      })

      describe("at level 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            Array(4).fill({ class: "paladin", subclass: "oath of devotion" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 2, 2, 2, 2])
        })

        test("has max spell level 2", () => {
          const paladinSpells = computed?.spells.find((s) => s.class === "paladin")
          expect(paladinSpells?.maxSpellLevel).toBe(2)
        })
      })

      describe("at level 9", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            Array(8).fill({ class: "paladin", subclass: "oath of devotion" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
        })

        test("has max spell level 3", () => {
          const paladinSpells = computed?.spells.find((s) => s.class === "paladin")
          expect(paladinSpells?.maxSpellLevel).toBe(3)
        })
      })

      describe("at level 17", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            Array(16).fill({ class: "paladin", subclass: "oath of devotion" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5,
          ])
        })

        test("has max spell level 5", () => {
          const paladinSpells = computed?.spells.find((s) => s.class === "paladin")
          expect(paladinSpells?.maxSpellLevel).toBe(5)
        })
      })
    })

    describe("Ranger", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "ranger",
            "hunter",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has no spell slots", () => {
          expect(computed?.spellSlots).toEqual([])
        })

        test("has d10 hit die", () => {
          expect(computed?.hitDice).toEqual([10])
        })

        test("has favored enemy trait", () => {
          const favoredEnemy = computed?.traits.find((t) => t.name === "favored enemy")
          expect(favoredEnemy).toBeTruthy()
        })
      })

      describe("at level 2", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "ranger",
            "hunter",
            [{ class: "ranger", subclass: "hunter" }]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has wisdom as spellcasting ability", () => {
          const rangerSpells = computed?.spells.find((s) => s.class === "ranger")
          expect(rangerSpells?.ability).toBe("wisdom")
        })
      })

      describe("at level 13", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "ranger",
            "hunter",
            Array(12).fill({ class: "ranger", subclass: "hunter" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4,
          ])
        })

        test("has max spell level 4", () => {
          const rangerSpells = computed?.spells.find((s) => s.class === "ranger")
          expect(rangerSpells?.maxSpellLevel).toBe(4)
        })
      })
    })
  })

  describe("Third Casters (subclass-dependent)", () => {
    describe("Eldritch Knight (Fighter subclass)", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 3", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "fighter",
            null,
            [
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: "eldritch knight" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has correct cantrip count", () => {
          const fighterSpells = computed?.spells.find((s) => s.class === "fighter")
          expect(fighterSpells?.cantripSlots.length).toBe(2)
        })

        test("has d10 hit dice", () => {
          expect(computed?.hitDice).toEqual([10, 10, 10])
        })

        test("has intelligence as spellcasting ability", () => {
          const fighterSpells = computed?.spells.find((s) => s.class === "fighter")
          expect(fighterSpells?.ability).toBe("intelligence")
        })
      })

      describe("at level 7", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "fighter",
            null,
            [
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: "eldritch knight" },
              { class: "fighter", subclass: "eldritch knight" },
              { class: "fighter", subclass: "eldritch knight" },
              { class: "fighter", subclass: "eldritch knight" },
              { class: "fighter", subclass: "eldritch knight" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 2, 2, 2, 2])
        })

        test("has max spell level 2", () => {
          const fighterSpells = computed?.spells.find((s) => s.class === "fighter")
          expect(fighterSpells?.maxSpellLevel).toBe(2)
        })

        test("has war magic trait", () => {
          const warMagic = computed?.traits.find((t) => t.name === "war magic")
          expect(warMagic).toBeTruthy()
          expect(warMagic?.level).toBe(7)
        })
      })

      describe("at level 19", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "fighter",
            null,
            [
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: "eldritch knight" },
              ...Array(16).fill({ class: "fighter", subclass: "eldritch knight" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
          ])
        })

        test("has max spell level 4", () => {
          const fighterSpells = computed?.spells.find((s) => s.class === "fighter")
          expect(fighterSpells?.maxSpellLevel).toBe(4)
        })
      })
    })

    describe("Arcane Trickster (Rogue subclass)", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 3", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "rogue",
            null,
            [
              { class: "rogue", subclass: null },
              { class: "rogue", subclass: "arcane trickster" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1])
        })

        test("has correct cantrip count", () => {
          const rogueSpells = computed?.spells.find((s) => s.class === "rogue")
          expect(rogueSpells?.cantripSlots.length).toBe(3)
        })

        test("has d8 hit dice", () => {
          expect(computed?.hitDice).toEqual([8, 8, 8])
        })

        test("has intelligence as spellcasting ability", () => {
          const rogueSpells = computed?.spells.find((s) => s.class === "rogue")
          expect(rogueSpells?.ability).toBe("intelligence")
        })

        test("has mage hand legerdemain trait", () => {
          const mageHand = computed?.traits.find(
            (t) => t.name === "mage hand legerdemain"
          )
          expect(mageHand).toBeTruthy()
          expect(mageHand?.level).toBe(3)
        })
      })

      describe("at level 10", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "rogue",
            null,
            [
              { class: "rogue", subclass: null },
              { class: "rogue", subclass: "arcane trickster" },
              ...Array(7).fill({ class: "rogue", subclass: "arcane trickster" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 2, 2, 2, 2])
        })

        test("has max spell level 2", () => {
          const rogueSpells = computed?.spells.find((s) => s.class === "rogue")
          expect(rogueSpells?.maxSpellLevel).toBe(2)
        })
      })

      describe("at level 20", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "rogue",
            null,
            [
              { class: "rogue", subclass: null },
              { class: "rogue", subclass: "arcane trickster" },
              ...Array(17).fill({ class: "rogue", subclass: "arcane trickster" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has correct spell slots", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
          ])
        })

        test("has max spell level 4", () => {
          const rogueSpells = computed?.spells.find((s) => s.class === "rogue")
          expect(rogueSpells?.maxSpellLevel).toBe(4)
        })
      })
    })

    describe("Champion Fighter (no spellcasting)", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 3", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "fighter",
            null,
            [
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: "champion" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has no spell slots", () => {
          expect(computed?.spellSlots).toEqual([])
        })

        test("has no spell info", () => {
          const fighterSpells = computed?.spells.find((s) => s.class === "fighter")
          expect(fighterSpells).toBeFalsy()
        })

        test("has improved critical trait", () => {
          const improvedCritical = computed?.traits.find(
            (t) => t.name === "improved critical"
          )
          expect(improvedCritical).toBeTruthy()
        })
      })
    })
  })

  describe("Warlock (Pact Magic)", () => {
    let user: User
    let character: Character
    let computed: ComputedCharacter | null

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("at level 1", () => {
      beforeEach(async () => {
        character = await createCharacterWithLevels(
          testCtx.db,
          user,
          "warlock",
          "the fiend",
          []
        )
        computed = await computeCharacter(testCtx.db, character.id)
      })

      test("has pact magic slots, not regular spell slots", () => {
        expect(computed?.spellSlots).toEqual([])
        expect(computed?.pactMagicSlots).toEqual([1])
      })

      test("has d8 hit die", () => {
        expect(computed?.hitDice).toEqual([8])
      })

      test("has correct cantrip count", () => {
        const warlockSpells = computed?.spells.find((s) => s.class === "warlock")
        expect(warlockSpells?.cantripSlots.length).toBe(2)
      })

      test("has charisma as spellcasting ability", () => {
        const warlockSpells = computed?.spells.find((s) => s.class === "warlock")
        expect(warlockSpells?.ability).toBe("charisma")
      })
    })

    describe("at level 2", () => {
      beforeEach(async () => {
        character = await createCharacterWithLevels(
          testCtx.db,
          user,
          "warlock",
          "the fiend",
          [{ class: "warlock", subclass: "the fiend" }]
        )
        computed = await computeCharacter(testCtx.db, character.id)
      })

      test("has 2 pact magic slots", () => {
        expect(computed?.pactMagicSlots).toEqual([1, 1])
      })

      test("has eldritch invocations trait", () => {
        const invocations = computed?.traits.find(
          (t) => t.name === "eldritch invocations"
        )
        expect(invocations).toBeTruthy()
      })
    })

    describe("at level 5", () => {
      beforeEach(async () => {
        character = await createCharacterWithLevels(
          testCtx.db,
          user,
          "warlock",
          "the fiend",
          Array(4).fill({ class: "warlock", subclass: "the fiend" })
        )
        computed = await computeCharacter(testCtx.db, character.id)
      })

      test("has 3rd level pact magic slots", () => {
        expect(computed?.pactMagicSlots).toEqual([3, 3])
      })
    })

    describe("at level 11", () => {
      beforeEach(async () => {
        character = await createCharacterWithLevels(
          testCtx.db,
          user,
          "warlock",
          "the fiend",
          Array(10).fill({ class: "warlock", subclass: "the fiend" })
        )
        computed = await computeCharacter(testCtx.db, character.id)
      })

      test("has three 5th level pact magic slots", () => {
        expect(computed?.pactMagicSlots).toEqual([5, 5, 5])
      })

      test("has mystic arcanum trait", () => {
        const mysticArcanum = computed?.traits.find(
          (t) => t.name === "mystic arcanum (6th level)"
        )
        expect(mysticArcanum).toBeTruthy()
      })
    })

    describe("at level 17", () => {
      beforeEach(async () => {
        character = await createCharacterWithLevels(
          testCtx.db,
          user,
          "warlock",
          "the fiend",
          Array(16).fill({ class: "warlock", subclass: "the fiend" })
        )
        computed = await computeCharacter(testCtx.db, character.id)
      })

      test("has four 5th level pact magic slots", () => {
        expect(computed?.pactMagicSlots).toEqual([5, 5, 5, 5])
      })
    })
  })

  describe("Non-Spellcaster Classes", () => {
    describe("Barbarian", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "barbarian",
            "path of the berserker",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has no spell slots", () => {
          expect(computed?.spellSlots).toEqual([])
        })

        test("has d12 hit die", () => {
          expect(computed?.hitDice).toEqual([12])
        })

        test("has rage trait", () => {
          const rage = computed?.traits.find((t) => t.name === "rage")
          expect(rage).toBeTruthy()
          expect(rage?.level).toBe(1)
        })

        test("has unarmored defense trait", () => {
          const unarmoredDefense = computed?.traits.find(
            (t) => t.name === "unarmored defense"
          )
          expect(unarmoredDefense).toBeTruthy()
        })
      })

      describe("at level 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "barbarian",
            "path of the berserker",
            Array(4).fill({ class: "barbarian", subclass: "path of the berserker" })
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has 5 d12 hit dice", () => {
          expect(computed?.hitDice).toEqual([12, 12, 12, 12, 12])
        })

        test("has extra attack trait", () => {
          const extraAttack = computed?.traits.find((t) => t.name === "extra attack")
          expect(extraAttack).toBeTruthy()
          expect(extraAttack?.level).toBe(5)
        })
      })
    })

    describe("Monk", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "monk",
            "way of the open hand",
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has d8 hit die", () => {
          expect(computed?.hitDice).toEqual([8])
        })

        test("has unarmored defense trait", () => {
          const unarmoredDefense = computed?.traits.find(
            (t) => t.name === "unarmored defense"
          )
          expect(unarmoredDefense).toBeTruthy()
        })

        test("has martial arts trait", () => {
          const martialArts = computed?.traits.find((t) => t.name === "martial arts")
          expect(martialArts).toBeTruthy()
        })
      })

      describe("at level 2", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "monk",
            "way of the open hand",
            [{ class: "monk", subclass: "way of the open hand" }]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has ki trait", () => {
          const ki = computed?.traits.find((t) => t.name === "ki")
          expect(ki).toBeTruthy()
          expect(ki?.level).toBe(2)
        })
      })
    })

    describe("Fighter (non-Eldritch Knight)", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "fighter",
            null,
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has d10 hit die", () => {
          expect(computed?.hitDice).toEqual([10])
        })

        test("has fighting style trait", () => {
          const fightingStyle = computed?.traits.find((t) => t.name === "fighting style")
          expect(fightingStyle).toBeTruthy()
        })

        test("has second wind trait", () => {
          const secondWind = computed?.traits.find((t) => t.name === "second wind")
          expect(secondWind).toBeTruthy()
        })
      })
    })

    describe("Rogue (non-Arcane Trickster)", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("at level 1", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "rogue",
            null,
            []
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has d8 hit die", () => {
          expect(computed?.hitDice).toEqual([8])
        })

        test("has sneak attack trait", () => {
          const sneakAttack = computed?.traits.find((t) => t.name === "sneak attack")
          expect(sneakAttack).toBeTruthy()
        })

        test("has thieves' cant trait", () => {
          const thievesCant = computed?.traits.find((t) => t.name === "thieves' cant")
          expect(thievesCant).toBeTruthy()
        })
      })

      describe("at level 3 Thief", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "rogue",
            null,
            [
              { class: "rogue", subclass: null },
              { class: "rogue", subclass: "thief" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has no spell slots", () => {
          expect(computed?.spellSlots).toEqual([])
        })

        test("has fast hands trait", () => {
          const fastHands = computed?.traits.find((t) => t.name === "fast hands")
          expect(fastHands).toBeTruthy()
          expect(fastHands?.source).toBe("subclass")
        })
      })
    })
  })

  describe("Multiclassing", () => {
    describe("Full caster + Full caster", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Wizard 3 / Cleric 2", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            [
              { class: "wizard", subclass: "evocation" },
              { class: "wizard", subclass: "evocation" },
              { class: "cleric", subclass: "life domain" },
              { class: "cleric", subclass: "life domain" },
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 5 full caster", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
        })

        test("has two class entries", () => {
          expect(computed?.classes).toHaveLength(2)
          expect(computed?.classes.find((c) => c.class === "wizard")?.level).toBe(3)
          expect(computed?.classes.find((c) => c.class === "cleric")?.level).toBe(2)
        })

        test("has total level 5", () => {
          expect(computed?.totalLevel).toBe(5)
        })

        test("has proficiency bonus +3", () => {
          expect(computed?.proficiencyBonus).toBe(3)
        })

        test("has spells for both classes", () => {
          expect(computed?.spells).toHaveLength(2)
          const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
          const clericSpells = computed?.spells.find((s) => s.class === "cleric")
          expect(wizardSpells).toBeTruthy()
          expect(clericSpells).toBeTruthy()
        })

        test("has mixed hit dice", () => {
          expect(computed?.hitDice).toEqual([6, 6, 6, 8, 8])
        })
      })

      describe("Sorcerer 5 / Bard 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "sorcerer",
            "draconic bloodline",
            [
              ...Array(4).fill({ class: "sorcerer", subclass: "draconic bloodline" }),
              ...Array(5).fill({ class: "bard", subclass: "college of lore" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 10 full caster", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
            5, 5,
          ])
        })

        test("has total level 10", () => {
          expect(computed?.totalLevel).toBe(10)
        })

        test("has proficiency bonus +4", () => {
          expect(computed?.proficiencyBonus).toBe(4)
        })
      })
    })

    describe("Full caster + Half caster", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Wizard 5 / Paladin 4", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            [
              ...Array(4).fill({ class: "wizard", subclass: "evocation" }),
              ...Array(4).fill({ class: "paladin", subclass: "oath of devotion" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 7 full caster (5 + floor(4/2))", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4,
          ])
        })

        test("has total level 9", () => {
          expect(computed?.totalLevel).toBe(9)
        })

        test("has spells for both classes", () => {
          expect(computed?.spells).toHaveLength(2)
        })

        test("has mixed hit dice", () => {
          expect(computed?.hitDice).toEqual([6, 6, 6, 6, 6, 10, 10, 10, 10])
        })
      })

      describe("Cleric 8 / Ranger 3", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "cleric",
            "life domain",
            [
              ...Array(7).fill({ class: "cleric", subclass: "life domain" }),
              ...Array(3).fill({ class: "ranger", subclass: "hunter" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 9 full caster (8 + floor(3/2))", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
          ])
        })

        test("has total level 11", () => {
          expect(computed?.totalLevel).toBe(11)
        })
      })
    })

    describe("Full caster + Third caster", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Wizard 7 / Fighter (Eldritch Knight) 6", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            [
              ...Array(6).fill({ class: "wizard", subclass: "evocation" }),
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: "eldritch knight" },
              ...Array(3).fill({ class: "fighter", subclass: "eldritch knight" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 9 full caster (7 + floor(6/3))", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
          ])
        })

        test("has total level 13", () => {
          expect(computed?.totalLevel).toBe(13)
        })

        test("has spells for both classes", () => {
          expect(computed?.spells).toHaveLength(2)
        })
      })

      describe("Sorcerer 10 / Rogue (Arcane Trickster) 9", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "sorcerer",
            "draconic bloodline",
            [
              ...Array(9).fill({ class: "sorcerer", subclass: "draconic bloodline" }),
              { class: "rogue", subclass: null },
              { class: "rogue", subclass: null },
              { class: "rogue", subclass: "arcane trickster" },
              ...Array(6).fill({ class: "rogue", subclass: "arcane trickster" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 13 full caster (10 + floor(9/3))", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
            6, 6, 6, 6, 7, 7,
          ])
        })

        test("has total level 19", () => {
          expect(computed?.totalLevel).toBe(19)
        })
      })
    })

    describe("Half caster + Half caster", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Paladin 5 / Ranger 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            [
              ...Array(4).fill({ class: "paladin", subclass: "oath of devotion" }),
              ...Array(5).fill({ class: "ranger", subclass: "hunter" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 5 half caster (floor(10/2))", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2])
        })

        test("has total level 10", () => {
          expect(computed?.totalLevel).toBe(10)
        })

        test("has spells for both classes", () => {
          expect(computed?.spells).toHaveLength(2)
        })
      })
    })

    describe("Half caster + Third caster", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Paladin 6 / Fighter (Eldritch Knight) 6", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "paladin",
            "oath of devotion",
            [
              ...Array(5).fill({ class: "paladin", subclass: "oath of devotion" }),
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: null },
              { class: "fighter", subclass: "eldritch knight" },
              ...Array(3).fill({ class: "fighter", subclass: "eldritch knight" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 5 half caster (floor(6/2) + floor(6/3))", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2])
        })

        test("has total level 12", () => {
          expect(computed?.totalLevel).toBe(12)
        })
      })
    })

    describe("Warlock + other casters", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Warlock 5 / Sorcerer 5", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "warlock",
            "the fiend",
            [
              ...Array(4).fill({ class: "warlock", subclass: "the fiend" }),
              ...Array(5).fill({ class: "sorcerer", subclass: "draconic bloodline" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots from sorcerer only", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
        })

        test("has pact magic slots from warlock", () => {
          expect(computed?.pactMagicSlots).toEqual([3, 3])
        })

        test("has total level 10", () => {
          expect(computed?.totalLevel).toBe(10)
        })

        test("has spells for both classes", () => {
          expect(computed?.spells).toHaveLength(2)
        })
      })

      describe("Warlock 3 / Paladin 4", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "warlock",
            "the fiend",
            [
              ...Array(2).fill({ class: "warlock", subclass: "the fiend" }),
              ...Array(4).fill({ class: "paladin", subclass: "oath of devotion" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots from paladin only", () => {
          expect(computed?.spellSlots).toEqual([1, 1, 2, 2, 2, 2])
        })

        test("has pact magic slots from warlock", () => {
          expect(computed?.pactMagicSlots).toEqual([2, 2])
        })
      })
    })

    describe("Triple multiclass", () => {
      let user: User
      let character: Character
      let computed: ComputedCharacter | null

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      describe("Wizard 5 / Cleric 3 / Bard 2", () => {
        beforeEach(async () => {
          character = await createCharacterWithLevels(
            testCtx.db,
            user,
            "wizard",
            "evocation",
            [
              ...Array(4).fill({ class: "wizard", subclass: "evocation" }),
              ...Array(3).fill({ class: "cleric", subclass: "life domain" }),
              ...Array(2).fill({ class: "bard", subclass: "college of lore" }),
            ]
          )
          computed = await computeCharacter(testCtx.db, character.id)
        })

        test("has spell slots for level 10 full caster", () => {
          expect(computed?.spellSlots).toEqual([
            1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5,
            5, 5,
          ])
        })

        test("has three class entries", () => {
          expect(computed?.classes).toHaveLength(3)
        })

        test("has spells for all three classes", () => {
          expect(computed?.spells).toHaveLength(3)
        })
      })
    })
  })

  describe("on SRD 5.2 ruleset", () => {
    let user: User
    let character: Character
    let computed: ComputedCharacter | null

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("Wizard at level 5", () => {
      beforeEach(async () => {
        const result = await createCharacter(testCtx.db, user, {
          name: "Test Wizard",
          species: "human",
          lineage: undefined,
          class: "wizard",
          subclass: "evocation",
          background: "acolyte",
          alignment: "Neutral Good",
          ruleset: SRD52_ID,
        })
        assertSuccess(result)
        character = result.character

        const classDef = SRD52.classes.wizard
        const hitDie = classDef.hitDie

        for (let i = 0; i < 4; i++) {
          await addLevel(testCtx.db, character, {
            character_id: character.id,
            class: "wizard",
            level: "0",
            subclass: "evocation",
            hit_die_roll: hitDie.toString(),
            note: "",
          })
        }

        computed = await computeCharacter(testCtx.db, character.id)
      })

      test("has correct spell slots", () => {
        expect(computed?.spellSlots).toEqual([1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3])
      })

      test("has correct cantrip count", () => {
        const wizardSpells = computed?.spells.find((s) => s.class === "wizard")
        expect(wizardSpells?.cantripSlots.length).toBe(4)
      })
    })
  })
})
