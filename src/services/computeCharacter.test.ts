import { beforeEach, describe, expect, test } from "bun:test"
import { create as createTrait } from "@src/db/char_traits"
import { endTransformation } from "@src/db/char_wild_shape_uses"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { charWildShapeUseFactory } from "@src/test/factories/char_wild_shape_use"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { computeCharacter } from "./computeCharacter"

describe("computeCharacter", () => {
  const testCtx = useTestApp()

  describe("wild shape info", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("for a druid with no uses recorded", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
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

      test("usesAvailable equals maxUses", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        expect(computed?.wildShape).not.toBeNull()
        expect(computed?.wildShape?.maxUses).toBe(2)
        expect(computed?.wildShape?.usesAvailable).toBe(2)
        expect(computed?.wildShape?.unrecoveredCount).toBe(0)
        expect(computed?.wildShape?.ongoingTransformation).toBeNull()
      })
    })

    describe("for a druid with one unrecovered use", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        await createTrait(testCtx.db, {
          character_id: character.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })

        // Record one wild shape use (ended, but not recovered)
        const beasts = getBeasts("srd52")
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!
        const use = await charWildShapeUseFactory.create(
          { character_id: character.id, beast_id: wolf.id },
          testCtx.db
        )
        // End the transformation
        await endTransformation(testCtx.db, use.id)
      })

      test("usesAvailable is reduced by 1", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        expect(computed?.wildShape?.maxUses).toBe(2)
        expect(computed?.wildShape?.usesAvailable).toBe(1)
        expect(computed?.wildShape?.unrecoveredCount).toBe(1)
        expect(computed?.wildShape?.ongoingTransformation).toBeNull()
      })
    })

    describe("for a druid with an ongoing transformation", () => {
      let useId: string
      let beastId: string

      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        await createTrait(testCtx.db, {
          character_id: character.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })

        // Record an ongoing wild shape use (ended_at is NULL)
        const beasts = getBeasts("srd52")
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!
        beastId = wolf.id
        const use = await charWildShapeUseFactory.create(
          { character_id: character.id, beast_id: wolf.id },
          testCtx.db
        )
        useId = use.id
      })

      test("identifies the ongoing transformation", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        expect(computed?.wildShape?.maxUses).toBe(2)
        expect(computed?.wildShape?.usesAvailable).toBe(1)
        expect(computed?.wildShape?.unrecoveredCount).toBe(1)
        expect(computed?.wildShape?.ongoingTransformation).not.toBeNull()
        expect(computed?.wildShape?.ongoingTransformation?.id).toBe(useId)
        expect(computed?.wildShape?.ongoingTransformation?.beastId).toBe(beastId)
        expect(computed?.wildShape?.ongoingTransformation?.startedAt).toBeInstanceOf(Date)
      })
    })

    describe("for a druid who has used all wild shape uses", () => {
      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        await createTrait(testCtx.db, {
          character_id: character.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })

        // Use all wild shape uses
        const beasts = getBeasts("srd52")
        const wolf = beasts.find((b) => b.name.toLowerCase() === "wolf")!
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        // Create two uses (max for level 2) - both ended but unrecovered
        const use1 = await charWildShapeUseFactory.create(
          { character_id: character.id, beast_id: wolf.id },
          testCtx.db
        )
        await endTransformation(testCtx.db, use1.id)

        const use2 = await charWildShapeUseFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )
        await endTransformation(testCtx.db, use2.id)
      })

      test("usesAvailable is 0", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        expect(computed?.wildShape?.maxUses).toBe(2)
        expect(computed?.wildShape?.usesAvailable).toBe(0)
        expect(computed?.wildShape?.unrecoveredCount).toBe(2)
        expect(computed?.wildShape?.ongoingTransformation).toBeNull()
      })
    })
  })
})
