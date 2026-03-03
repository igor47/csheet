import { beforeEach, describe, expect, test } from "bun:test"
import { create as createTrait } from "@src/db/char_traits"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { charBeastSeenFactory } from "@src/test/factories/char_beasts_seen"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"
import { executeLookupBeast } from "./lookupBeast"
import { executeSeeBeast } from "./seeBeast"

describe("seeBeast", () => {
  const testCtx = useTestApp()

  describe("executeSeeBeast", () => {
    let user: User
    let character: Character
    let computedChar: ComputedCharacter

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "druid", level: 2 },
        testCtx.db
      )
    })

    describe("when character is SRD 5.2", () => {
      let srd52Character: typeof character
      let srd52ComputedChar: ComputedCharacter

      beforeEach(async () => {
        srd52Character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        // Add Wild Shape trait
        await createTrait(testCtx.db, {
          character_id: srd52Character.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })
        const char = await computeCharacter(testCtx.db, srd52Character.id)
        if (!char) throw new Error("Character not found")
        srd52ComputedChar = char
      })

      test("returns error for wrong ruleset", async () => {
        const beasts = getBeasts("srd52")
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        const result = await executeSeeBeast(testCtx.db, srd52ComputedChar, {
          beast_id: wolf.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors._form).toContain("SRD 5.1")
      })
    })

    describe("when character has Wild Shape trait", () => {
      beforeEach(async () => {
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

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("can record a valid beast", async () => {
        const beasts = getBeasts(character.ruleset)
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        const result = await executeSeeBeast(testCtx.db, computedChar, {
          beast_id: wolf.id,
        })

        expect(result.complete).toBe(true)

        // Verify beast appears in computed character
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        expect(updatedChar?.wildShape?.beasts).toContain(wolf.id)
      })

      test("can record a beast with a note", async () => {
        const beasts = getBeasts(character.ruleset)
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        const result = await executeSeeBeast(testCtx.db, computedChar, {
          beast_id: wolf.id,
          note: "Seen in the forest",
        })

        expect(result.complete).toBe(true)
      })

      test("returns error when beast not in ruleset", async () => {
        const result = await executeSeeBeast(testCtx.db, computedChar, {
          beast_id: "nonexistent_beast",
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("not found")
      })

      test("returns error when beast already seen", async () => {
        const beasts = getBeasts(character.ruleset)
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        // Add the beast first
        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: wolf.id },
          testCtx.db
        )

        // Reload computed character to get updated seenBeasts
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        if (!updatedChar) throw new Error("Character not found")

        // Try to add again
        const result = await executeSeeBeast(testCtx.db, updatedChar, {
          beast_id: wolf.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("already been recorded")
      })

      test("returns error when beast_id is missing in non-check mode", async () => {
        const result = await executeSeeBeast(testCtx.db, computedChar, {})

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("Select a beast")
      })

      test("isCheck mode does not require beast_id", async () => {
        const result = await executeSeeBeast(testCtx.db, computedChar, {}, true)

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        // In check mode with no beast_id, errors should be empty
        expect(result.errors.beast_id).toBeUndefined()
      })
    })
  })

  describe("executeLookupBeast", () => {
    let user: User
    let character: Character
    let computedChar: ComputedCharacter

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Use human species which exists in srd52
      character = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human" },
        testCtx.db
      )
      const char = await computeCharacter(testCtx.db, character.id)
      if (!char) throw new Error("Character not found")
      computedChar = char
    })

    test("finds beast by exact name match", async () => {
      const result = await executeLookupBeast(testCtx.db, computedChar, {
        beast_name: "Wolf",
      })

      expect(result.complete).toBe(true)
      if (result.complete !== true) return
      expect(result.result).toBeTruthy()
      expect(result.result.name).toBe("Wolf")
    })

    test("finds beast with case-insensitive match", async () => {
      const result = await executeLookupBeast(testCtx.db, computedChar, {
        beast_name: "wolf",
      })

      expect(result.complete).toBe(true)
      if (result.complete !== true) return
      expect(result.result.name).toBe("Wolf")
    })

    test("finds beast by partial name match", async () => {
      const result = await executeLookupBeast(testCtx.db, computedChar, {
        beast_name: "brown be",
      })

      expect(result.complete).toBe(true)
      if (result.complete !== true) return
      expect(result.result.name).toBe("Brown Bear")
    })

    test("returns error when beast not found", async () => {
      const result = await executeLookupBeast(testCtx.db, computedChar, {
        beast_name: "NonexistentBeast",
      })

      expect(result.complete).toBe(false)
      if (result.complete !== false) return
      expect(result.errors.beast_name).toContain("No beast found matching")
    })

    test("returns error when multiple beasts match", async () => {
      // "giant" matches multiple beasts
      const result = await executeLookupBeast(testCtx.db, computedChar, {
        beast_name: "giant",
      })

      expect(result.complete).toBe(false)
      if (result.complete !== false) return
      expect(result.errors.beast_name).toContain("Multiple beasts match")
    })

    test("includes all beast details in response", async () => {
      const result = await executeLookupBeast(testCtx.db, computedChar, {
        beast_name: "Wolf",
      })

      expect(result.complete).toBe(true)
      if (result.complete !== true) return

      const beast = result.result
      expect(beast).toBeTruthy()
      expect(beast.id).toBeTruthy()
      expect(beast.name).toBe("Wolf")
      expect(beast.cr).toBeDefined()
      expect(beast.ac).toBeDefined()
      expect(beast.hitPoints).toBeDefined()
      expect(beast.speed).toBeDefined()
      expect(beast.abilities).toBeDefined()
      expect(beast.actions).toBeTruthy()
      expect(Array.isArray(beast.actions)).toBe(true)
    })
  })
})
