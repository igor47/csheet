import { beforeEach, describe, expect, test } from "bun:test"
import { create as createTrait } from "@src/db/char_traits"
import { endTransformation } from "@src/db/char_wild_shape_uses"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { charWildShapeUseFactory } from "@src/test/factories/char_wild_shape_use"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters/:id/history/rests", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const character = await characterFactory.create({ user_id: user.id }, testCtx.db)

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/history/rests`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 3 },
        testCtx.db
      )
    })

    describe("when character belongs to another user", () => {
      test("redirects to /characters", async () => {
        const otherUser = await userFactory.create({}, testCtx.db)

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/rests`,
          { user: otherUser }
        )

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })

    describe("when character belongs to the user", () => {
      describe("with no rest history", () => {
        test("renders empty state", async () => {
          const response = await makeRequest(
            testCtx.app,
            `/characters/${character.id}/history/rests`,
            { user }
          )

          expect(response.status).toBe(200)
          const document = await parseHtml(response)
          const body = document.body.textContent || ""

          expect(body).toContain("Rest History")
          expect(body).toContain("No rest history found")
        })
      })

      describe("with rest history", () => {
        beforeEach(async () => {
          // Insert a short rest record directly
          const shortRestDetails = {
            diceRolls: [{ die: 10, roll: 3, modifier: 2 }],
            arcaneRecoveryUsed: false,
          }
          await testCtx.db`
            INSERT INTO char_rests (id, character_id, rest_type, hp_restored, hit_dice_spent, hit_dice_restored, spell_slots_restored, details, note)
            VALUES (
              'test-short-rest-01',
              ${character.id},
              'short',
              5,
              1,
              0,
              0,
              ${shortRestDetails},
              'Rested in the tavern'
            )
          `

          // Insert a long rest record
          await testCtx.db`
            INSERT INTO char_rests (id, character_id, rest_type, hp_restored, hit_dice_spent, hit_dice_restored, spell_slots_restored, details, note)
            VALUES (
              'test-long-rest-01',
              ${character.id},
              'long',
              20,
              0,
              2,
              4,
              NULL,
              'Camped overnight'
            )
          `
        })

        test("renders rest history table", async () => {
          const response = await makeRequest(
            testCtx.app,
            `/characters/${character.id}/history/rests`,
            { user }
          )

          expect(response.status).toBe(200)
          const document = await parseHtml(response)
          const body = document.body.textContent || ""

          expect(body).toContain("Rest History")
          expect(body).toContain("Rested in the tavern")
          expect(body).toContain("Camped overnight")
        })

        test("displays short rest with correct icon and summary", async () => {
          const response = await makeRequest(
            testCtx.app,
            `/characters/${character.id}/history/rests`,
            { user }
          )

          expect(response.status).toBe(200)
          const html = await response.text()

          // Check for short rest indicator
          expect(html).toContain("bi-cup-hot")
          expect(html).toContain("Short")
          // Check for summary details
          expect(html).toContain("+5 HP")
          expect(html).toContain("1 HD spent")
        })

        test("displays long rest with correct icon and summary", async () => {
          const response = await makeRequest(
            testCtx.app,
            `/characters/${character.id}/history/rests`,
            { user }
          )

          expect(response.status).toBe(200)
          const html = await response.text()

          // Check for long rest indicator
          expect(html).toContain("bi-moon-stars")
          expect(html).toContain("Long")
          // Check for summary details
          expect(html).toContain("+20 HP")
          expect(html).toContain("2 HD restored")
          expect(html).toContain("4 slots restored")
        })
      })
    })
  })
})

describe("POST /characters/:id/rest/short", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Create a fighter with some levels (d10 hit dice)
      character = await characterFactory.create(
        { user_id: user.id, class: "fighter", level: 3 },
        testCtx.db
      )
    })

    test("creates a rest record", async () => {
      const formData = new FormData()
      formData.append("note", "Quick break")
      // Don't spend any dice - just take a simple short rest

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/rest/short`, {
        user,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(200)

      // Verify a rest record was created
      const result = await testCtx.db`
        SELECT * FROM char_rests WHERE character_id = ${character.id}
      `
      expect(result.length).toBe(1)
      expect(result[0].rest_type).toBe("short")
      expect(result[0].note).toBe("Quick break")
    })

    describe("when spending hit dice", () => {
      beforeEach(async () => {
        // Reduce HP first so spending dice actually heals
        await testCtx.db`
          INSERT INTO char_hp (id, character_id, delta, note)
          VALUES ('test-hp-loss', ${character.id}, -10, 'Took damage')
        `
      })

      test("records hit dice spent", async () => {
        const formData = new FormData()
        formData.append("note", "Healing up")
        // The form uses dot notation and requires both die value and roll
        formData.append("dice.0.die", "10")
        formData.append("dice.0.roll", "5")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/rest/short`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)

        // Verify the rest record includes hit dice spent
        const result = await testCtx.db`
          SELECT * FROM char_rests WHERE character_id = ${character.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].hit_dice_spent).toBe(1)
        expect(result[0].hp_restored).toBeGreaterThan(0)

        // Verify details contain dice rolls
        const details = result[0].details
        expect(details.diceRolls).toBeDefined()
        expect(details.diceRolls.length).toBe(1)
        expect(details.diceRolls[0].die).toBe(10)
        expect(details.diceRolls[0].roll).toBe(5)
      })
    })

    describe("when druid has used wild shape (SRD 5.1)", () => {
      let druidCharacter: Character

      beforeEach(async () => {
        // Create a SRD 5.1 druid
        druidCharacter = await characterFactory.create(
          { user_id: user.id, ruleset: "srd51", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        await createTrait(testCtx.db, {
          character_id: druidCharacter.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })

        // Use both wild shape uses
        const use1 = await charWildShapeUseFactory.create(
          { character_id: druidCharacter.id, beast_id: "srd51_wolf" },
          testCtx.db
        )
        await endTransformation(testCtx.db, use1.id)

        const use2 = await charWildShapeUseFactory.create(
          { character_id: druidCharacter.id, beast_id: "srd51_cat" },
          testCtx.db
        )
        await endTransformation(testCtx.db, use2.id)
      })

      test("records all wild shape uses restored", async () => {
        const formData = new FormData()
        formData.append("note", "Quick rest after transforming")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${druidCharacter.id}/rest/short`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)

        // Verify wild shape uses restored is recorded
        const result = await testCtx.db`
          SELECT * FROM char_rests WHERE character_id = ${druidCharacter.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].wild_shape_uses_restored).toBe(2)

        // Verify the uses are actually recovered
        const unrecovered = await testCtx.db`
          SELECT * FROM char_wild_shape_uses
          WHERE character_id = ${druidCharacter.id} AND recovered_at IS NULL
        `
        expect(unrecovered.length).toBe(0)
      })
    })

    describe("when druid has used wild shape (SRD 5.2)", () => {
      let druidCharacter: Character

      beforeEach(async () => {
        // Create a SRD 5.2 druid
        druidCharacter = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        await createTrait(testCtx.db, {
          character_id: druidCharacter.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })

        // Use both wild shape uses
        const use1 = await charWildShapeUseFactory.create(
          { character_id: druidCharacter.id, beast_id: "srd52_wolf" },
          testCtx.db
        )
        await endTransformation(testCtx.db, use1.id)

        const use2 = await charWildShapeUseFactory.create(
          { character_id: druidCharacter.id, beast_id: "srd52_cat" },
          testCtx.db
        )
        await endTransformation(testCtx.db, use2.id)
      })

      test("records only one wild shape use restored", async () => {
        const formData = new FormData()
        formData.append("note", "Quick rest after transforming")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${druidCharacter.id}/rest/short`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)

        // Verify only one wild shape use is restored (SRD 5.2 rule)
        const result = await testCtx.db`
          SELECT * FROM char_rests WHERE character_id = ${druidCharacter.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].wild_shape_uses_restored).toBe(1)

        // Verify only one use is recovered, one still unrecovered
        const unrecovered = await testCtx.db`
          SELECT * FROM char_wild_shape_uses
          WHERE character_id = ${druidCharacter.id} AND recovered_at IS NULL
        `
        expect(unrecovered.length).toBe(1)
      })
    })
  })
})

describe("POST /characters/:id/rest/long", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Create a wizard with some levels
      character = await characterFactory.create(
        { user_id: user.id, class: "wizard", level: 3 },
        testCtx.db
      )
    })

    test("creates a rest record", async () => {
      const formData = new FormData()
      formData.append("note", "Slept at the inn")

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/rest/long`, {
        user,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(200)

      // Verify a rest record was created
      const result = await testCtx.db`
        SELECT * FROM char_rests WHERE character_id = ${character.id}
      `
      expect(result.length).toBe(1)
      expect(result[0].rest_type).toBe("long")
      expect(result[0].note).toBe("Slept at the inn")
    })

    describe("when character has spent hit dice", () => {
      beforeEach(async () => {
        // Spend a hit die
        await testCtx.db`
          INSERT INTO char_hit_dice (id, character_id, die_value, action, note)
          VALUES ('test-hd-spend', ${character.id}, 6, 'use', 'Used in combat')
        `
      })

      test("records hit dice restored", async () => {
        const formData = new FormData()
        formData.append("note", "Full night sleep")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/rest/long`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)

        // Verify the rest record includes hit dice restored
        const result = await testCtx.db`
          SELECT * FROM char_rests WHERE character_id = ${character.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].hit_dice_restored).toBe(1)
      })
    })

    describe("when character has used spell slots", () => {
      beforeEach(async () => {
        // Use some spell slots
        await testCtx.db`
          INSERT INTO char_spell_slots (id, character_id, slot_level, action, note)
          VALUES
            ('test-slot-use-1', ${character.id}, 1, 'use', 'Cast Shield'),
            ('test-slot-use-2', ${character.id}, 2, 'use', 'Cast Misty Step')
        `
      })

      test("records spell slots restored", async () => {
        const formData = new FormData()
        formData.append("note", "Meditated all night")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/rest/long`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)

        // Verify the rest record includes spell slots restored
        const result = await testCtx.db`
          SELECT * FROM char_rests WHERE character_id = ${character.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].spell_slots_restored).toBe(2)
      })
    })

    describe("when druid has used wild shape", () => {
      let druidCharacter: Character

      beforeEach(async () => {
        // Create a SRD 5.2 druid (long rest recovers all for both rulesets)
        druidCharacter = await characterFactory.create(
          { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 2 },
          testCtx.db
        )
        await createTrait(testCtx.db, {
          character_id: druidCharacter.id,
          name: "Wild Shape",
          description: "You can transform into a beast you have seen.",
          source: "class",
          source_detail: "druid",
          level: 2,
          note: null,
        })

        // Use both wild shape uses
        const use1 = await charWildShapeUseFactory.create(
          { character_id: druidCharacter.id, beast_id: "srd52_wolf" },
          testCtx.db
        )
        await endTransformation(testCtx.db, use1.id)

        const use2 = await charWildShapeUseFactory.create(
          { character_id: druidCharacter.id, beast_id: "srd52_cat" },
          testCtx.db
        )
        await endTransformation(testCtx.db, use2.id)
      })

      test("records all wild shape uses restored", async () => {
        const formData = new FormData()
        formData.append("note", "Full night rest")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${druidCharacter.id}/rest/long`,
          { user, method: "POST", body: formData }
        )

        expect(response.status).toBe(200)

        // Verify all wild shape uses are restored
        const result = await testCtx.db`
          SELECT * FROM char_rests WHERE character_id = ${druidCharacter.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].wild_shape_uses_restored).toBe(2)

        // Verify all uses are actually recovered
        const unrecovered = await testCtx.db`
          SELECT * FROM char_wild_shape_uses
          WHERE character_id = ${druidCharacter.id} AND recovered_at IS NULL
        `
        expect(unrecovered.length).toBe(0)
      })
    })
  })
})
