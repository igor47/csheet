import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters/:id/edit/abilities", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/edit/abilities")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("returns status 200", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/abilities`,
        {
          user,
        }
      )

      expect(response.status).toBe(200)
    })

    test("renders the abilities edit form with title", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/abilities`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Edit Abilities")
    })

    test("displays input fields for all 6 abilities", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/abilities`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const abilities = [
        "strength",
        "dexterity",
        "constitution",
        "intelligence",
        "wisdom",
        "charisma",
      ]

      for (const ability of abilities) {
        const scoreInput = expectElement(document, `#${ability}_score`)
        expect(scoreInput.getAttribute("type")).toBe("number")
        expect(scoreInput.getAttribute("min")).toBe("1")
        expect(scoreInput.getAttribute("max")).toBe("30")

        const profInput = expectElement(document, `#${ability}_proficient`)
        expect(profInput.getAttribute("type")).toBe("checkbox")
      }
    })

    test("pre-fills current ability scores in inputs", async () => {
      // Get current strength score from DB
      const currentAbilities = await testCtx.db`
        SELECT score FROM char_abilities
        WHERE character_id = ${character.id}
        AND ability = 'strength'
        ORDER BY created_at DESC
        LIMIT 1
      `
      const currentStrength = currentAbilities[0].score

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/abilities`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const strengthInput = expectElement(document, "#strength_score")
      expect(strengthInput.getAttribute("value")).toBe(currentStrength.toString())
    })

    test("pre-checks proficiency checkboxes for proficient abilities", async () => {
      // Set wisdom as proficient (use future timestamp to ensure it's the latest)
      await testCtx.db`
        INSERT INTO char_abilities (id, character_id, ability, score, proficiency, created_at, updated_at)
        VALUES (
          'test-ability-prof',
          ${character.id},
          'wisdom',
          16,
          true,
          NOW() + INTERVAL '1 second',
          NOW() + INTERVAL '1 second'
        )
      `

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/abilities`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const wisdomProfInput = expectElement(document, "#wisdom_proficient")
      // When checked={true}, Hono JSX renders checked="" attribute
      expect(wisdomProfInput.getAttribute("checked")).toBe("")
    })

    test("has a note textarea", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/abilities`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const noteInput = expectElement(document, "#note")
      expect(noteInput.tagName).toBe("TEXTAREA")
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("redirects to /characters", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user: otherUser,
          }
        )

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })
  })
})

describe("POST /characters/:id/edit/abilities", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const formData = new FormData()
      formData.append("strength_score", "16")

      const response = await makeRequest(testCtx.app, "/characters/test-id/edit/abilities", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    describe("with valid data changing one ability", () => {
      test("updates the ability score in database", async () => {
        const formData = new FormData()
        formData.append("strength_score", "18") // Change strength from default 10
        formData.append("dexterity_score", "10")
        formData.append("constitution_score", "10")
        formData.append("intelligence_score", "10")
        formData.append("wisdom_score", "10")
        formData.append("charisma_score", "10")
        formData.append("note", "Leveled up!")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        // Verify database was updated
        const updatedAbilities = await testCtx.db`
          SELECT * FROM char_abilities
          WHERE character_id = ${character.id}
          AND ability = 'strength'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(updatedAbilities[0].score).toBe(18)
        expect(updatedAbilities[0].note).toBe("Leveled up!")
      })

      test("returns OOB swaps for dependent panels", async () => {
        const formData = new FormData()
        formData.append("strength_score", "16")
        formData.append("dexterity_score", "10")
        formData.append("constitution_score", "10")
        formData.append("intelligence_score", "10")
        formData.append("wisdom_score", "10")
        formData.append("charisma_score", "10")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)

        for (const panelClass of ["#abilities-panel", "#character-info", "#skills-panel"]) {
          const panel = expectElement(document, panelClass)
          expect(panel.attributes.getNamedItem("hx-swap-oob")?.value).toBe("true")
        }
      })

      test("closes the modal", async () => {
        const formData = new FormData()
        formData.append("strength_score", "16")
        formData.append("dexterity_score", "10")
        formData.append("constitution_score", "10")
        formData.append("intelligence_score", "10")
        formData.append("wisdom_score", "10")
        formData.append("charisma_score", "10")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.headers.get("HX-Trigger")).toContain("closeEditModal")
      })
    })

    describe("with valid data changing multiple abilities", () => {
      test("updates all changed abilities with same note", async () => {
        const formData = new FormData()
        formData.append("strength_score", "18") // Change
        formData.append("strength_proficient", "on") // Change
        formData.append("dexterity_score", "14") // Change
        formData.append("constitution_score", "10")
        formData.append("intelligence_score", "10")
        formData.append("wisdom_score", "10")
        formData.append("charisma_score", "10")
        formData.append("note", "Multiple changes")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        // Verify strength change
        const strengthAbility = await testCtx.db`
          SELECT * FROM char_abilities
          WHERE character_id = ${character.id}
          AND ability = 'strength'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(strengthAbility[0].score).toBe(18)
        expect(strengthAbility[0].proficiency).toBe(true)
        expect(strengthAbility[0].note).toBe("Multiple changes")

        // Verify dexterity change
        const dexAbility = await testCtx.db`
          SELECT * FROM char_abilities
          WHERE character_id = ${character.id}
          AND ability = 'dexterity'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(dexAbility[0].score).toBe(14)
        expect(dexAbility[0].note).toBe("Multiple changes")
      })

      test("only creates records for changed abilities", async () => {
        // Count existing abilities
        const beforeCount = await testCtx.db`
          SELECT COUNT(*) as count FROM char_abilities
          WHERE character_id = ${character.id}
        `

        const formData = new FormData()
        formData.append("strength_score", "16") // Change only this
        formData.append("dexterity_score", "10") // No change
        formData.append("constitution_score", "10") // No change
        formData.append("intelligence_score", "10") // No change
        formData.append("wisdom_score", "10") // No change
        formData.append("charisma_score", "10") // No change

        await makeRequest(testCtx.app, `/characters/${character.id}/edit/abilities`, {
          user,
          method: "POST",
          body: formData,
        })

        // Should only create 1 new record
        const afterCount = await testCtx.db`
          SELECT COUNT(*) as count FROM char_abilities
          WHERE character_id = ${character.id}
        `
        // Cast to number to avoid string concatenation
        const before = Number(beforeCount[0].count)
        const after = Number(afterCount[0].count)
        expect(after).toBe(before + 1)
      })
    })

    describe("with invalid data", () => {
      test("rejects score below 1 with error message", async () => {
        const formData = new FormData()
        formData.append("strength_score", "0")
        formData.append("dexterity_score", "10")
        formData.append("constitution_score", "10")
        formData.append("intelligence_score", "10")
        formData.append("wisdom_score", "10")
        formData.append("charisma_score", "10")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)

        // Still showing form
        const title = expectElement(document, ".modal-title")
        expect(title.textContent).toBe("Edit Abilities")

        // Check for error in DOM
        const errorFeedback = document.querySelector(".invalid-feedback")
        expect(errorFeedback).toBeTruthy()
        expect(errorFeedback?.textContent).toMatch(
          /Must be at least 1|must be between 1 and 30|Score must be between/i
        )
      })

      test("rejects score above 30 with error message", async () => {
        const formData = new FormData()
        formData.append("strength_score", "31")
        formData.append("dexterity_score", "10")
        formData.append("constitution_score", "10")
        formData.append("intelligence_score", "10")
        formData.append("wisdom_score", "10")
        formData.append("charisma_score", "10")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toMatch(/Cannot exceed 30|must be between 1 and 30|Score must be between/i)
      })

      test("rejects when no abilities are changed", async () => {
        // Get current scores to submit unchanged
        const currentAbilities = await testCtx.db`
          SELECT ability, score, proficiency
          FROM char_abilities
          WHERE character_id = ${character.id}
          AND created_at IN (
            SELECT MAX(created_at)
            FROM char_abilities
            WHERE character_id = ${character.id}
            GROUP BY ability
          )
          ORDER BY ability
        `

        const formData = new FormData()
        for (const ability of currentAbilities) {
          formData.append(`${ability.ability}_score`, ability.score.toString())
          if (ability.proficiency) {
            formData.append(`${ability.ability}_proficient`, "on")
          }
        }

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/abilities`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Must change at least one ability")
      })
    })
  })
})

describe("GET /characters/:id/history/abilities", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/history/abilities")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("returns status 200", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/abilities`,
        { user }
      )

      expect(response.status).toBe(200)
    })

    test("renders the abilities history modal with title", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/abilities`,
        { user }
      )

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Ability History")
    })

    describe("with ability changes", () => {
      beforeEach(async () => {
        // Create some ability history (use future timestamps to be after factory-created abilities)
        await testCtx.db`
          INSERT INTO char_abilities (id, character_id, ability, score, proficiency, note, created_at, updated_at)
          VALUES
            ('ability-1', ${character.id}, 'strength', 14, false, 'Initial', NOW() + INTERVAL '1 second', NOW()),
            ('ability-2', ${character.id}, 'strength', 16, false, 'Leveled up', NOW() + INTERVAL '2 seconds', NOW()),
            ('ability-3', ${character.id}, 'wisdom', 12, false, 'Initial', NOW() + INTERVAL '1 second', NOW()),
            ('ability-4', ${character.id}, 'wisdom', 14, true, 'Leveled up', NOW() + INTERVAL '2 seconds', NOW())
        `
      })

      test("displays history table with correct headers", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const document = await parseHtml(response)
        const table = expectElement(document, "table")
        const headers = table.querySelectorAll("th")

        const headerTexts = Array.from(headers).map((h) => h.textContent?.trim())
        expect(headerTexts).toContain("Date")
        expect(headerTexts).toContain("Ability")
        expect(headerTexts).toContain("Score")
        expect(headerTexts).toContain("Proficiency")
        expect(headerTexts).toContain("Note")
      })

      test("displays all ability changes in table rows", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const document = await parseHtml(response)
        const rows = document.querySelectorAll("tbody tr")

        // Should have 4 history entries
        expect(rows.length).toBeGreaterThanOrEqual(4)
      })

      test("displays proficiency badges", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const document = await parseHtml(response)
        const badges = document.querySelectorAll(".badge")

        const badgeTexts = Array.from(badges).map((b) => b.textContent?.trim())
        expect(badgeTexts).toContain("Proficient")
        expect(badgeTexts).toContain("Not Proficient")
      })

      test("displays notes in table", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const html = await response.text()
        expect(html).toContain("Initial")
        expect(html).toContain("Leveled up")
      })

      test("shows most recent changes first", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const html = await response.text()
        const leveledUpIndex = html.indexOf("Leveled up")
        const initialIndex = html.indexOf("Initial")

        // "Leveled up" should appear before "Initial" in the HTML
        expect(leveledUpIndex).toBeLessThan(initialIndex)
      })

      test("groups simultaneous changes with rowspan", async () => {
        // Add simultaneous changes (same timestamp and note)
        const now = new Date()
        await testCtx.db`
          INSERT INTO char_abilities (id, character_id, ability, score, proficiency, note, created_at, updated_at)
          VALUES
            ('ability-5', ${character.id}, 'dexterity', 16, false, 'Bulk update', ${now}, ${now}),
            ('ability-6', ${character.id}, 'constitution', 14, true, 'Bulk update', ${now}, ${now})
        `

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const document = await parseHtml(response)
        const rowspanCells = document.querySelectorAll("td[rowspan]")

        // Should have at least one rowspan for grouped changes
        expect(rowspanCells.length).toBeGreaterThan(0)

        // Verify "Bulk update" appears in one of the rowspan cells (the note column)
        const rowspanTexts = Array.from(rowspanCells).map((cell) => cell.textContent || "")
        expect(rowspanTexts.some((text) => text.includes("Bulk update"))).toBe(true)
      })
    })

    describe("with no ability changes", () => {
      beforeEach(async () => {
        // Delete initial abilities
        await testCtx.db`
          DELETE FROM char_abilities WHERE character_id = ${character.id}
        `
      })

      test("shows no history message", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/abilities`,
          { user }
        )

        const html = await response.text()
        expect(html).toContain("No ability history")
      })
    })
  })
})
