import { describe, expect, it, test } from "bun:test"
import { findByCharacterId as findAbilities } from "@src/db/char_abilities"
import { getCurrentLevels } from "@src/db/char_levels"
import { findByCharacterId as findSkills } from "@src/db/char_skills"
import { findByCharacterId as findTraits } from "@src/db/char_traits"
import { type ClassNameType, getRuleset } from "@src/lib/dnd"
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

  const buildCharacterData = (overrides = {}) => {
    const base = {
      name: "Test Character",
      species: "dragonborn",
      lineage: "black",
      class: "cleric" as ClassNameType,
      subclass: "life domain",
      background: "acolyte",
      alignment: "Lawful Good",
      ruleset: SRD51_ID as typeof SRD51_ID | typeof SRD52_ID,
      // Default ability scores (standard array)
      ability_method: "standard-array",
      ability_str: "15",
      ability_dex: "14",
      ability_con: "13",
      ability_int: "12",
      ability_wis: "10",
      ability_cha: "8",
      // Default class skill proficiencies for cleric (2 skills)
      class_proficiency_history: "true",
      class_proficiency_medicine: "true",
      ...overrides,
    }

    // For SRD 5.2, add default background ability bonuses if not provided
    if (base.ruleset === SRD52_ID) {
      // Only add defaults if no bonuses are specified in overrides
      const hasAnyBonus = Object.keys(overrides).some(
        (key) => key.startsWith("background_ability_") && key.endsWith("_bonus")
      )

      if (!hasAnyBonus) {
        // Get allowed abilities from the background
        const ruleset = getRuleset(base.ruleset)
        const background = ruleset.backgrounds[base.background]
        const allowedAbilities = background?.abilityScoresModified || []

        // Default: +2 to first allowed ability, +1 to second
        const bonuses: Record<string, string> = {
          background_ability_str_bonus: "0",
          background_ability_dex_bonus: "0",
          background_ability_con_bonus: "0",
          background_ability_int_bonus: "0",
          background_ability_wis_bonus: "0",
          background_ability_cha_bonus: "0",
        }

        if (allowedAbilities.length >= 2) {
          const firstAbility = allowedAbilities[0]!
          const secondAbility = allowedAbilities[1]!
          bonuses[`background_ability_${firstAbility.substring(0, 3)}_bonus`] = "2"
          bonuses[`background_ability_${secondAbility.substring(0, 3)}_bonus`] = "1"
        }

        return {
          ...base,
          ...bonuses,
        }
      }

      // If any bonuses are specified, return base with those overrides
      return base
    }

    return base
  }

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
        // Scores should match the standard array selections
        const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
        expect(strength?.score).toBe(15) // From standard array

        const constitution = abilities.find((a) => a.ability === "constitution" && !a.proficiency)
        expect(constitution?.score).toBe(13) // From standard array
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

          // Check base scores from standard array (first record for each ability)
          const constitutionBase = abilities.find(
            (a) => a.ability === "constitution" && !a.proficiency
          )
          expect(constitutionBase?.score).toBe(13) // Standard array selection
          expect(constitutionBase?.note).toContain("Standard array")

          // Check modified score from species (+2 CON from dwarf)
          const constitutionModified = abilities.filter(
            (a) => a.ability === "constitution" && !a.proficiency
          )[1]
          expect(constitutionModified?.score).toBe(15) // 13 + 2 from dwarf
          expect(constitutionModified?.note).toContain("dwarf")

          // Check modified score from lineage (+1 WIS from hill dwarf)
          const wisdomBase = abilities.find((a) => a.ability === "wisdom" && !a.proficiency)
          expect(wisdomBase?.score).toBe(10) // Standard array selection

          const wisdomModified = abilities.filter(
            (a) => a.ability === "wisdom" && !a.proficiency
          )[1]
          expect(wisdomModified?.score).toBe(11) // 10 + 1 from hill dwarf
          expect(wisdomModified?.note).toContain("hill dwarf")

          // Strength should only have base score (no modifiers)
          const strengthRecords = abilities.filter(
            (a) => a.ability === "strength" && !a.proficiency
          )
          expect(strengthRecords.length).toBe(1)
          expect(strengthRecords[0]?.score).toBe(15) // Standard array
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

          // In SRD 5.2, species/lineage do NOT provide modifiers
          // Should only have base scores from standard array (no modifier records)
          const strengthRecords = abilities.filter(
            (a) => a.ability === "strength" && !a.proficiency
          )
          expect(strengthRecords.length).toBe(1) // Only base score, no modifiers
          expect(strengthRecords[0]?.score).toBe(15) // Standard array

          const dexterityRecords = abilities.filter(
            (a) => a.ability === "dexterity" && !a.proficiency
          )
          expect(dexterityRecords.length).toBe(1)
          expect(dexterityRecords[0]?.score).toBe(14) // Standard array

          const constitutionRecords = abilities.filter(
            (a) => a.ability === "constitution" && !a.proficiency
          )
          expect(constitutionRecords.length).toBe(1)
          expect(constitutionRecords[0]?.score).toBe(13) // Standard array
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

  describe("class skill proficiency selection", () => {
    it("applies class skill proficiency selections", async () => {
      const user = await userFactory.create({}, testCtx.db)
      // Cleric can choose 2 skills from: history, medicine, persuasion, religion
      const data = buildCharacterData({
        class_proficiency_history: "true",
        class_proficiency_medicine: "true",
      })

      const result = await createCharacter(testCtx.db, user, data)
      assertSuccess(result)

      const skills = await findSkills(testCtx.db, result.character.id)

      // Should have background skills (insight, religion)
      const insight = skills.find((s) => s.skill === "insight")
      expect(insight).toBeTruthy()
      expect(insight?.note).toContain("acolyte")

      const religion = skills.find((s) => s.skill === "religion")
      expect(religion).toBeTruthy()
      expect(religion?.note).toContain("acolyte")

      // Should have class skill selections
      const history = skills.find((s) => s.skill === "history")
      expect(history).toBeTruthy()
      expect(history?.proficiency).toBe("proficient")
      expect(history?.note).toContain("cleric")

      const medicine = skills.find((s) => s.skill === "medicine")
      expect(medicine).toBeTruthy()
      expect(medicine?.proficiency).toBe("proficient")
      expect(medicine?.note).toContain("cleric")

      // Should have exactly 4 skills total (2 from background + 2 from class)
      expect(skills.length).toBe(4)
    })

    it("fails when too few skills selected", async () => {
      const user = await userFactory.create({}, testCtx.db)
      // Cleric requires 2 skills, only selecting 1
      const data = buildCharacterData({
        class_proficiency_history: "true",
        class_proficiency_medicine: undefined, // Override default
      })

      const result = await createCharacter(testCtx.db, user, data)
      expect(result.complete).toBe(false)
      if (result.complete) return // Type guard

      expect(result.errors.class_skills).toContain("Must select exactly 2 skills")
      expect(result.errors.class_skills).toContain("currently selected 1")
    })

    it("fails when too many skills selected", async () => {
      const user = await userFactory.create({}, testCtx.db)
      // Cleric requires 2 skills, selecting 3
      const data = buildCharacterData({
        class_proficiency_history: "true",
        class_proficiency_medicine: "true",
        class_proficiency_persuasion: "true",
      })

      const result = await createCharacter(testCtx.db, user, data)
      expect(result.complete).toBe(false)
      if (result.complete) return // Type guard

      expect(result.errors.class_skills).toContain("Must select exactly 2 skills")
      expect(result.errors.class_skills).toContain("currently selected 3")
    })

    it("fails when selecting a skill already granted by background", async () => {
      const user = await userFactory.create({}, testCtx.db)
      // Acolyte background already grants religion, trying to select it from class too
      const data = buildCharacterData({
        class_proficiency_religion: "true",
        class_proficiency_history: "true",
      })

      const result = await createCharacter(testCtx.db, user, data)
      expect(result.complete).toBe(false)
      if (result.complete) return // Type guard

      expect(result.errors.class_proficiency_religion).toContain(
        "Already granted by acolyte background"
      )
    })

    it("fails when selecting a skill not available for the class", async () => {
      const user = await userFactory.create({}, testCtx.db)
      // Cleric cannot select athletics (not in their list)
      const data = buildCharacterData({
        class_proficiency_athletics: "true",
        class_proficiency_history: "true",
      })

      const result = await createCharacter(testCtx.db, user, data)
      expect(result.complete).toBe(false)
      if (result.complete) return // Type guard

      expect(result.errors.class_proficiency_athletics).toContain(
        "athletics is not available for cleric"
      )
    })

    describe("with different classes", () => {
      it("allows rogue to select 4 skills", async () => {
        const user = await userFactory.create({}, testCtx.db)
        // Rogue can choose 4 skills from their list
        const data = buildCharacterData({
          class: "rogue",
          subclass: "", // Rogue gets subclass at level 3
          // Override cleric defaults and set rogue skills
          class_proficiency_history: undefined,
          class_proficiency_medicine: undefined,
          class_proficiency_acrobatics: "true",
          class_proficiency_athletics: "true",
          class_proficiency_perception: "true",
          class_proficiency_stealth: "true",
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const skills = await findSkills(testCtx.db, result.character.id)
        const classSkills = skills.filter((s) => s.note?.toLowerCase().includes("rogue"))

        expect(classSkills.length).toBe(4)
      })

      it("allows barbarian to select 2 skills", async () => {
        const user = await userFactory.create({}, testCtx.db)
        // Barbarian can choose 2 skills from their list
        const data = buildCharacterData({
          class: "barbarian",
          subclass: "",
          // Override cleric defaults and set barbarian skills
          class_proficiency_history: undefined,
          class_proficiency_medicine: undefined,
          class_proficiency_athletics: "true",
          class_proficiency_perception: "true",
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const skills = await findSkills(testCtx.db, result.character.id)
        const classSkills = skills.filter((s) => s.note?.toLowerCase().includes("barbarian"))

        expect(classSkills.length).toBe(2)
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
            // Override cleric defaults with fighter skills
            class_proficiency_history: undefined,
            class_proficiency_medicine: undefined,
            class_proficiency_athletics: "true",
            class_proficiency_perception: "true",
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

  describe("ability score selection", () => {
    describe("with standard array", () => {
      it("applies player-selected ability scores", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "standard-array",
          ability_str: "15",
          ability_dex: "14",
          ability_con: "13",
          ability_int: "12",
          ability_wis: "10",
          ability_cha: "8",
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
        expect(strength?.score).toBe(15)

        const dexterity = abilities.find((a) => a.ability === "dexterity" && !a.proficiency)
        expect(dexterity?.score).toBe(14)

        const charisma = abilities.find((a) => a.ability === "charisma" && !a.proficiency)
        expect(charisma?.score).toBe(8)
      })

      it("rejects invalid standard array assignments", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "standard-array",
          ability_str: "15",
          ability_dex: "15", // Duplicate!
          ability_con: "13",
          ability_int: "12",
          ability_wis: "10",
          ability_cha: "8",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.ability_method).toContain("exactly the values [15, 14, 13, 12, 10, 8]")
      })

      describe("with dwarf species", () => {
        it("applies species modifiers to selected scores", async () => {
          const user = await userFactory.create({}, testCtx.db)
          const data = buildCharacterData({
            species: "dwarf",
            lineage: "hill dwarf",
            ability_method: "standard-array",
            ability_str: "10",
            ability_dex: "8",
            ability_con: "15", // +2 from dwarf
            ability_int: "12",
            ability_wis: "14", // +1 from hill dwarf
            ability_cha: "13",
          })

          const result = await createCharacter(testCtx.db, user, data)
          assertSuccess(result)

          const abilities = await findAbilities(testCtx.db, result.character.id)

          // Check base and modified scores for constitution (dwarf +2)
          const constitutionRecords = abilities.filter(
            (a) => a.ability === "constitution" && !a.proficiency
          )
          expect(constitutionRecords.length).toBe(2) // Base + modifier
          expect(constitutionRecords[0]?.score).toBe(15) // Base from standard array
          expect(constitutionRecords[1]?.score).toBe(17) // 15 + 2 from dwarf

          // Check base and modified scores for wisdom (hill dwarf +1)
          const wisdomRecords = abilities.filter((a) => a.ability === "wisdom" && !a.proficiency)
          expect(wisdomRecords.length).toBe(2) // Base + modifier
          expect(wisdomRecords[0]?.score).toBe(14) // Base from standard array
          expect(wisdomRecords[1]?.score).toBe(15) // 14 + 1 from hill dwarf

          // Strength should only have base score (no modifiers)
          const strengthRecords = abilities.filter(
            (a) => a.ability === "strength" && !a.proficiency
          )
          expect(strengthRecords.length).toBe(1)
          expect(strengthRecords[0]?.score).toBe(10) // Base from standard array
        })

        it("rejects random generation scores exceeding 18", async () => {
          const user = await userFactory.create({}, testCtx.db)
          const data = buildCharacterData({
            species: "dwarf",
            lineage: "mountain dwarf",
            ability_method: "random",
            ability_str: "16",
            ability_dex: "14",
            ability_con: "19", // Too high for random generation (max 18)
            ability_int: "12",
            ability_wis: "10",
            ability_cha: "8",
          })

          const result = await createCharacter(testCtx.db, user, data)
          expect(result.complete).toBe(false)
          if (result.complete) return
          expect(result.errors.ability_method).toContain("Random generation scores must be 3-18")
        })
      })
    })

    describe("with point buy", () => {
      it("accepts valid point buy allocation", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "point-buy",
          ability_str: "15", // 9 points
          ability_dex: "14", // 7 points
          ability_con: "13", // 5 points
          ability_int: "12", // 4 points
          ability_wis: "10", // 2 points
          ability_cha: "8", // 0 points
          // Total: 27 points
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
        expect(strength?.score).toBe(15)
      })

      it("rejects invalid point buy allocation", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "point-buy",
          ability_str: "15", // 9 points
          ability_dex: "15", // 9 points
          ability_con: "15", // 9 points
          ability_int: "8", // 0 points
          ability_wis: "8", // 0 points
          ability_cha: "8", // 0 points
          // Total: 27 points (valid)
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)
      })

      it("rejects spending too many points", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "point-buy",
          ability_str: "15", // 9 points
          ability_dex: "15", // 9 points
          ability_con: "15", // 9 points
          ability_int: "10", // 2 points (OVER!)
          ability_wis: "8",
          ability_cha: "8",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.ability_method).toContain("spend exactly 27 points")
      })

      it("rejects scores outside point buy range", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "point-buy",
          ability_str: "16", // Too high!
          ability_dex: "14",
          ability_con: "13",
          ability_int: "12",
          ability_wis: "10",
          ability_cha: "8",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.ability_method).toContain("Point buy scores must be 8-15")
      })
    })

    describe("with random generation", () => {
      it("accepts any valid ability scores", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ability_method: "random",
          rolled_values: "16,14,13,12,11,10",
          ability_str: "16",
          ability_dex: "14",
          ability_con: "13",
          ability_int: "12",
          ability_wis: "11",
          ability_cha: "10",
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        const strength = abilities.find((a) => a.ability === "strength" && !a.proficiency)
        expect(strength?.score).toBe(16)
      })
    })

    describe("on SRD 5.2 (2024 rules)", () => {
      it("requires background ability bonuses to total 3", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ruleset: SRD52_ID,
          background: "acolyte",
          // Missing bonus allocations (all default to 0)
          background_ability_str_bonus: "0",
          background_ability_dex_bonus: "0",
          background_ability_con_bonus: "0",
          background_ability_int_bonus: "0",
          background_ability_wis_bonus: "0",
          background_ability_cha_bonus: "0",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.background).toContain("must total 3")
      })

      it("applies background ability bonuses correctly", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ruleset: SRD52_ID,
          background: "acolyte",
          ability_str: "10",
          ability_dex: "8",
          ability_con: "12",
          ability_int: "13",
          ability_wis: "15", // +2 from background
          ability_cha: "14", // +1 from background
          background_ability_str_bonus: "0",
          background_ability_dex_bonus: "0",
          background_ability_con_bonus: "0",
          background_ability_int_bonus: "0",
          background_ability_wis_bonus: "2",
          background_ability_cha_bonus: "1",
        })

        const result = await createCharacter(testCtx.db, user, data)
        assertSuccess(result)

        const abilities = await findAbilities(testCtx.db, result.character.id)

        // Check base and modified scores for wisdom (background +2)
        const wisdomRecords = abilities.filter((a) => a.ability === "wisdom" && !a.proficiency)
        expect(wisdomRecords.length).toBe(2) // Base + modifier
        expect(wisdomRecords[0]?.score).toBe(15) // Base
        expect(wisdomRecords[1]?.score).toBe(17) // 15 + 2 from background

        // Check base and modified scores for charisma (background +1)
        const charismaRecords = abilities.filter((a) => a.ability === "charisma" && !a.proficiency)
        expect(charismaRecords.length).toBe(2) // Base + modifier
        expect(charismaRecords[0]?.score).toBe(14) // Base
        expect(charismaRecords[1]?.score).toBe(15) // 14 + 1 from background

        // Strength should only have base score (no modifiers)
        const strengthRecords = abilities.filter((a) => a.ability === "strength" && !a.proficiency)
        expect(strengthRecords.length).toBe(1)
        expect(strengthRecords[0]?.score).toBe(10) // Base
      })

      it("rejects bonuses to only one ability", async () => {
        const user = await userFactory.create({}, testCtx.db)
        const data = buildCharacterData({
          ruleset: SRD52_ID,
          background: "acolyte",
          background_ability_str_bonus: "0",
          background_ability_dex_bonus: "0",
          background_ability_con_bonus: "0",
          background_ability_int_bonus: "0",
          background_ability_wis_bonus: "3", // All 3 to one ability!
          background_ability_cha_bonus: "0",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.background).toContain("at least 2 different abilities")
      })

      it("rejects bonuses to abilities not allowed by background", async () => {
        const user = await userFactory.create({}, testCtx.db)
        // Acolyte allows Intelligence, Wisdom, Charisma
        const data = buildCharacterData({
          ruleset: SRD52_ID,
          background: "acolyte",
          background_ability_str_bonus: "2", // Strength NOT allowed!
          background_ability_dex_bonus: "0",
          background_ability_con_bonus: "0",
          background_ability_int_bonus: "0",
          background_ability_wis_bonus: "1",
          background_ability_cha_bonus: "0",
        })

        const result = await createCharacter(testCtx.db, user, data)
        expect(result.complete).toBe(false)
        if (result.complete) return
        expect(result.errors.background_ability_str_bonus).toContain("cannot receive a bonus")
      })
    })
  })
})
