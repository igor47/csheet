import { beforeEach, describe, expect, test } from "bun:test"
import { create as createTrait } from "@src/db/char_traits"
import { findByCharacterId as findWildShapeUses } from "@src/db/char_wild_shape_uses"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { type Beast, getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { charBeastSeenFactory } from "@src/test/factories/char_beasts_seen"
import { charWildShapeUseFactory } from "@src/test/factories/char_wild_shape_use"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { elementExists, makeRequest, parseHtml } from "@src/test/http"

describe("Wild Shape UI", () => {
  const testCtx = useTestApp()

  describe("WildShapePanel on character page", () => {
    let user: User
    let character: Character

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

    describe("header section", () => {
      test("displays Max CR", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        expect(response.status).toBe(200)

        const document = await parseHtml(response)
        const panel = document.querySelector("#wildshape-panel")
        expect(panel).not.toBeNull()

        // Level 4 druid has max CR 1/2
        const body = panel?.textContent || ""
        expect(body).toContain("Max CR")
        expect(body).toContain("1/2")
      })

      test("displays uses available and max uses", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)
        const panel = document.querySelector("#wildshape-panel")
        const body = panel?.textContent || ""

        // Level 4 druid has 2 uses
        expect(body).toContain("Uses")
        expect(body).toContain("2/2")
      })

      test("displays restrictions when flight not allowed", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)
        const panel = document.querySelector("#wildshape-panel")
        const body = panel?.textContent || ""

        // Level 4 druid cannot fly
        expect(body).toContain("Restrictions")
        expect(body).toContain("No fly")
      })
    })

    describe("beast list with transform buttons", () => {
      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )
      })

      test("shows transform button for valid beasts", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)

        // Should have a transform button (arrow-repeat icon)
        expect(elementExists(document, ".bi-arrow-repeat")).toBe(true)
      })

      test("hides transform buttons when no uses available", async () => {
        // Use all 2 wild shape uses
        const beasts = getBeasts("srd52")
        const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        for (let i = 0; i < 2; i++) {
          await charWildShapeUseFactory.create(
            { character_id: character.id, beast_id: cat.id },
            testCtx.db
          )
        }

        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)

        // Should NOT have transform buttons
        expect(elementExists(document, ".bi-arrow-repeat")).toBe(false)
      })
    })

    describe("ongoing transformation display", () => {
      let cat: Beast

      beforeEach(async () => {
        const beasts = getBeasts("srd52")
        cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

        await charBeastSeenFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )

        // Start an ongoing transformation
        await charWildShapeUseFactory.create(
          { character_id: character.id, beast_id: cat.id },
          testCtx.db
        )
      })

      test("shows current form with beast name when active", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("Current Form")
        expect(body).toContain("Cat")
      })

      test("shows End button when transformed", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)
        const panel = document.querySelector("#wildshape-panel")

        // Should have End button (with x icon)
        const endButton = panel?.querySelector(".btn-outline-danger")
        expect(endButton).not.toBeNull()
        expect(endButton?.querySelector(".bi-x-lg")).not.toBeNull()
      })

      test("hides transform buttons during transformation", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        const document = await parseHtml(response)

        // Should NOT have transform buttons (arrow-repeat icon)
        expect(elementExists(document, ".bi-arrow-repeat")).toBe(false)
      })
    })
  })

  describe("GET /characters/:id/wildshape/activate", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 4 },
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

      const beasts = getBeasts("srd52")
      const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      await charBeastSeenFactory.create(
        { character_id: character.id, beast_id: cat.id },
        testCtx.db
      )
    })

    test("returns form with beast pre-selected", async () => {
      const beasts = getBeasts("srd52")
      const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/wildshape/activate?beast_id=${cat.id}`,
        {
          user,
          headers: { "HX-Request": "true" },
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("Transform into Cat")
      expect(body).toContain("Wild Shape Uses")
    })

    test("returns error for unauthorized access", async () => {
      const otherUser = await userFactory.create({}, testCtx.db)
      const beasts = getBeasts("srd52")
      const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/wildshape/activate?beast_id=${cat.id}`,
        {
          user: otherUser,
          headers: { "HX-Request": "true" },
        }
      )

      expect(response.status).toBe(403)
    })
  })

  describe("POST /characters/:id/wildshape/activate", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 4 },
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

      const beasts = getBeasts("srd52")
      const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      await charBeastSeenFactory.create(
        { character_id: character.id, beast_id: cat.id },
        testCtx.db
      )
    })

    test("creates transformation and updates panel", async () => {
      const beasts = getBeasts("srd52")
      const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      const formData = new URLSearchParams()
      formData.set("beast_id", cat.id)

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/wildshape/activate`,
        {
          user,
          method: "POST",
          headers: {
            "HX-Request": "true",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      // Should show success result
      expect(body).toContain("Transformation Started")
      expect(body).toContain("Cat")

      // Should also include updated panel with swapOob
      expect(body).toContain("Current Form")
    })

    test("returns error for invalid beast", async () => {
      const formData = new URLSearchParams()
      formData.set("beast_id", "nonexistent_beast")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/wildshape/activate`,
        {
          user,
          method: "POST",
          headers: {
            "HX-Request": "true",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      )

      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("not found")
    })
  })

  describe("POST /characters/:id/wildshape/end", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 4 },
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

      const beasts = getBeasts("srd52")
      const cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      await charBeastSeenFactory.create(
        { character_id: character.id, beast_id: cat.id },
        testCtx.db
      )

      // Start an ongoing transformation
      await charWildShapeUseFactory.create(
        { character_id: character.id, beast_id: cat.id },
        testCtx.db
      )
    })

    test("ends transformation and updates panel", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/wildshape/end`, {
        user,
        method: "POST",
        headers: {
          "HX-Request": "true",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "",
      })

      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      // Should NOT show "Currently transformed" anymore
      expect(body).not.toContain("Currently transformed")

      // Should show the panel (contains Wild Shape content)
      expect(body).toContain("Max CR")
    })
  })

  describe("beast HP damage ending transformation", () => {
    let user: User
    let character: Character
    let cat: Beast

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", class: "druid", level: 4 },
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

      const beasts = getBeasts("srd52")
      cat = beasts.find((b) => b.name.toLowerCase() === "cat")!

      await charBeastSeenFactory.create(
        { character_id: character.id, beast_id: cat.id },
        testCtx.db
      )

      // Start an ongoing transformation
      await charWildShapeUseFactory.create(
        { character_id: character.id, beast_id: cat.id },
        testCtx.db
      )
    })

    test("sets beast_hp to 0 when damage exceeds beast HP", async () => {
      // Cat has 2 HP, apply 5 damage to ensure it exceeds
      const formData = new URLSearchParams()
      formData.set("action", "lose")
      formData.set("amount", "5")
      formData.set("note", "test damage")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/hitpoints`,
        {
          user,
          method: "POST",
          headers: {
            "HX-Request": "true",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      )

      expect(response.status).toBe(200)

      // Check the wild shape use record in the database
      const uses = await findWildShapeUses(testCtx.db, character.id)
      expect(uses.length).toBe(1)

      const use = uses[0]!
      expect(use.ended_at).not.toBeNull()
      expect(use.beast_hp).toBe(0)
    })

    test("sets beast_hp to 0 when damage equals beast HP exactly", async () => {
      // Cat has 2 HP, apply exactly 2 damage
      const formData = new URLSearchParams()
      formData.set("action", "lose")
      formData.set("amount", String(cat.hitPoints))
      formData.set("note", "exact damage")

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/hitpoints`,
        {
          user,
          method: "POST",
          headers: {
            "HX-Request": "true",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      )

      expect(response.status).toBe(200)

      // Check the wild shape use record in the database
      const uses = await findWildShapeUses(testCtx.db, character.id)
      expect(uses.length).toBe(1)

      const use = uses[0]!
      expect(use.ended_at).not.toBeNull()
      expect(use.beast_hp).toBe(0)
    })
  })
})
