import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters/:id/edit/coins", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/edit/coins")

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
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
        user,
      })

      expect(response.status).toBe(200)
    })

    test("renders the coins edit form with title", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
        user,
      })

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Edit Coins")
    })

    test("displays input fields for all 5 coin types", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
        user,
      })

      const document = await parseHtml(response)
      const coinTypes = ["pp", "gp", "ep", "sp", "cp"]

      for (const coinType of coinTypes) {
        const input = expectElement(document, `#${coinType}`)
        expect(input.getAttribute("type")).toBe("number")
        // No min="0" attribute since we accept negative deltas
        expect(input.getAttribute("min")).toBeNull()
      }
    })

    test("has a note textarea", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
        user,
      })

      const document = await parseHtml(response)
      const noteInput = expectElement(document, "#note")
      expect(noteInput.tagName).toBe("TEXTAREA")
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns 403", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
          user: otherUser,
        })

        expect(response.status).toBe(403)
      })
    })
  })
})

describe("POST /characters/:id/edit/coins", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const formData = new FormData()
      formData.append("gp", "50")

      const response = await makeRequest(testCtx.app, "/characters/test-id/edit/coins", {
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

    describe("with valid data", () => {
      test("updates coin values in database", async () => {
        const formData = new FormData()
        formData.append("pp", "5")
        formData.append("gp", "100")
        formData.append("ep", "0")
        formData.append("sp", "50")
        formData.append("cp", "25")
        formData.append("note", "Quest reward!")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)

        // Verify database was updated
        const updatedCoins = await testCtx.db`
          SELECT * FROM char_coins
          WHERE character_id = ${character.id}
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(updatedCoins[0].pp).toBe(5)
        expect(updatedCoins[0].gp).toBe(100)
        expect(updatedCoins[0].ep).toBe(0)
        expect(updatedCoins[0].sp).toBe(50)
        expect(updatedCoins[0].cp).toBe(25)
        expect(updatedCoins[0].note).toBe("Quest reward!")
      })

      test("returns OOB swap for inventory panel", async () => {
        const formData = new FormData()
        formData.append("pp", "1")
        formData.append("gp", "50")
        formData.append("ep", "0")
        formData.append("sp", "0")
        formData.append("cp", "0")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)

        const panel = expectElement(document, "#inventory-panel")
        expect(panel.attributes.getNamedItem("hx-swap-oob")?.value).toBe("true")
      })

      test("closes the modal", async () => {
        const formData = new FormData()
        formData.append("pp", "0")
        formData.append("gp", "25")
        formData.append("ep", "0")
        formData.append("sp", "0")
        formData.append("cp", "0")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.headers.get("HX-Trigger")).toContain("closeEditModal")
      })
    })

    describe("with invalid data", () => {
      test("rejects spending more coins than available", async () => {
        // Character starts with no coins
        const formData = new FormData()
        formData.append("pp", "0")
        formData.append("gp", "-10")
        formData.append("ep", "0")
        formData.append("sp", "0")
        formData.append("cp", "0")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)

        // Still showing form
        const title = expectElement(document, ".modal-title")
        expect(title.textContent).toBe("Edit Coins")

        // Check for error in DOM (general errors show in alert-danger)
        const errorAlert = document.querySelector(".alert-danger")
        expect(errorAlert).toBeTruthy()
        expect(errorAlert?.textContent).toContain("Insufficient funds")
      })

      test("rejects when no coins are changed", async () => {
        // Set initial coin values
        await testCtx.db`
          INSERT INTO char_coins (id, character_id, pp, gp, ep, sp, cp, created_at, updated_at)
          VALUES ('initial-coins', ${character.id}, 10, 50, 5, 20, 100, NOW(), NOW())
        `

        const formData = new FormData()
        formData.append("pp", "0")
        formData.append("gp", "0")
        formData.append("ep", "0")
        formData.append("sp", "0")
        formData.append("cp", "0")

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/edit/coins`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Must change at least one coin value")
      })
    })
  })
})

describe("GET /characters/:id/history/coins", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/history/coins")

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
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/history/coins`, {
        user,
      })

      expect(response.status).toBe(200)
    })

    test("renders the coins history modal with title", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/history/coins`, {
        user,
      })

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Coins History")
    })

    describe("with coin changes", () => {
      beforeEach(async () => {
        // Create some coin history
        await testCtx.db`
          INSERT INTO char_coins (id, character_id, pp, gp, ep, sp, cp, note, created_at, updated_at)
          VALUES
            ('coins-1', ${character.id}, 0, 10, 0, 5, 20, 'Starting gold', NOW(), NOW()),
            ('coins-2', ${character.id}, 0, 60, 0, 5, 20, 'Quest reward', NOW() + INTERVAL '1 second', NOW()),
            ('coins-3', ${character.id}, 1, 10, 0, 5, 20, 'Traded 50gp for 1pp', NOW() + INTERVAL '2 seconds', NOW())
        `
      })

      test("displays history table with correct headers", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/coins`,
          { user }
        )

        const document = await parseHtml(response)
        const table = expectElement(document, "table")
        const headers = table.querySelectorAll("th")

        const headerTexts = Array.from(headers).map((h) => h.textContent?.trim())
        expect(headerTexts).toContain("Date")
        expect(headerTexts).toContain("PP")
        expect(headerTexts).toContain("GP")
        expect(headerTexts).toContain("EP")
        expect(headerTexts).toContain("SP")
        expect(headerTexts).toContain("CP")
        expect(headerTexts).toContain("Note")
      })

      test("displays all coin changes in table rows", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/coins`,
          { user }
        )

        const document = await parseHtml(response)
        const rows = document.querySelectorAll("tbody tr")

        // Should have 3 history entries
        expect(rows.length).toBe(3)
      })

      test("displays notes in table", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/coins`,
          { user }
        )

        const html = await response.text()
        expect(html).toContain("Starting gold")
        expect(html).toContain("Quest reward")
        expect(html).toContain("Traded 50gp for 1pp")
      })

      test("shows most recent changes first", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/coins`,
          { user }
        )

        const html = await response.text()
        const tradedIndex = html.indexOf("Traded 50gp for 1pp")
        const startingIndex = html.indexOf("Starting gold")

        // Most recent "Traded" should appear before "Starting gold" in the HTML
        expect(tradedIndex).toBeLessThan(startingIndex)
      })
    })

    describe("with no coin changes", () => {
      test("shows no history message", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/coins`,
          { user }
        )

        const html = await response.text()
        expect(html).toContain("No coin history")
      })
    })
  })
})
