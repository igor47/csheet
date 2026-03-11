import { beforeEach, describe, expect, test } from "bun:test"
import { create as createCharHP } from "@src/db/char_hp"
import { create as createTrait } from "@src/db/char_traits"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { charBeastSeenFactory } from "@src/test/factories/char_beasts_seen"
import { charWildShapeUseFactory } from "@src/test/factories/char_wild_shape_use"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"
import { updateHitPoints } from "./updateHitPoints"

describe("updateHitPoints", () => {
  const testCtx = useTestApp()

  describe("when character is not transformed", () => {
    let user: User
    let character: Character
    let computedChar: ComputedCharacter

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 5 },
        testCtx.db
      )
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      computedChar = char
    })

    test("reduces HP when taking damage", async () => {
      const result = await updateHitPoints(testCtx.db, computedChar, {
        action: "lose",
        amount: "5",
        note: "Goblin attack",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.newHP).toBe(computedChar.currentHP - 5)
    })

    test("increases HP when healing", async () => {
      // First reduce HP so we can heal
      await createCharHP(testCtx.db, {
        character_id: character.id,
        delta: -10,
        note: "Previous damage",
      })
      const damagedChar = await computeCharacter(testCtx.db, character.id)
      if (!damagedChar) throw new Error("Character not found")

      const result = await updateHitPoints(testCtx.db, damagedChar, {
        action: "restore",
        amount: "5",
        note: "Healing potion",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.newHP).toBe(damagedChar.currentHP + 5)
    })

    test("prevents HP from going below 0", async () => {
      const result = await updateHitPoints(testCtx.db, computedChar, {
        action: "lose",
        amount: String(computedChar.currentHP + 10),
      })

      expect(result.complete).toBe(false)
      if (result.complete) return
      expect(result.errors.amount).toContain("would go below 0")
    })

    test("prevents healing above max HP", async () => {
      const result = await updateHitPoints(testCtx.db, computedChar, {
        action: "restore",
        amount: "10",
      })

      expect(result.complete).toBe(false)
      if (result.complete) return
      expect(result.errors.amount).toContain("would exceed max")
    })
  })

  describe("when character is transformed (Wild Shape)", () => {
    let user: User
    let character: Character
    let computedChar: ComputedCharacter
    const wolfBeastHp = 11 // Wolf has 11 HP

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 4 },
        testCtx.db
      )

      // Add Wild Shape trait
      await createTrait(testCtx.db, {
        character_id: character.id,
        name: "Wild Shape",
        description: "You can transform into a beast you have seen.",
        source: "class",
        source_detail: "druid",
        level: 2,
        note: null,
      })

      // Add wolf as known beast
      const beasts = getBeasts("srd52")
      const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!
      await charBeastSeenFactory.create(
        { character_id: character.id, beast_id: wolf.id },
        testCtx.db
      )

      // Start a transformation as wolf with full HP
      await charWildShapeUseFactory.create(
        { character_id: character.id, beast_id: wolf.id, beast_hp: wolfBeastHp },
        testCtx.db
      )

      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      computedChar = char
    })

    test("damage reduces beast HP, not character HP", async () => {
      const result = await updateHitPoints(testCtx.db, computedChar, {
        action: "lose",
        amount: "5",
        note: "Orc attack",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.newHP).toBe(computedChar.currentHP) // Character HP unchanged
      expect(result.result.newBeastHp).toBe(wolfBeastHp - 5)
      expect(result.result.transformationEnded).toBeUndefined()
    })

    test("healing restores beast HP, capped at max", async () => {
      // First damage the beast
      await updateHitPoints(testCtx.db, computedChar, {
        action: "lose",
        amount: "5",
      })
      const damagedChar = await computeCharacter(testCtx.db, character.id)
      if (!damagedChar) throw new Error("Character not found")

      const result = await updateHitPoints(testCtx.db, damagedChar, {
        action: "restore",
        amount: "10", // More than the 5 damage taken
        note: "Cure wounds",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.newHP).toBe(computedChar.currentHP) // Character HP unchanged
      expect(result.result.newBeastHp).toBe(wolfBeastHp) // Capped at max
    })

    test("ends transformation when beast HP reaches 0", async () => {
      const result = await updateHitPoints(testCtx.db, computedChar, {
        action: "lose",
        amount: String(wolfBeastHp),
        note: "Massive hit",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.transformationEnded).toBe(true)
      expect(result.result.beastName).toBe("Wolf")
      expect(result.result.newHP).toBe(computedChar.currentHP) // No overflow
    })

    test("applies overflow damage to character HP", async () => {
      const overflowAmount = 3
      const result = await updateHitPoints(testCtx.db, computedChar, {
        action: "lose",
        amount: String(wolfBeastHp + overflowAmount),
        note: "Critical hit",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.transformationEnded).toBe(true)
      expect(result.result.overflowDamage).toBe(overflowAmount)
      expect(result.result.newHP).toBe(computedChar.currentHP - overflowAmount)
    })

    test("clamps overflow damage to prevent HP going below 0", async () => {
      // Reduce character HP first so overflow would exceed it
      const characterHP = computedChar.currentHP
      await createCharHP(testCtx.db, {
        character_id: character.id,
        delta: -(characterHP - 5), // Leave character with only 5 HP
        note: "Previous damage",
      })
      const lowHPChar = await computeCharacter(testCtx.db, character.id)
      if (!lowHPChar) throw new Error("Character not found")

      // Deal massive damage: beast HP (11) + way more than character HP (5)
      const massiveDamage = wolfBeastHp + 20 // 11 + 20 = 31 total, overflow = 20
      const result = await updateHitPoints(testCtx.db, lowHPChar, {
        action: "lose",
        amount: String(massiveDamage),
        note: "Dragon breath",
      })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.transformationEnded).toBe(true)
      // Overflow should be clamped to character's current HP (5), not raw overflow (20)
      expect(result.result.overflowDamage).toBe(5)
      expect(result.result.newHP).toBe(0) // HP should be exactly 0, not negative
    })
  })
})
