import { beforeEach, describe, expect, test } from "bun:test"
import { create as createTrait } from "@src/db/char_traits"
import { endTransformation } from "@src/db/char_wild_shape_uses"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { charWildShapeUseFactory } from "@src/test/factories/char_wild_shape_use"
import { characterFactory } from "@src/test/factories/character"
import { itemFactory } from "@src/test/factories/item"
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

  describe("armor class calculation", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Create a character with 14 DEX (+2 modifier)
      character = await characterFactory.create(
        {
          user_id: user.id,
          ruleset: "srd52",
          species: "human",
          class: "fighter",
          level: 1,
          dexterity: 14,
        },
        testCtx.db
      )
    })

    describe("with no armor or shield", () => {
      test("uses unarmored AC (10 + DEX modifier)", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 10 + 2 (DEX modifier for 14 DEX) = 12
        expect(computed?.armorClass).toBe(12)
      })
    })

    describe("with a wielded shield", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Shield",
            category: "shield",
            armor_modifier: 2,
            wielded: true,
          },
          testCtx.db
        )
      })

      test("adds shield armor_modifier to AC", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 10 + 2 (DEX) + 2 (shield) = 14
        expect(computed?.armorClass).toBe(14)
      })
    })

    describe("with an unwielded shield", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Shield",
            category: "shield",
            armor_modifier: 2,
            wielded: false,
          },
          testCtx.db
        )
      })

      test("does not add shield bonus to AC", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 10 + 2 (DEX) = 12, no shield bonus
        expect(computed?.armorClass).toBe(12)
      })
    })

    describe("with worn heavy armor (no DEX bonus)", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Chain Mail",
            category: "armor",
            armor_type: "heavy",
            armor_class: 16,
            armor_class_dex: false,
            worn: true,
          },
          testCtx.db
        )
      })

      test("uses armor AC without DEX modifier", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        expect(computed?.armorClass).toBe(16)
      })
    })

    describe("with worn medium armor (capped DEX bonus)", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Breastplate",
            category: "armor",
            armor_type: "medium",
            armor_class: 14,
            armor_class_dex: true,
            armor_class_dex_max: 2,
            worn: true,
          },
          testCtx.db
        )
      })

      test("uses armor AC with capped DEX modifier", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 14 + 2 (DEX, capped at max 2) = 16
        expect(computed?.armorClass).toBe(16)
      })
    })

    describe("with worn medium armor and high DEX", () => {
      beforeEach(async () => {
        // Update character to have 18 DEX (+4 modifier)
        character = await characterFactory.create(
          {
            user_id: user.id,
            ruleset: "srd52",
            species: "human",
            class: "fighter",
            level: 1,
            dexterity: 18,
          },
          testCtx.db
        )

        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Breastplate",
            category: "armor",
            armor_type: "medium",
            armor_class: 14,
            armor_class_dex: true,
            armor_class_dex_max: 2,
            worn: true,
          },
          testCtx.db
        )
      })

      test("caps DEX bonus at armor_class_dex_max", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 14 + 2 (DEX capped at 2, even though modifier is +4) = 16
        expect(computed?.armorClass).toBe(16)
      })
    })

    describe("with worn light armor (full DEX bonus)", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Leather Armor",
            category: "armor",
            armor_type: "light",
            armor_class: 11,
            armor_class_dex: true,
            armor_class_dex_max: null,
            worn: true,
          },
          testCtx.db
        )
      })

      test("uses armor AC with full DEX modifier", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 11 + 2 (full DEX) = 13
        expect(computed?.armorClass).toBe(13)
      })
    })

    describe("with armor and shield together", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Chain Mail",
            category: "armor",
            armor_type: "heavy",
            armor_class: 16,
            armor_class_dex: false,
            worn: true,
          },
          testCtx.db
        )

        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Shield",
            category: "shield",
            armor_modifier: 2,
            wielded: true,
          },
          testCtx.db
        )
      })

      test("combines armor AC and shield bonus", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 16 (armor) + 2 (shield) = 18
        expect(computed?.armorClass).toBe(18)
      })
    })

    describe("with unworn armor", () => {
      beforeEach(async () => {
        await itemFactory.create(
          {
            character_id: character.id,
            user_id: user.id,
            name: "Chain Mail",
            category: "armor",
            armor_type: "heavy",
            armor_class: 16,
            armor_class_dex: false,
            worn: false,
          },
          testCtx.db
        )
      })

      test("does not use armor AC", async () => {
        const computed = await computeCharacter(testCtx.db, character.id)

        // 10 + 2 (DEX) = 12, armor not worn
        expect(computed?.armorClass).toBe(12)
      })
    })
  })
})
