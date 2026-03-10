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
import { activateWildShape } from "./activateWildShape"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"

describe("activateWildShape", () => {
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

      const result = await activateWildShape(testCtx.db, char, {
        beast_id: "srd52_wolf",
      })

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

    describe("with valid beasts", () => {
      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        // Add a cat (CR 0) and wolf (CR 1/4) as known forms
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )
        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: wolf.id },
          testCtx.db
        )

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("succeeds with valid beast", async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        const result = await activateWildShape(testCtx.db, computedChar, {
          beast_id: cat.id,
        })

        expect(result.complete).toBe(true)
        if (!result.complete) return
        expect(result.result.beastId).toBe(cat.id)
        expect(result.result.beastName).toBe(cat.name)
        expect(result.result.usesRemaining).toBe(1) // Level 4 has 2 uses, used 1
      })

      test("creates wild shape use record", async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        await activateWildShape(testCtx.db, computedChar, {
          beast_id: cat.id,
          note: "Scouting ahead",
        })

        // Verify transformation is tracked
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        expect(updatedChar?.wildShape?.ongoingTransformation).not.toBeNull()
        expect(updatedChar?.wildShape?.ongoingTransformation?.beastId).toBe(cat.id)
        expect(updatedChar?.wildShape?.usesAvailable).toBe(1) // 2 - 1 = 1
      })

      test("reduces uses available", async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        const usesBeforeChar = await computeCharacter(testCtx.db, character.id)
        const usesBefore = usesBeforeChar?.wildShape?.usesAvailable ?? 0

        await activateWildShape(testCtx.db, computedChar, {
          beast_id: cat.id,
        })

        const usesAfterChar = await computeCharacter(testCtx.db, character.id)
        const usesAfter = usesAfterChar?.wildShape?.usesAvailable ?? 0

        expect(usesAfter).toBe(usesBefore - 1)
      })
    })

    describe("when beast is not in known forms", () => {
      beforeEach(async () => {
        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error", async () => {
        const result = await activateWildShape(testCtx.db, computedChar, {
          beast_id: "srd52_wolf",
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("not found in known/seen beasts")
      })
    })

    describe("when beast exceeds CR limit", () => {
      beforeEach(async () => {
        // Level 4 druid has max CR 1/2
        const beasts = getBeasts("srd52")
        // Brown Bear has CR 1, which exceeds the limit
        const brownBear = beasts.find((b) => b.name.toLowerCase() === "brown bear")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: brownBear.id },
          testCtx.db
        )

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error", async () => {
        const beasts = getBeasts("srd52")
        const brownBear = beasts.find((b) => b.name.toLowerCase() === "brown bear")!

        const result = await activateWildShape(testCtx.db, computedChar, {
          beast_id: brownBear.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("CR")
        expect(result.errors.beast_id).toContain("exceeds")
      })
    })

    describe("when beast has flying speed but canFly is false", () => {
      beforeEach(async () => {
        // Level 4 druid cannot fly
        const beasts = getBeasts("srd52")
        const flyingBeast = beasts.find((b) => b.speed.fly && b.cr <= 0.5)

        if (flyingBeast) {
          await charBeastSeenFactory.create(
            { character_id: character.id, beast_id: flyingBeast.id },
            testCtx.db
          )
        }

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error", async () => {
        const beasts = getBeasts("srd52")
        const flyingBeast = beasts.find((b) => b.speed.fly && b.cr <= 0.5)

        if (!flyingBeast) {
          console.log("No low CR flying beast found in srd52, skipping test")
          return
        }

        const result = await activateWildShape(testCtx.db, computedChar, {
          beast_id: flyingBeast.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("flying")
      })
    })

    describe("when no uses available", () => {
      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )

        // Use all 2 wild shape uses (level 4 druid has 2)
        for (let i = 0; i < 2; i++) {
          await createWildShapeUse(testCtx.db, {
            character_id: character.id,
            beast_id: cat.id,
            note: null,
          })
        }

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")
        computedChar = char
      })

      test("returns error", async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        const result = await activateWildShape(testCtx.db, computedChar, {
          beast_id: cat.id,
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors._form).toContain("No Wild Shape uses available")
      })
    })

    describe("when already transformed", () => {
      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )
        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: wolf.id },
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

      test("auto-ends previous transformation and starts new one", async () => {
        const beasts = getBeasts("srd52")
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!

        // Verify there's an ongoing transformation
        expect(computedChar.wildShape?.ongoingTransformation).not.toBeNull()
        expect(computedChar.wildShape?.ongoingTransformation?.beastId).toBe(
          beasts.find((b) => b.name.toLowerCase() === "cat")!.id
        )

        const result = await activateWildShape(testCtx.db, computedChar, {
          beast_id: wolf.id,
        })

        expect(result.complete).toBe(true)
        if (!result.complete) return
        expect(result.result.beastId).toBe(wolf.id)

        // Verify new transformation is now active
        const updatedChar = await computeCharacter(testCtx.db, character.id)
        expect(updatedChar?.wildShape?.ongoingTransformation?.beastId).toBe(wolf.id)
      })
    })

    describe("validation", () => {
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

      test("returns error when beast_id is missing", async () => {
        const result = await activateWildShape(testCtx.db, computedChar, {})

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("required")
      })

      test("is_check mode does not require beast_id", async () => {
        const result = await activateWildShape(testCtx.db, computedChar, {
          is_check: "true",
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        // In check mode with no beast_id, shouldn't have that specific error
        expect(result.errors.beast_id).toBeUndefined()
      })

      test("returns error when beast data not found", async () => {
        // Add a fake beast to the seen list
        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: "nonexistent_beast" },
          testCtx.db
        )

        const char = await computeCharacter(testCtx.db, character.id)
        if (!char) throw new Error("Character not found")

        const result = await activateWildShape(testCtx.db, char, {
          beast_id: "nonexistent_beast",
        })

        expect(result.complete).toBe(false)
        if (result.complete !== false) return
        expect(result.errors.beast_id).toContain("Beast data not found")
      })
    })
  })
})
