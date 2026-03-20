import { beforeEach, describe, expect, test } from "bun:test"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /welcome", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/welcome")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    test("renders the welcome page", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", { user })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const title = expectElement(document, "h1")
      expect(title.textContent).toContain("Welcome to CSheet")
    })

    test("includes marketing opt-in checkbox checked by default", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", { user })

      const document = await parseHtml(response)
      const checkbox = expectElement(document, "#marketing_opt_in")
      expect(checkbox.getAttribute("checked")).toBe("")
    })

    test("includes link to GitHub issues", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", { user })

      const document = await parseHtml(response)
      const link = expectElement(document, 'a[href*="github.com/igor47/csheet/issues"]')
      expect(link).toBeTruthy()
    })

    test("preserves redirect parameter in hidden field", async () => {
      const response = await makeRequest(testCtx.app, "/welcome?redirect=/campaigns", { user })

      const document = await parseHtml(response)
      const hidden = expectElement(document, 'input[name="redirect"]')
      expect(hidden.getAttribute("value")).toBe("/campaigns")
    })
  })
})

describe("POST /welcome", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", {
        method: "POST",
        body: new URLSearchParams({}).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      // Reset welcomed_at so user is "unwelcomed"
      await testCtx.db`UPDATE users SET welcomed_at = NULL WHERE id = ${user.id}`
    })

    test("sets welcomed_at and redirects to /characters", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", {
        user,
        method: "POST",
        body: new URLSearchParams({}).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/characters")

      const result = await testCtx.db`SELECT welcomed_at FROM users WHERE id = ${user.id}`
      expect(result[0].welcomed_at).not.toBeNull()
    })

    test("opts into marketing when checkbox is checked", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", {
        user,
        method: "POST",
        body: new URLSearchParams({ marketing_opt_in: "on" }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(302)

      const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
      expect(result[0].marketing_opt_in).toBe(true)
    })

    test("stays opted out when checkbox is unchecked", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", {
        user,
        method: "POST",
        body: new URLSearchParams({}).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(302)

      const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
      expect(result[0].marketing_opt_in).toBe(false)
    })

    test("redirects to the specified redirect path", async () => {
      const response = await makeRequest(testCtx.app, "/welcome", {
        user,
        method: "POST",
        body: new URLSearchParams({ redirect: "/campaigns" }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")
    })
  })
})

