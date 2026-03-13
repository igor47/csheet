import { beforeEach, describe, expect, test } from "bun:test"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /profile", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/profile")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    test("renders profile page", async () => {
      const response = await makeRequest(testCtx.app, "/profile", { user })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const title = expectElement(document, "h1")
      expect(title.textContent).toContain("Profile")
    })

    test("shows user email as readonly", async () => {
      const response = await makeRequest(testCtx.app, "/profile", { user })

      const document = await parseHtml(response)
      const emailInput = expectElement(document, "#email") as HTMLInputElement
      expect(emailInput.getAttribute("value")).toBe(user.email)
      expect(emailInput.getAttribute("readonly")).toBe("")
      expect(emailInput.getAttribute("disabled")).toBe("")
    })

    test("shows empty name field when user has no name", async () => {
      const response = await makeRequest(testCtx.app, "/profile", { user })

      const document = await parseHtml(response)
      const nameInput = expectElement(document, "#name") as HTMLInputElement
      expect(nameInput.getAttribute("value")).toBe("")
    })

    describe("when user has a name set", () => {
      beforeEach(async () => {
        // Update user with a name
        await testCtx.db`UPDATE users SET name = 'Test Name' WHERE id = ${user.id}`
        user.name = "Test Name"
      })

      test("shows existing name in form", async () => {
        const response = await makeRequest(testCtx.app, "/profile", { user })

        const document = await parseHtml(response)
        const nameInput = expectElement(document, "#name") as HTMLInputElement
        expect(nameInput.getAttribute("value")).toBe("Test Name")
      })
    })
  })
})

describe("POST /profile", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/profile", {
        method: "POST",
        body: new URLSearchParams({ name: "New Name" }).toString(),
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
    })

    test("updates user name and redirects with flash", async () => {
      const response = await makeRequest(testCtx.app, "/profile", {
        user,
        method: "POST",
        body: new URLSearchParams({ name: "New Display Name" }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(204)
      expect(response.headers.get("HX-Redirect")).toBe("/profile")

      // Verify database was updated
      const result = await testCtx.db`SELECT name FROM users WHERE id = ${user.id}`
      expect(result[0].name).toBe("New Display Name")
    })

    test("allows clearing name to empty", async () => {
      // First set a name
      await testCtx.db`UPDATE users SET name = 'Old Name' WHERE id = ${user.id}`

      const response = await makeRequest(testCtx.app, "/profile", {
        user,
        method: "POST",
        body: new URLSearchParams({ name: "" }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(204)

      // Verify database was updated to null
      const result = await testCtx.db`SELECT name FROM users WHERE id = ${user.id}`
      expect(result[0].name).toBe(null)
    })

    test("trims whitespace from name", async () => {
      const response = await makeRequest(testCtx.app, "/profile", {
        user,
        method: "POST",
        body: new URLSearchParams({ name: "  Trimmed Name  " }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(204)

      const result = await testCtx.db`SELECT name FROM users WHERE id = ${user.id}`
      expect(result[0].name).toBe("Trimmed Name")
    })

    test("opts into marketing emails when checkbox is checked", async () => {
      // Default is true, so first opt out
      await testCtx.db`UPDATE users SET marketing_opt_in = false WHERE id = ${user.id}`

      const response = await makeRequest(testCtx.app, "/profile", {
        user,
        method: "POST",
        body: new URLSearchParams({ name: "", marketing_opt_in: "on" }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(204)

      const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
      expect(result[0].marketing_opt_in).toBe(true)
    })

    test("opts out of marketing emails when checkbox is unchecked", async () => {
      const response = await makeRequest(testCtx.app, "/profile", {
        user,
        method: "POST",
        body: new URLSearchParams({ name: "" }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(204)

      const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
      expect(result[0].marketing_opt_in).toBe(false)
    })

    test("rejects name longer than 100 characters", async () => {
      const longName = "a".repeat(101)

      const response = await makeRequest(testCtx.app, "/profile", {
        user,
        method: "POST",
        body: new URLSearchParams({ name: longName }).toString(),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })

      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      const errorDiv = expectElement(document, ".invalid-feedback")
      expect(errorDiv.textContent).toContain("100 characters or less")

      // Verify database was not updated
      const result = await testCtx.db`SELECT name FROM users WHERE id = ${user.id}`
      expect(result[0].name).toBe(null)
    })
  })
})
