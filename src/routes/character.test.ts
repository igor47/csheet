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
      test("redirects to /characters/new", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/characters/new")
      })

      test("sets a flash message", async () => {
        const response = await makeRequest(testCtx.app, "/characters", {
          user,
        })

        // Check for flash cookie (flash messages are stored in cookies)
        const setCookie = response.headers.get("Set-Cookie")
        expect(setCookie).toContain("flash")
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

        // Verify database was updated
        const result = await testCtx.db`
          SELECT avatar_id FROM characters WHERE id = ${character.id}
        `
        expect(result[0].avatar_id).toBe(upload.id)
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
