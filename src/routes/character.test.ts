import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
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
