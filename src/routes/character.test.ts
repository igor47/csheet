import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { Upload } from "@src/db/uploads"
import { UploadStatus } from "@src/db/uploads"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { uploadFactory } from "@src/test/factories/upload"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      // Create a test user
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with no characters", () => {
      test("returns status 200 and shows empty state", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        expect(response.status).toBe(200)

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        // Check for empty state message
        expect(body).toContain("You haven't created any characters yet")
      })

      test("displays both Create and Import buttons in empty state", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        const document = await parseHtml(response)

        // Check for the empty state actions container
        const actionsContainer = expectElement(document, "#empty-state-actions")
        expect(actionsContainer).toBeDefined()

        // Check for Create button
        const createBtn = expectElement(document, "#create-character-btn")
        expect(createBtn.textContent).toContain("Create New Character")
        expect(createBtn.getAttribute("href")).toBe("/characters/new")

        // Check for Import button
        const importBtn = expectElement(document, "#import-character-btn")
        expect(importBtn.textContent).toContain("Import Existing Character")
        expect(importBtn.getAttribute("href")).toBe("/characters/import")
      })
    })

    describe("with a character", () => {
      let character: Character

      beforeEach(async () => {
        // Create a character for this user
        character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      })

      test("returns status 200", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        expect(response.status).toBe(200)
      })

      test("renders the character list page", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        const document = await parseHtml(response)

        // Check for page title
        const title = expectElement(document, "title")
        expect(title.textContent).toContain("My Characters")
      })

      test("displays the character name", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(character.name)
      })

      test("displays the character species", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(character.species)
      })

      describe("with multiple characters", () => {
        let character2: Character

        beforeEach(async () => {
          // Create a second character
          character2 = await characterFactory.create(
            {
              user_id: user.id,
              name: "Second Character",
            },
            testCtx.db
          )
        })

        test("displays all characters", async () => {
          const response = await makeRequest(testCtx.app, "/characters", {
            user,
          })

          const document = await parseHtml(response)
          const body = document.body.textContent || ""

          expect(body).toContain(character.name)
          expect(body).toContain(character2.name)
        })
      })
    })
  })
})

describe("POST /characters/:id/avatar", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("returns 401", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_id: "test-upload" }),
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character
    let upload: Upload

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    describe("with a completed upload", () => {
      beforeEach(async () => {
        upload = await uploadFactory.create(
          {
            user_id: user.id,
            status: UploadStatus.PENDING,
            content_type: "image/jpeg",
          },
          testCtx.db
        )

        // Mark as complete
        await testCtx.db`
          UPDATE uploads
          SET status = ${UploadStatus.COMPLETE},
              s3_key = ${`uploads/${upload.id}.jpeg`},
              completed_at = NOW()
          WHERE id = ${upload.id}
        `
      })

      test("sets the character avatar", async () => {
        const formData = new FormData()
        formData.append("upload_id", upload.id)

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/avatar`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)

        // Should return HTML with OOB swap
        const html = await response.text()
        expect(html).toContain("hx-swap-oob")
        expect(html).toContain("character-info")

        // Verify avatar was created in character_avatars table
        const result = await testCtx.db`
          SELECT upload_id, is_primary FROM character_avatars
          WHERE character_id = ${character.id}
        `
        expect(result.length).toBe(1)
        expect(result[0].upload_id).toBe(upload.id)
        expect(result[0].is_primary).toBe(true)
      })
    })

    describe("with a pending upload", () => {
      beforeEach(async () => {
        upload = await uploadFactory.create(
          {
            user_id: user.id,
            status: UploadStatus.PENDING,
          },
          testCtx.db
        )
      })

      test("returns error in modal", async () => {
        const formData = new FormData()
        formData.append("upload_id", upload.id)

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/avatar`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("not complete")
      })
    })

    describe("with another user's upload", () => {
      beforeEach(async () => {
        const otherUser = await userFactory.create({}, testCtx.db)
        upload = await uploadFactory.create(
          {
            user_id: otherUser.id,
            status: UploadStatus.PENDING,
          },
          testCtx.db
        )

        // Mark as complete
        await testCtx.db`
          UPDATE uploads
          SET status = ${UploadStatus.COMPLETE},
              s3_key = ${`uploads/${upload.id}.jpeg`},
              completed_at = NOW()
          WHERE id = ${upload.id}
        `
      })

      test("returns error in modal", async () => {
        const formData = new FormData()
        formData.append("upload_id", upload.id)

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/avatar`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Unauthorized")
      })
    })

    describe("without upload_id", () => {
      test("returns error in modal", async () => {
        const formData = new FormData()

        const response = await makeRequest(testCtx.app, `/characters/${character.id}/avatar`, {
          user,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Upload ID is required")
      })
    })
  })
})

describe("GET /characters?show_archived=true", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with no characters", () => {
      test("returns status 200 and shows empty state", async () => {
        const response = await makeRequest(testCtx.app, "/characters?show_archived=true", { user })

        expect(response.status).toBe(200)

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        // Check for empty state message for archived view
        expect(body).toContain("No characters to display")
      })
    })

    describe("with archived characters", () => {
      let character: Character

      beforeEach(async () => {
        character = await characterFactory.create({ user_id: user.id }, testCtx.db)
        // Archive the character
        await testCtx.db`UPDATE characters SET archived_at = CURRENT_TIMESTAMP WHERE id = ${character.id}`
      })

      test("displays archived characters", async () => {
        const response = await makeRequest(testCtx.app, "/characters?show_archived=true", { user })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(character.name)
        expect(body).toContain("Archived")
      })

      test("shows restore button", async () => {
        const response = await makeRequest(testCtx.app, "/characters?show_archived=true", { user })

        const document = await parseHtml(response)
        const restoreButton = expectElement(document, `[data-testid="unarchive-${character.id}"]`)

        expect(restoreButton.textContent?.trim()).toBe("Restore")
        expect(restoreButton.getAttribute("hx-post")).toBe(`/characters/${character.id}/unarchive`)
      })

      test("checkbox is checked", async () => {
        const response = await makeRequest(testCtx.app, "/characters?show_archived=true", { user })

        const document = await parseHtml(response)
        const checkbox = expectElement(document, "#showArchivedCheckbox")

        expect(checkbox.hasAttribute("checked")).toBe(true)
      })
    })

    describe("with both active and archived characters", () => {
      let activeChar: Character
      let archivedChar: Character

      beforeEach(async () => {
        activeChar = await characterFactory.create(
          { user_id: user.id, name: "Active Hero" },
          testCtx.db
        )
        archivedChar = await characterFactory.create(
          { user_id: user.id, name: "Archived Hero" },
          testCtx.db
        )
        await testCtx.db`UPDATE characters SET archived_at = CURRENT_TIMESTAMP WHERE id = ${archivedChar.id}`
      })

      test("displays both characters when show_archived=true", async () => {
        const response = await makeRequest(testCtx.app, "/characters?show_archived=true", { user })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(activeChar.name)
        expect(body).toContain(archivedChar.name)
      })

      test("displays only active character when show_archived is not set", async () => {
        const response = await makeRequest(testCtx.app, "/characters", { user })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(activeChar.name)
        expect(body).not.toContain(archivedChar.name)
      })

      test("shows checkbox when archived characters exist", async () => {
        const response = await makeRequest(testCtx.app, "/characters", { user })

        const document = await parseHtml(response)
        const checkbox = expectElement(document, "#showArchivedCheckbox")

        expect(checkbox.hasAttribute("checked")).toBe(false)
        expect(checkbox.getAttribute("hx-get")).toBe("/characters?show_archived=true")
      })
    })
  })
})

describe("POST /characters/:id/archive", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("archives the character", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/archive`, {
        user,
        method: "POST",
      })

      expect(response.status).toBe(204)

      // Verify character is archived in database
      const result = await testCtx.db`
        SELECT archived_at FROM characters WHERE id = ${character.id}
      `
      expect(result[0].archived_at).not.toBeNull()
    })

    test("redirects to characters page with show_archived=true", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/archive`, {
        user,
        method: "POST",
      })

      expect(response.headers.get("HX-Redirect")).toBe("/characters?show_archived=true")
    })

    test("sets success flash message", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/archive`, {
        user,
        method: "POST",
      })

      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })

    describe("when character is already archived", () => {
      beforeEach(async () => {
        await testCtx.db`UPDATE characters SET archived_at = CURRENT_TIMESTAMP WHERE id = ${character.id}`
      })

      test("returns error", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}/archive`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
        const setCookie = response.headers.get("Set-Cookie")
        expect(setCookie).toContain("flash")
      })
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns unauthorized", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}/archive`, {
          user: otherUser,
          method: "POST",
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })
  })
})

describe("POST /characters/:id/unarchive", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
      // Archive the character
      await testCtx.db`UPDATE characters SET archived_at = CURRENT_TIMESTAMP WHERE id = ${character.id}`
    })

    test("unarchives the character", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/unarchive`, {
        user,
        method: "POST",
      })

      expect(response.status).toBe(204)

      // Verify character is unarchived in database
      const result = await testCtx.db`
        SELECT archived_at FROM characters WHERE id = ${character.id}
      `
      expect(result[0].archived_at).toBeNull()
    })

    test("redirects to characters page", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/unarchive`, {
        user,
        method: "POST",
      })

      expect(response.headers.get("HX-Redirect")).toBe("/characters")
    })

    test("sets success flash message", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/unarchive`, {
        user,
        method: "POST",
      })

      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })

    describe("when character is already active", () => {
      beforeEach(async () => {
        await testCtx.db`UPDATE characters SET archived_at = NULL WHERE id = ${character.id}`
      })

      test("returns error", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}/unarchive`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
      })
    })

    describe("when character name is already in use", () => {
      beforeEach(async () => {
        // Create another active character with the same name
        await characterFactory.create({ user_id: user.id, name: character.name }, testCtx.db)
      })

      test("returns error", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}/unarchive`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
        const setCookie = response.headers.get("Set-Cookie")
        expect(setCookie).toContain("flash")
      })
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns unauthorized", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}/unarchive`, {
          user: otherUser,
          method: "POST",
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })
  })
})

describe("GET /characters/:id", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const character = await characterFactory.create({ user_id: user.id }, testCtx.db)

      const response = await makeRequest(testCtx.app, `/characters/${character.id}`)

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

    describe("when character belongs to another user", () => {
      test("redirects to /characters", async () => {
        const otherUser = await userFactory.create({}, testCtx.db)

        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, {
          user: otherUser,
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })

    describe("when character belongs to the user", () => {
      test("renders the character sheet", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })

        expect(response.status).toBe(200)
        const body = await response.text()
        expect(body).toContain(character.name)
      })
    })
  })
})

describe("GET /characters/:id/history/:field", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const character = await characterFactory.create({ user_id: user.id }, testCtx.db)

      const response = await makeRequest(testCtx.app, `/characters/${character.id}/history/class`)

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

    describe("when character belongs to another user", () => {
      test("redirects to /characters", async () => {
        const otherUser = await userFactory.create({}, testCtx.db)

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/hitpoints`,
          { user: otherUser }
        )

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters")
      })
    })

    describe("when character belongs to the user", () => {
      test("renders the history", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/class`,
          {
            user,
          }
        )

        expect(response.status).toBe(200)
      })
    })
  })
})

describe("Character archiving - name reuse", () => {
  const testCtx = useTestApp()

  describe("when a character is archived", () => {
    let user: User
    let archivedCharacter: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      archivedCharacter = await characterFactory.create(
        { user_id: user.id, name: "Test Hero" },
        testCtx.db
      )
      // Archive the character
      await testCtx.db`UPDATE characters SET archived_at = CURRENT_TIMESTAMP WHERE id = ${archivedCharacter.id}`
    })

    test("allows creating a new character with the same name", async () => {
      // Attempt to create a new character with the same name
      const newCharacter = await characterFactory.create(
        { user_id: user.id, name: "Test Hero" },
        testCtx.db
      )

      expect(newCharacter.name).toBe("Test Hero")
      expect(newCharacter.id).not.toBe(archivedCharacter.id)
    })

    test("archived character is not in active character list", async () => {
      const response = await makeRequest(testCtx.app, "/characters", { user })

      // Should show empty state since there's an archived character (don't redirect)
      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("You haven't created any characters yet")
      // Should show checkbox since archived characters exist
      expect(body).toContain("Show archived characters")
    })
  })
})
