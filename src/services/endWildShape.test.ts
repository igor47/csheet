import { beforeEach, describe, expect, test } from "bun:test"
import { create as createTrait } from "@src/db/char_traits"
import { create as createWildShapeUse } from "@src/db/char_wild_shape_uses"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { charBeastSeenFactory } from "@src/test/factories/char_beasts_seen"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"
import { endWildShape } from "./endWildShape"

describe("endWildShape", () => {
  const testCtx = useTestApp()

  describe("when character does not have wild shape", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Fighter has no wild shape
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 5 },
        testCtx.db
      )
    })

    test("returns error", async () => {
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")

      const result = await endWildShape(testCtx.db, char, {})

      expect(result.complete).toBe(false)
      if (result.complete !== false) return
      expect(result.errors._form).toContain("cannot use Wild Shape")
    })
  })

  describe("when character is a druid with Wild Shape", () => {
    let user: User
    let character: Character
    let computedChar: ComputedCharacter

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
    })

    describe("when not transformed", () => {
      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error", async () => {
        const result = await endWildShape(testCtx.db, computedChar, {})

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors._form).toContain("No ongoing transformation")
      })
    })

    describe("when transformed", () => {
      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )

        // Start an ongoing transformation (not ended)
        await createWildShapeUse(testCtx.db, {
          character_id: character.id,
          beast_id: cat.id,
          note: null,
        })

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("succeeds and ends transformation", async () => {
        // Verify there's an ongoing transformation
        expect(computedChar.wildShape?.ongoingTransformation).not.toBeNull()

        const result = await endWildShape(testCtx.db, computedChar, {})

        expect(result.complete).toBe(true)
        if (!result.complete) return

        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        expect(result.result.beastId).toBe(cat.id)
        expect(result.result.beastName).toBe(cat.name)
        expect(result.result.duration).toBeDefined()
      })

      test("clears ongoing transformation", async () => {
        await endWildShape(testCtx.db, computedChar, {})

        const updatedChar = await computeCharacter(testCtx.db, character.id)
        expect(updatedChar?.wildShape?.ongoingTransformation).toBeNull()
      })

      test("does not restore wild shape use", async () => {
        const usesBefore = computedChar.wildShape?.usesAvailable ?? 0

        await endWildShape(testCtx.db, computedChar, {})

        const updatedChar = await computeCharacter(testCtx.db, character.id)
        const usesAfter = updatedChar?.wildShape?.usesAvailable ?? 0

        // Uses should remain the same (not restored on end)
        expect(usesAfter).toBe(usesBefore)
      })

      test("returns duration in human-readable format", async () => {
        const result = await endWildShape(testCtx.db, computedChar, {})

        expect(result.complete).toBe(true)
        if (!result.complete) return

        // Duration should be a human-readable string
        expect(typeof result.result.duration).toBe("string")
        // Since we just created the use, it should be less than a minute
        expect(result.result.duration).toContain("less than a minute")
      })
    })
  })
})
