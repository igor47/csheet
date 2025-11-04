import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { computeCharacter } from "./computeCharacter"
import { learnSpell } from "./learnSpell"
import { prepareSpell } from "./prepareSpell"

describe("prepareSpell", () => {
  const testCtx = useTestApp()

  describe("preparing a cantrip", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1 },
        testCtx.db
      )

      // Learn Fire Bolt
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_fire_bolt",
      })
    })

    test("succeeds when slot is available", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_fire_bolt",
      })

      expect(result.complete).toBe(true)
    })

    test("fails when all cantrip slots are full", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      // Level 1 wizard has 3 cantrip slots
      // First, learn and prepare 3 cantrips to fill all slots
      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_ray_of_frost",
      })
      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_mage_hand",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")

      await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_fire_bolt",
      })

      const char3 = await computeCharacter(testCtx.db, character.id)
      if (!char3) throw new Error("Character not found")

      await prepareSpell(testCtx.db, char3, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_ray_of_frost",
      })

      const char4 = await computeCharacter(testCtx.db, character.id)
      if (!char4) throw new Error("Character not found")

      await prepareSpell(testCtx.db, char4, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_mage_hand",
      })

      // Now try to prepare a 4th cantrip - should fail
      const char5 = await computeCharacter(testCtx.db, character.id)
      if (!char5) throw new Error("Character not found")

      await learnSpell(testCtx.db, char5, {
        class: "wizard",
        spell_id: "srd_light",
      })

      const char6 = await computeCharacter(testCtx.db, character.id)
      if (!char6) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char6, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_light",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("No available cantrip slots")
        expect(result.errors.spell_id).toContain("wizard")
      }
    })

    test("succeeds when replacing an existing cantrip", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      // Prepare Fire Bolt
      await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_fire_bolt",
      })

      // Learn Ray of Frost
      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")
      await learnSpell(testCtx.db, char2, {
        class: "wizard",
        spell_id: "srd_ray_of_frost",
      })

      // Replace Fire Bolt with Ray of Frost
      const char3 = await computeCharacter(testCtx.db, character.id)
      if (!char3) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char3, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_ray_of_frost",
        current_spell_id: "srd_fire_bolt",
      })

      expect(result.complete).toBe(true)
    })
  })

  describe("preparing a leveled spell", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 1 },
        testCtx.db
      )

      // Learn Magic Missile
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_magic_missile",
      })
    })

    test("succeeds when slot is available", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_magic_missile",
      })

      expect(result.complete).toBe(true)
    })

    test("fails when all prepared spell slots are full", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      // Level 1 wizard with 10 INT has 1 + INT modifier (0) = 1 prepared spell slot
      // Prepare Magic Missile to fill the only slot
      await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_magic_missile",
      })

      // Now try to prepare a 2nd spell - should fail
      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")

      await learnSpell(testCtx.db, char2, {
        class: "wizard",
        spell_id: "srd_shield",
      })

      const char3 = await computeCharacter(testCtx.db, character.id)
      if (!char3) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char3, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_shield",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("No available prepared spell slots")
        expect(result.errors.spell_id).toContain("wizard")
      }
    })

    test("succeeds when replacing an existing spell even when slots are full", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      // Prepare Magic Missile
      await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_magic_missile",
      })

      // Learn Shield
      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")
      await learnSpell(testCtx.db, char2, {
        class: "wizard",
        spell_id: "srd_shield",
      })

      // Replace Magic Missile with Shield (should work even if slots are "full")
      const char3 = await computeCharacter(testCtx.db, character.id)
      if (!char3) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char3, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_shield",
        current_spell_id: "srd_magic_missile",
      })

      expect(result.complete).toBe(true)
    })
  })

  describe("spell validation", () => {
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

      const result = await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "nonexistent-spell",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("not found")
      }
    })

    test("fails if spell is not in spellbook (wizard)", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      // Try to prepare a spell without learning it first
      const result = await prepareSpell(testCtx.db, char, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_magic_missile",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("not in your spellbook")
      }
    })

    test("fails if spell type doesn't match (cantrip vs spell)", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_fire_bolt",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")

      // Try to prepare Fire Bolt (cantrip) as a leveled spell
      const result = await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "spell",
        spell_id: "srd_fire_bolt",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("cantrip")
      }
    })

    test("fails if spell is already prepared", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      await learnSpell(testCtx.db, char, {
        class: "wizard",
        spell_id: "srd_fire_bolt",
      })

      const char2 = await computeCharacter(testCtx.db, character.id)
      if (!char2) throw new Error("Character not found")

      // Prepare Fire Bolt
      await prepareSpell(testCtx.db, char2, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_fire_bolt",
      })

      // Try to prepare it again
      const char3 = await computeCharacter(testCtx.db, character.id)
      if (!char3) throw new Error("Character not found")

      const result = await prepareSpell(testCtx.db, char3, {
        class: "wizard",
        spell_type: "cantrip",
        spell_id: "srd_fire_bolt",
      })

      expect(result.complete).toBe(false)
      if (!result.complete) {
        expect(result.errors.spell_id).toContain("already prepared")
      }
    })
  })
})
