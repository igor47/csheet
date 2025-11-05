import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { castSpell } from "./castSpell"
import { computeCharacter } from "./computeCharacter"
import { learnSpell } from "./learnSpell"
import { prepareSpell } from "./prepareSpell"

describe("castSpell", () => {
  const testCtx = useTestApp()

  describe("casting a cantrip", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1 },
        testCtx.db
      )

      // Learn and prepare Fire Bolt (cantrip)
      const char1 = await computeCharacter(testCtx.db, character.id)
      if (!char1) throw new Error("Character not found")
      await learnSpell(testCtx.db, char1, {
        class: "wizard",
        spell_id: "srd_fire_bolt",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")
      await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_fire_bolt",
      })
    })

    test("succeeds without consuming a spell slot", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_fire_bolt",
        as_ritual: "false",
        slot_level: "",
      })

      if (!result.complete) {
        console.log("ERRORS:", result.errors)
        console.log("VALUES:", result.values)
      }

      expect(result.complete).toBe(true)
      if (result.complete) {
        expect(result.result.note).toContain("Fire Bolt")
        expect(result.result.note).toContain("No spell slot was used")
        expect(result.result.spellId).toBe("srd_fire_bolt")
      }
    })

    test("fails if slot_level is provided", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_fire_bolt",
        as_ritual: "false",
        slot_level: "1",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.slot_level).toContain("Cannot use spell slots when casting a cantrip")
      }
    })
  })

  describe("casting a ritual spell as a ritual", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 3 },
        testCtx.db
      )

      // Learn and prepare Detect Magic (ritual spell)
      const char1 = await computeCharacter(testCtx.db, character.id)
      if (!char1) throw new Error("Character not found")
      await learnSpell(testCtx.db, char1, {
        class: "wizard",
        spell_id: "srd_detect_magic",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")
      await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_detect_magic",
      })
    })

    test("succeeds with as_ritual=true and no slot_level", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_detect_magic",
        as_ritual: "true",
        slot_level: "",
      })

      expect(result.complete).toBe(true)
      if (result.complete) {
        expect(result.result.note).toContain("Detect Magic")
        expect(result.result.note).toContain("as a ritual")
        expect(result.result.note).toContain("No spell slot was used")
        expect(result.result.spellId).toBe("srd_detect_magic")
      }
    })

    test("succeeds with as_ritual=true and slot_level empty", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      // Simulate what happens when checkbox is checked but slot_level is empty
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_detect_magic",
        as_ritual: "true",
        slot_level: "",
      })

      expect(result.complete).toBe(true)
      if (result.complete) {
        expect(result.result.note).toContain("Detect Magic")
        expect(result.result.note).toContain("as a ritual")
        expect(result.result.note).toContain("No spell slot was used")
      }
    })

    test("fails if slot_level is provided when casting as ritual", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_detect_magic",
        as_ritual: "true",
        slot_level: "1",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.slot_level).toContain(
          "Cannot use spell slots when casting as a ritual"
        )
      }
    })
  })

  describe("casting a non-ritual spell normally", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 3 },
        testCtx.db
      )

      // Learn and prepare Magic Missile (not a ritual)
      const char1 = await computeCharacter(testCtx.db, character.id)
      if (!char1) throw new Error("Character not found")
      await learnSpell(testCtx.db, char1, {
        class: "wizard",
        spell_id: "srd_magic_missile",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")
      await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_magic_missile",
      })
    })

    test("succeeds with a valid spell slot", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const availableSlotsBefore = char.availableSpellSlots

      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_magic_missile",
        as_ritual: "false",
        slot_level: "1",
      })

      expect(result.complete).toBe(true)
      if (result.complete) {
        expect(result.result.note).toContain("Magic Missile")
        expect(result.result.note).toContain("level 1 spell slot")
        expect(result.result.spellId).toBe("srd_magic_missile")
      }

      // Verify spell slot was consumed
      const charAfter = await computeCharacter(testCtx.db, character.id)
      if (!charAfter) throw new Error("Character not found")
      expect(charAfter.availableSpellSlots.length).toBe(availableSlotsBefore.length - 1)
    })

    test("succeeds when upcasting with higher slot level", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_magic_missile",
        as_ritual: "false",
        slot_level: "2",
        note: "Extra damage!",
      })

      expect(result.complete).toBe(true)
      if (result.complete) {
        expect(result.result.note).toContain("Magic Missile")
        expect(result.result.note).toContain("level 2 spell slot")
      }
    })

    test("fails if no slot_level is provided", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_magic_missile",
        as_ritual: "false",
        slot_level: "",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.slot_level).toContain("Spell slot level is required")
      }
    })

    test("fails if slot_level is lower than spell level", async () => {
      // Magic Missile is level 1, can't cast with level 0
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_magic_missile",
        as_ritual: "false",
        slot_level: "0",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.slot_level).toBeTruthy()
      }
    })

    test("fails if no spell slots of that level are available", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      // Try to use a level 9 slot (character is only level 3)
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_magic_missile",
        as_ritual: "false",
        slot_level: "9",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.slot_level).toContain("No level 9 spell slots available")
      }
    })
  })

  describe("wizard ritual casting from spellbook", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 3 },
        testCtx.db
      )

      // Learn Detect Magic but DON'T prepare it
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_detect_magic",
      })
    })

    test("wizard can cast unprepared ritual spell as a ritual", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_detect_magic",
        as_ritual: "true",
        slot_level: "",
      })

      expect(result.complete).toBe(true)
      if (result.complete) {
        expect(result.result.note).toContain("Detect Magic")
        expect(result.result.note).toContain("as a ritual")
      }
    })

    test("wizard cannot cast unprepared ritual spell normally", async () => {
      // Wizards can cast ritual spells from spellbook WITHOUT preparing them,
      // but ONLY when casting as rituals (not when using spell slots normally)
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_detect_magic",
        as_ritual: "false",
        slot_level: "1",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("not prepared")
      }
    })
  })

  describe("spell not prepared", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "cleric", level: 3 },
        testCtx.db
      )
    })

    test("fails if spell is not prepared", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      // Try to cast Cure Wounds without preparing it
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_cure_wounds",
        as_ritual: "false",
        slot_level: "1",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("not prepared")
      }
    })
  })

  describe("spell not found", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1 },
        testCtx.db
      )
    })

    test("fails if spell_id does not exist", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "nonexistent-spell",
        as_ritual: "false",
        slot_level: "",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("Spell not found")
      }
    })
  })

  describe("non-ritual spell cast as ritual", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 3 },
        testCtx.db
      )

      // Learn and prepare Magic Missile (NOT a ritual)
      const char1 = await computeCharacter(testCtx.db, character.id)
      if (!char1) throw new Error("Character not found")
      await learnSpell(testCtx.db, char1, {
        class: "wizard",
        spell_id: "srd_magic_missile",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")
      await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_magic_missile",
      })
    })

    test("fails if trying to cast non-ritual spell as a ritual", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      const result = await castSpell(testCtx.db, char, {
        spell_id: "srd_magic_missile",
        as_ritual: "true",
        slot_level: "",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.as_ritual).toContain("cannot be cast as a ritual")
      }
    })
  })
})
