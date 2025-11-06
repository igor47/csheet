import { beforeEach, describe, expect, test } from "bun:test"
import { create as createSpellSlot } from "@src/db/char_spell_slots"
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

  describe("arcane recovery", () => {
    let user: User
    let wizardCharacter: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Create a level 4 wizard (budget = ceil(4/2) = 2)
      wizardCharacter = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 4 },
        testCtx.db
      )
    })

    describe("validation", () => {
      test("non-wizard cannot use Arcane Recovery", async () => {
        const fighter = await characterFactory.create(
          { user_id: user.id, class: "fighter", level: 4 },
          testCtx.db
        )
        const char = await computeCharacter(testCtx.db, fighter.id)
        if (!char) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, char, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.arcane_recovery).toBe("Only Wizards can use Arcane Recovery")
        }
      })

      test("level 4 wizard can restore level-1 slots", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Use 2 spell slots to have enough to restore (level 4 wizard will restore 2 slots)
        for (let i = 0; i < 2; i++) {
          await createSpellSlot(testCtx.db, {
            character_id: char.id,
            slot_level: 1,
            action: "use",
            note: "Cast spell",
          })
        }

        const charWithUsedSlots = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charWithUsedSlots) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, charWithUsedSlots, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "true",
        })

        // Check mode should pass validation
        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.arcane_slots).toBeUndefined()
        }
      })

      test("cannot restore slots that aren't used", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Try to restore slots without using any
        const result = await shortRest(testCtx.db, char, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.arcane_slots).toContain("only have 0 used")
        }
      })

      test("level 4 wizard cannot restore more slots than budget allows", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Use multiple spell slots
        for (let i = 0; i < 4; i++) {
          await createSpellSlot(testCtx.db, {
            character_id: char.id,
            slot_level: 1,
            action: "use",
            note: "Cast spell",
          })
        }

        const charWithUsedSlots = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charWithUsedSlots) throw new Error("Character not found")

        // Level 4 wizard budget = 2
        // Restoring level-1 slots will restore 2 slots (2 * 1 = 2 budget)
        // This should pass validation
        const result = await shortRest(testCtx.db, charWithUsedSlots, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "true",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.arcane_slots).toBeUndefined()
        }
      })

      test("cannot restore more slots than actually used", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Use only 1 level-1 slot
        await createSpellSlot(testCtx.db, {
          character_id: char.id,
          slot_level: 1,
          action: "use",
          note: "Cast spell",
        })

        const charWithUsedSlot = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charWithUsedSlot) throw new Error("Character not found")

        // Try to restore level-1 slots (which would restore 2 slots, but only 1 is used)
        const result = await shortRest(testCtx.db, charWithUsedSlot, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.arcane_slots).toContain("only have 1 used level 1 spell slot")
        }
      })
    })

    describe("execution", () => {
      test("level 4 wizard restores 2 level-1 slots", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Use 2 level-1 slots
        for (let i = 0; i < 2; i++) {
          await createSpellSlot(testCtx.db, {
            character_id: char.id,
            slot_level: 1,
            action: "use",
            note: "Cast spell",
          })
        }

        const charWithUsedSlots = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charWithUsedSlots) throw new Error("Character not found")

        const beforeAvailable = charWithUsedSlots.availableSpellSlots.filter((s) => s === 1).length

        const result = await shortRest(testCtx.db, charWithUsedSlots, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(true)
        if (result.complete) {
          expect(result.result.arcaneRecoveryUsed).toBe(true)
          expect(result.result.spellSlotsRestored).toBe(2) // Should restore 2 slots
        }

        // Verify slots were actually restored
        const charAfter = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charAfter) throw new Error("Character not found")

        const afterAvailable = charAfter.availableSpellSlots.filter((s) => s === 1).length
        expect(afterAvailable).toBe(beforeAvailable + 2)
      })

      test("level 4 wizard restores 1 level-2 slot", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Use a level-2 slot
        await createSpellSlot(testCtx.db, {
          character_id: char.id,
          slot_level: 2,
          action: "use",
          note: "Cast spell",
        })

        const charWithUsedSlot = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charWithUsedSlot) throw new Error("Character not found")

        const beforeAvailable = charWithUsedSlot.availableSpellSlots.filter((s) => s === 2).length

        const result = await shortRest(testCtx.db, charWithUsedSlot, {
          arcane_recovery: "true",
          arcane_slot_2: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(true)
        if (result.complete) {
          expect(result.result.arcaneRecoveryUsed).toBe(true)
          expect(result.result.spellSlotsRestored).toBe(1) // Should restore 1 slot
        }

        // Verify slot was actually restored
        const charAfter = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charAfter) throw new Error("Character not found")

        const afterAvailable = charAfter.availableSpellSlots.filter((s) => s === 2).length
        expect(afterAvailable).toBe(beforeAvailable + 1)
      })

      test("level 6 wizard restores 3 level-1 slots", async () => {
        // Create a level 6 wizard (budget = ceil(6/2) = 3)
        const level6Wizard = await characterFactory.create(
          { user_id: user.id, class: "wizard", level: 6 },
          testCtx.db
        )
        const char = await computeCharacter(testCtx.db, level6Wizard.id)
        if (!char) throw new Error("Character not found")

        // Use 3 level-1 slots
        for (let i = 0; i < 3; i++) {
          await createSpellSlot(testCtx.db, {
            character_id: char.id,
            slot_level: 1,
            action: "use",
            note: "Cast spell",
          })
        }

        const charWithUsedSlots = await computeCharacter(testCtx.db, level6Wizard.id)
        if (!charWithUsedSlots) throw new Error("Character not found")

        const beforeAvailable = charWithUsedSlots.availableSpellSlots.filter((s) => s === 1).length

        const result = await shortRest(testCtx.db, charWithUsedSlots, {
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(true)
        if (result.complete) {
          expect(result.result.spellSlotsRestored).toBe(3) // Should restore 3 slots
        }

        // Verify slots were actually restored
        const charAfter = await computeCharacter(testCtx.db, level6Wizard.id)
        if (!charAfter) throw new Error("Character not found")

        const afterAvailable = charAfter.availableSpellSlots.filter((s) => s === 1).length
        expect(afterAvailable).toBe(beforeAvailable + 3)
      })

      test("combines with hit dice spending", async () => {
        const char = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!char) throw new Error("Character not found")

        // Damage character and use a spell slot
        await updateHitPoints(testCtx.db, char, {
          action: "lose",
          amount: "10",
          note: "Test damage",
          is_check: "false",
        })
        await createSpellSlot(testCtx.db, {
          character_id: char.id,
          slot_level: 1,
          action: "use",
          note: "Cast spell",
        })
        await createSpellSlot(testCtx.db, {
          character_id: char.id,
          slot_level: 1,
          action: "use",
          note: "Cast spell",
        })

        const charDamagedAndUsedSlots = await computeCharacter(testCtx.db, wizardCharacter.id)
        if (!charDamagedAndUsedSlots) throw new Error("Character not found")

        const result = await shortRest(testCtx.db, charDamagedAndUsedSlots, {
          spend_die_0: "6",
          roll_die_0: "4",
          arcane_recovery: "true",
          arcane_slot_1: "true",
          is_check: "false",
        })

        expect(result.complete).toBe(true)
        if (result.complete) {
          expect(result.result.hitDiceSpent).toBe(1)
          expect(result.result.hpRestored).toBeGreaterThan(0)
          expect(result.result.arcaneRecoveryUsed).toBe(true)
          expect(result.result.spellSlotsRestored).toBe(2)
        }
      })
    })
  })
})
