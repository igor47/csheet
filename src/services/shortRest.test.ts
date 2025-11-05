import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { computeCharacter } from "./computeCharacter"
import { shortRest } from "./shortRest"
import { updateHitDice } from "./updateHitDice"
import { updateHitPoints } from "./updateHitPoints"

describe("shortRest", () => {
  const testCtx = useTestApp()

  describe("hit dice validation", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Create a level 3 fighter with 3d10 hit dice
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 3 },
        testCtx.db
      )
    })

    describe("when submitting a die that doesn't exist", () => {
      test("returns an error", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        // Character has d10 hit dice, try to spend a d8
        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "8",
          roll_die_0: "5",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.spend_die_0).toBe("You don't have a d8 hit die available")
        }
      })
    })

    describe("when submitting at any form index", () => {
      test("succeeds if the die type is available", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        // Character has 3 d10 hit dice
        // Form field index doesn't matter - only die availability matters
        const result = await shortRest(testCtx.db, char, {
          spend_die_5: "10",
          roll_die_5: "7",
          is_check: "true", // Use check mode to avoid HP updates
        })

        // Should succeed because character has d10s available
        expect(result.complete).toBe(false) // Check mode always returns incomplete
        if (!result.complete) {
          expect(result.errors.spend_die_5).toBeUndefined()
        }
      })
    })

    describe("when trying to spend the same die twice", () => {
      test("returns an error", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        // Try to spend two d10s when we have at least one
        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "10",
          roll_die_0: "7",
          spend_die_1: "10",
          roll_die_1: "8",
          spend_die_2: "10",
          roll_die_2: "6",
          spend_die_3: "10", // This should fail - only 3 dice available
          roll_die_3: "5",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.spend_die_3).toBe("You don't have a d10 hit die available")
        }
      })
    })

    describe("when spending available dice after some are already spent", () => {
      beforeEach(async () => {
        // Spend one hit die
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        await updateHitDice(testCtx.db, char, {
          action: "spend",
          die_value: "10",
          hp_rolled: "8",
          note: "Previous rest",
          is_check: "false",
        })
      })

      test("validates against remaining dice only", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        // Character now has 2 hit dice remaining
        expect(char.availableHitDice).toEqual([10, 10])

        // Try to spend 3 dice
        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "10",
          roll_die_0: "7",
          spend_die_1: "10",
          roll_die_1: "8",
          spend_die_2: "10", // This should fail
          roll_die_2: "6",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.spend_die_2).toBe("You don't have a d10 hit die available")
        }
      })
    })

    describe("with valid dice", () => {
      test("succeeds and restores HP", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        // Damage the character to reduce HP
        await updateHitPoints(testCtx.db, char, {
          action: "lose",
          amount: "10",
          note: "Test damage",
          is_check: "false",
        })

        const charWithLowHP = await computeCharacter(testCtx.db, character.id)
        if (!charWithLowHP) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, charWithLowHP, {
          spend_die_0: "10",
          roll_die_0: "8",
          spend_die_1: "10",
          roll_die_1: "7",
          is_check: "false",
        })

        expect(result.complete).toBe(true)
        if (result.complete) {
          expect(result.result.hitDiceSpent).toBe(2)
          expect(result.result.hpRestored).toBeGreaterThan(0)
          expect(result.result.diceRolls).toHaveLength(2)
          expect(result.result.diceRolls[0]).toEqual({
            die: 10,
            roll: 8,
            modifier: charWithLowHP.abilityScores.constitution.modifier,
          })
          expect(result.result.diceRolls[1]).toEqual({
            die: 10,
            roll: 7,
            modifier: charWithLowHP.abilityScores.constitution.modifier,
          })
        }
      })
    })

    describe("roll value validation", () => {
      test("rejects roll value less than 1", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "10",
          roll_die_0: "0",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.roll_die_0).toBe("Roll must be between 1 and 10")
        }
      })

      test("rejects roll value greater than die value", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "10",
          roll_die_0: "11",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.roll_die_0).toBe("Roll must be between 1 and 10")
        }
      })

      test("requires roll value for non-check submissions", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "10",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.roll_die_0).toBe("Roll value is required")
        }
      })

      test("allows missing roll value for check submissions", async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, char, {
          spend_die_0: "10",
          is_check: "true",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.roll_die_0).toBeUndefined()
        }
      })
    })
  })
})
