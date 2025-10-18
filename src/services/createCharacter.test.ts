import { describe, expect, it, test } from "bun:test"
import { findByCharacterId as findAbilities } from "@src/db/char_abilities"
import { getCurrentLevels } from "@src/db/char_levels"
import { findByCharacterId as findSkills } from "@src/db/char_skills"
import { findByCharacterId as findTraits } from "@src/db/char_traits"
import type { ClassNameType } from "@src/lib/dnd"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
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

describe("createCharacter", () => {
  const testCtx = useTestApp()

  const buildCharacterData = (overrides = {}) => ({
    name: "Test Character",
    species: "dragonborn",
    lineage: "black",
    class: "cleric",
    subclass: "life domain",
    background: "acolyte",
    alignment: "Lawful Good",
    ruleset: SRD51_ID,
    ...overrides,
  })

  test("it creates a character", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const data = buildCharacterData()

    const result = await createCharacter(testCtx.db, user, data)
    assertSuccess(result)
  })

  describe("on SRD52 ruleset", () => {
    it("also works", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData({ ruleset: SRD52_ID })

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)
    })
  })

  describe("creating character twice", () => {
    it("fails with duplicate name error", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData()

      const firstResult = await createCharacter(testCtx.db, user, data)
      assertSuccess(firstResult)
      const secondResult = await createCharacter(testCtx.db, user, data)
      expect(secondResult.complete).toBe(false)
      if (secondResult.complete) return // Type guard
      expect(secondResult.errors.name).toBe("You already have a character with this name")
    })

    describe("as a different user", () => {
      it("succeeds", async () => {
        const user1 = await userFactory.create({}, testCtx.db)
        const user2 = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData()

        const firstResult = await createCharacter(testCtx.db, user1, data)
        assertSuccess(firstResult)
        const secondResult = await createCharacter(testCtx.db, user2, data)
        assertSuccess(secondResult)
      })
    })
  })

  describe("basic attributes", () => {
    test("should be set correctly", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData()

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const character = result.character
      expect(character.name).toBe(data.name)
      expect(character.species).toBe(data.species)
      expect(character.lineage).toBe(data.lineage)
      expect(character.background).toBe(data.background)
      expect(character.alignment).toBe(data.alignment)
      expect(character.ruleset).toBe(data.ruleset)
      expect(character.user_id).toBe(user.id)
    })
  })

  describe("with no linage specified", () => {
    it("should error out", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData({ lineage: undefined })

      const result = await createCharacter(testCtx.db, user, data)
      expect(result.complete).toBe(false)
      if (result.complete) return
      expect(result.errors.lineage).toBe("Lineage is required for this species")
    })

    describe("if species has no lineages", async () => {
      it("should succeed", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ species: "human", lineage: undefined })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)
      })
    })
  })

  describe("initial abilities", () => {
    describe("are modified by species and lineage", () => {
      it("creates base ability scores", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData()

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        // Dragonborn in SRD 5.1 has no ability score modifiers
        // All abilities should be at base 10
        const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
        expect(strength?.score).toBe(10)

        const constitution = abilities.find((a) => a.ability === "constitution" && !a.proficiency)
        expect(constitution?.score).toBe(10)
      })

      it("applies saving throw proficiencies from class", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData() // Cleric gets WIS and CHA saves

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        // Cleric gets proficiency in Wisdom and Charisma saves
        const wisdomAbilities = abilities.filter((a) => a.ability === "wisdom")
        const proficientWisdom = wisdomAbilities.find((a) => a.proficiency === true)
        expect(proficientWisdom).toBeTruthy()
        expect(proficientWisdom?.note).toContain("cleric")

        const charismaAbilities = abilities.filter((a) => a.ability === "charisma")
        const proficientCharisma = charismaAbilities.find((a) => a.proficiency === true)
        expect(proficientCharisma).toBeTruthy()
        expect(proficientCharisma?.note).toContain("cleric")
      })

      describe("with dwarf species", () => {
        it("applies species and lineage ability score modifiers", async () => {
          const user = await userFactory.create({}, testCtx.db)
          const data = buildCharacterData({
            species: "dwarf",
            lineage: "hill dwarf",
          })

          const result = await createCharacter(testCtx.db, user, data)
          assertSuccess(result)

          const abilities = await findAbilities(testCtx.db, result.character.id)

          // Dwarf gets +2 CON from species, Hill Dwarf gets +1 WIS from lineage
          const constitution = abilities.find((a) => a.ability === "constitution" && !a.proficiency)
          expect(constitution?.score).toBe(12) // 10 + 2

          const wisdom = abilities.find((a) => a.ability === "wisdom" && !a.proficiency)
          expect(wisdom?.score).toBe(11) // 10 + 1

          // Other abilities should be at base 10
          const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
          expect(strength?.score).toBe(10)
        })
      })
    })

    describe("on SRD 5.2", () => {
      // TODO: should be modified by background, but we have to prompt for it
      describe("are left at base values", () => {
        it("does not apply species/lineage modifiers", async () => {
          const user = await userFactory.create({}, testCtx.db)
          const data = buildCharacterData({ ruleset: SRD52_ID })

          const result = await createCharacter(testCtx.db, user, data)
          assertSuccess(result)

          const abilities = await findAbilities(testCtx.db, result.character.id)

          // All non-proficient abilities should be at base 10 in SRD 5.2
          const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
          expect(strength?.score).toBe(10)

          const dexterity = abilities.find((a) => a.ability === "dexterity" && !a.proficiency)
          expect(dexterity?.score).toBe(10)

          const constitution = abilities.find((a) => a.ability === "constitution" && !a.proficiency)
          expect(constitution?.score).toBe(10)
        })
      })
    })
  })

  describe("initial skills level", () => {
    it("applies skill proficiencies from background", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Acolyte background

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const skills = await findSkills(testCtx.db, result.character.id)

      // Acolyte background grants insight and religion proficiencies
      const insight = skills.find((s) => s.skill === "insight")
      expect(insight).toBeTruthy()
      expect(insight?.proficiency).toBe("proficient")
      expect(insight?.note).toContain("acolyte")

      const religion = skills.find((s) => s.skill === "religion")
      expect(religion).toBeTruthy()
      expect(religion?.proficiency).toBe("proficient")
      expect(religion?.note).toContain("acolyte")
    })

    it("applies skill proficiencies on SRD 5.2", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData({ ruleset: SRD52_ID })

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const skills = await findSkills(testCtx.db, result.character.id)

      // Acolyte background should still grant the same skills in SRD 5.2
      const insight = skills.find((s) => s.skill === "insight")
      expect(insight).toBeTruthy()
      expect(insight?.proficiency).toBe("proficient")

      const religion = skills.find((s) => s.skill === "religion")
      expect(religion).toBeTruthy()
      expect(religion?.proficiency).toBe("proficient")
    })

    describe("with charlatan background", () => {
      it("applies different skill proficiencies on SRD 5.1", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ background: "charlatan" })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const skills = await findSkills(testCtx.db, result.character.id)

        // Charlatan background grants deception and sleight of hand
        const deception = skills.find((s) => s.skill === "deception")
        expect(deception).toBeTruthy()
        expect(deception?.proficiency).toBe("proficient")
        expect(deception?.note).toContain("charlatan")

        const sleightOfHand = skills.find((s) => s.skill === "sleight of hand")
        expect(sleightOfHand).toBeTruthy()
        expect(sleightOfHand?.proficiency).toBe("proficient")
        expect(sleightOfHand?.note).toContain("charlatan")

        // Should NOT have acolyte skills
        const insight = skills.find((s) => s.skill === "insight")
        expect(insight).toBeFalsy()

        const religion = skills.find((s) => s.skill === "religion")
        expect(religion).toBeFalsy()
      })

      it("applies different skill proficiencies on SRD 5.2", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          background: "charlatan",
          ruleset: SRD52_ID,
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const skills = await findSkills(testCtx.db, result.character.id)

        // Charlatan background should work the same in SRD 5.2
        const deception = skills.find((s) => s.skill === "deception")
        expect(deception).toBeTruthy()
        expect(deception?.proficiency).toBe("proficient")

        const sleightOfHand = skills.find((s) => s.skill === "sleight of hand")
        expect(sleightOfHand).toBeTruthy()
        expect(sleightOfHand?.proficiency).toBe("proficient")
      })
    })
  })

  describe("initial class level", () => {
    it("creates a level 1 class entry", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Cleric class

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const levels = await getCurrentLevels(testCtx.db, result.character.id)

      expect(levels.length).toBe(1)
      expect(levels[0]?.class).toBe(data.class as ClassNameType)
      expect(levels[0]?.level).toBe(1)
      expect(levels[0]?.subclass).toBe(data.subclass)
    })

    it("sets hit die to maximum at level 1", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Cleric has d8 hit die

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const levels = await getCurrentLevels(testCtx.db, result.character.id)

      // Cleric has a d8 hit die, so at level 1 they get 8 HP
      expect(levels[0]?.hit_die_roll).toBe(8)
      expect(levels[0]?.note).toBe("Starting Level")
    })

    it("applies saving throw proficiencies from class", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Cleric gets WIS and CHA saves

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const abilities = await findAbilities(testCtx.db, result.character.id)

      // Cleric gets proficiency in Wisdom and Charisma saves
      const wisdomAbilities = abilities.filter((a) => a.ability === "wisdom")
      const proficientWisdom = wisdomAbilities.find((a) => a.proficiency === true)
      expect(proficientWisdom).toBeTruthy()
      expect(proficientWisdom?.note).toContain("cleric")

      const charismaAbilities = abilities.filter((a) => a.ability === "charisma")
      const proficientCharisma = charismaAbilities.find((a) => a.proficiency === true)
      expect(proficientCharisma).toBeTruthy()
      expect(proficientCharisma?.note).toContain("cleric")
    })

    describe("with no subclass", () => {
      it("fails to create the character", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ subclass: undefined })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.subclass).toBe("Subclass is required for this class at level 1")
      })

      describe("for fighter class", () => {
        it("creates the character", async () => {
          const user = await userFactory.create({}, testCtx.db)
          const data = buildCharacterData({
            class: "fighter",
            subclass: undefined,
          })

          const result = await createCharacter(testCtx.db, user, data)
          assertSuccess(result)

          const levels = await getCurrentLevels(testCtx.db, result.character.id)
          expect(levels[0]?.class).toBe("fighter")
          expect(levels[0]?.subclass).toBeNull()
        })
      })
    })

    describe("with subclass for class that gets it later", () => {
      it("fails to create the character", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          class: "fighter",
          subclass: "Champion",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.subclass).toBe("Subclass not available until level 3")
      })
    })

    describe("on SRD 5.2", () => {
      it("creates class entry", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ ruleset: SRD52_ID })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const levels = await getCurrentLevels(testCtx.db, result.character.id)

        expect(levels.length).toBe(1)
        expect(levels[0]?.class).toBe("cleric")
        expect(levels[0]?.level).toBe(1)
        expect(levels[0]?.hit_die_roll).toBe(8)
      })

      it("applies saving throw proficiencies from class", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ ruleset: SRD52_ID })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        // Cleric gets proficiency in Wisdom and Charisma saves
        const wisdomAbilities = abilities.filter((a) => a.ability === "wisdom")
        const proficientWisdom = wisdomAbilities.find((a) => a.proficiency === true)
        expect(proficientWisdom).toBeTruthy()

        const charismaAbilities = abilities.filter((a) => a.ability === "charisma")
        const proficientCharisma = charismaAbilities.find((a) => a.proficiency === true)
        expect(proficientCharisma).toBeTruthy()
      })
    })
  })

  describe("initial traits", () => {
    it("adds traits from species and lineage", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Dragonborn with black lineage

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const traits = await findTraits(testCtx.db, result.character.id)

      // Should have traits from black dragonborn lineage
      const breathWeapon = traits.find((t) => t.name === "breath weapon")
      expect(breathWeapon).toBeTruthy()
      expect(breathWeapon?.source).toBe("lineage")
      expect(breathWeapon?.source_detail).toBe("black")

      const damageResistance = traits.find((t) => t.name === "damage resistance")
      expect(damageResistance).toBeTruthy()
      expect(damageResistance?.source).toBe("lineage")
    })

    it("adds traits from background", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Acolyte background

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const traits = await findTraits(testCtx.db, result.character.id)

      // Should have trait from acolyte background
      const shelterOfFaithful = traits.find((t) => t.name === "shelter of the faithful")
      expect(shelterOfFaithful).toBeTruthy()
      expect(shelterOfFaithful?.source).toBe("background")
      expect(shelterOfFaithful?.source_detail).toBe("acolyte")
    })

    it("adds level 1 traits from class", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Cleric class

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const traits = await findTraits(testCtx.db, result.character.id)

      // Should have level 1 traits from cleric class
      const spellcasting = traits.find((t) => t.name === "spellcasting" && t.source === "class")
      expect(spellcasting).toBeTruthy()
      expect(spellcasting?.source_detail).toBe("cleric")
      expect(spellcasting?.level).toBe(1)
    })

    it("adds level 1 traits from subclass", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData() // Life domain subclass

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const traits = await findTraits(testCtx.db, result.character.id)

      // Should have level 1 traits from life subclass
      const bonusProficiency = traits.find((t) => t.name === "bonus proficiency")
      expect(bonusProficiency).toBeTruthy()
      expect(bonusProficiency?.source).toBe("subclass")
      expect(bonusProficiency?.source_detail).toBe("life domain")
      expect(bonusProficiency?.level).toBe(1)

      const discipleOfLife = traits.find((t) => t.name === "disciple of life")
      expect(discipleOfLife).toBeTruthy()
      expect(discipleOfLife?.source).toBe("subclass")
      expect(discipleOfLife?.level).toBe(1)
    })

    it("does not add higher level traits", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const data = buildCharacterData()

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const traits = await findTraits(testCtx.db, result.character.id)

      // Should NOT have level 2+ traits
      const channelDivinity = traits.find((t) => t.name === "channel divinity: preserve life")
      expect(channelDivinity).toBeFalsy()
    })

    describe("as a tiefling with no lineage", () => {
      it("adds tiefling traits", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          species: "tiefling",
          lineage: undefined,
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const traits = await findTraits(testCtx.db, result.character.id)

        // Should have Infernal Legacy Cantrip trait
        const infernalLegacy = traits.find((t) => t.name === "infernal legacy cantrip")
        expect(infernalLegacy).toBeTruthy()
        expect(infernalLegacy?.source).toBe("species")
        expect(infernalLegacy?.level).toBeNull()
        expect(infernalLegacy?.source_detail).toBe("tiefling")

        // should NOT have helish rebuke
        const hellishRebuke = traits.find((t) => t.name.includes("hellish rebuke"))
        expect(hellishRebuke).toBeFalsy()
      })

      describe("on SRD 5.2", () => {
        it("requires a lineage", async () => {
          const user = await userFactory.create({}, testCtx.db)
          const data = buildCharacterData({
            ruleset: SRD52_ID,
            species: "tiefling",
            lineage: undefined,
          })

          const result = await createCharacter(testCtx.db, user, data)
          expect(result.complete).toBe(false)
          if (result.complete) return
          expect(result.errors.lineage).toBe("Lineage is required for this species")
        })

        describe("with abyssal lineage", () => {
          it("adds poison spray but not ray of sickness", async () => {
            const user = await userFactory.create({}, testCtx.db)
            const data = buildCharacterData({
              ruleset: SRD52_ID,
              species: "tiefling",
              lineage: "abyssal",
            })

            const result = await createCharacter(testCtx.db, user, data)
            assertSuccess(result)

            const traits = await findTraits(testCtx.db, result.character.id)

            // Should have Poison Spray (level 1 trait)
            const poisonSpray = traits.find((t) => t.name === "poison spray")
            expect(poisonSpray).toBeTruthy()
            expect(poisonSpray?.source).toBe("lineage")
            expect(poisonSpray?.source_detail).toBe("abyssal")

            // Should NOT have Ray of Sickness (level 3 trait)
            const rayOfSickness = traits.find((t) => t.name === "ray of sickness")
            expect(rayOfSickness).toBeFalsy()
          })
        })
      })
    })

    describe("on SRD 5.2", () => {
      it("adds traits from species and lineage", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ ruleset: SRD52_ID })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const traits = await findTraits(testCtx.db, result.character.id)

        // Should have traits from dragonborn species
        const draconicAncestry = traits.find((t) => t.name === "draconic ancestry")
        expect(draconicAncestry).toBeTruthy()
        expect(draconicAncestry?.source).toBe("species")

        // Should have traits from black lineage
        const breathWeapon = traits.find((t) => t.name === "breath weapon")
        expect(breathWeapon).toBeTruthy()
        expect(breathWeapon?.source).toBe("lineage")
      })

      it("adds level 1 traits from class", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({ ruleset: SRD52_ID })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const traits = await findTraits(testCtx.db, result.character.id)

        // Should have level 1 class traits
        const spellcasting = traits.find((t) => t.name === "spellcasting" && t.source === "class")
        expect(spellcasting).toBeTruthy()
        expect(spellcasting?.level).toBe(1)

        // Life Domain in SRD 5.2 has no level 1 subclass traits
        // (disciple of life is level 3 in SRD 5.2)
        const discipleOfLife = traits.find((t) => t.name === "disciple of life")
        expect(discipleOfLife).toBeFalsy()
      })
    })
  })
})
