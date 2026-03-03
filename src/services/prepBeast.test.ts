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
import { executePrepBeast } from "./prepBeast"

describe("prepBeast", () => {
  const testCtx = useTestApp()

  describe("executePrepBeast", () => {
    let user: User
    let character: Character
    let computedChar: ComputedCharacter

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("when character is SRD 5.1", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd51", class: "druid", level: 2 },
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
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error for wrong ruleset", async () => {
        const beasts = getBeasts("srd51")
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: wolf.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors._form).toContain("SRD 5.2")
      })
    })

    describe("when character is level 1 druid (no Wild Shape yet)", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 1 },
          testCtx.db
        )
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error that they cannot learn forms yet", async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: cat.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors._form).toContain("level 2")
      })
    })

    describe("when character is SRD 5.2 with Wild Shape trait", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
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
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("can add a valid beast within limits", async () => {
        const beasts = getBeasts("srd52")
        // Cat has CR 0, no fly/swim - should work for level 2
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: cat.id,
        })

        expect(result.complete).toBe(true)

        // Verify beast appears in computed character
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        expect(updatedChar?.wildShape?.beasts).toContain(cat.id)
      })

      test("returns error when beast not in ruleset", async () => {
        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: "nonexistent_beast",
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("not found")
      })

      test("returns error when beast already known", async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        // Add the beast first
        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )

        // Reload computed character
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        if (!updatedChar) throw new Error("Character not found")

        // Try to add again
        const result = await executePrepBeast(testCtx.db, updatedChar, {
          beast_id: cat.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("already a known form")
      })

      test("returns error when beast exceeds CR limit", async () => {
        // Level 2 druid has max CR 1/4 (0.25)
        const beasts = getBeasts("srd52")
        // Brown Bear has CR 1
        const brownBear = beasts.find((b) => b.name.toLowerCase() === "brown bear")!
        expect(brownBear.cr).toBeGreaterThan(0.25)

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: brownBear.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("exceeds")
        expect(result.errors.beast_id).toContain("CR")
      })

      test("returns error when beast has fly and canFly is false", async () => {
        // Level 2 druid cannot transform into flying creatures
        const beasts = getBeasts("srd52")
        // Find a beast with fly speed
        const flyingBeast = beasts.find((b) => b.speed.fly && b.cr <= 0.25)

        if (!flyingBeast) {
          // If no low CR flying beast exists, skip this test
          console.log("No low CR flying beast found in srd52, skipping test")
          return
        }

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: flyingBeast.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("fly")
      })

      test("returns error when beast has swim and canSwim is false", async () => {
        // Level 2 druid cannot transform into swimming creatures
        const beasts = getBeasts("srd52")
        // Find a beast with swim speed
        const swimmingBeast = beasts.find((b) => b.speed.swim && b.cr <= 0.25 && !b.speed.fly)

        if (!swimmingBeast) {
          // If no low CR swimming beast exists, skip this test
          console.log("No low CR swimming beast found in srd52, skipping test")
          return
        }

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: swimmingBeast.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("swim")
      })

      test("returns error when beast_id is missing in non-check mode", async () => {
        const result = await executePrepBeast(testCtx.db, computedChar, {})

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("Select a beast")
      })

      test("isCheck mode does not require beast_id", async () => {
        const result = await executePrepBeast(testCtx.db, computedChar, {}, true)

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        // In check mode with no beast_id, errors should be empty
        expect(result.errors.beast_id).toBeUndefined()
      })
    })

    describe("when at known forms limit", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
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

        // Level 2 druid has 4 known forms limit
        // Add 4 beasts to reach the limit
        const beasts = getBeasts("srd52")
        const lowCRBeasts = beasts
          .filter((b) => b.cr <= 0.25 && !b.speed.fly && !b.speed.swim)
          .slice(0, 4)

        for (const beast of lowCRBeasts) {
          await charBeastSeenFactory.create(
            { character_id: character.id, beast_id: beast.id },
            testCtx.db
          )
        }

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error when at limit without replace_beast_id", async () => {
        const beasts = getBeasts("srd52")
        // Find a beast not already known
        const newBeast = beasts.find(
          (b) =>
            b.cr <= 0.25 &&
            !b.speed.fly &&
            !b.speed.swim &&
            !computedChar.wildShape!.beasts.includes(b.id)
        )!

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: newBeast.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors._form).toContain("limit")
      })

      test("can replace an existing form when at limit", async () => {
        const beasts = getBeasts("srd52")
        const currentBeasts = computedChar.wildShape!.beasts
        const beastToReplace = currentBeasts[0]!

        // Find a new beast not already known
        const newBeast = beasts.find(
          (b) => b.cr <= 0.25 && !b.speed.fly && !b.speed.swim && !currentBeasts.includes(b.id)
        )!

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: newBeast.id,
          replace_beast_id: beastToReplace,
        })

        expect(result.complete).toBe(true)

        // Verify the replacement
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        expect(updatedChar?.wildShape?.beasts).toContain(newBeast.id)
        expect(updatedChar?.wildShape?.beasts).not.toContain(beastToReplace)
      })

      test("returns error when replacing a non-existent beast", async () => {
        const beasts = getBeasts("srd52")
        const newBeast = beasts.find(
          (b) =>
            b.cr <= 0.25 &&
            !b.speed.fly &&
            !b.speed.swim &&
            !computedChar.wildShape!.beasts.includes(b.id)
        )!

        const result = await executePrepBeast(testCtx.db, computedChar, {
          beast_id: newBeast.id,
          replace_beast_id: "nonexistent_beast_id",
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.replace_beast_id).toContain("not in your known forms")
      })
    })
  })
})
