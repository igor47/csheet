import { beforeEach, describe, expect, test } from "bun:test"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { findOrCreateUser } from "./findOrCreateUser"

describe("findOrCreateUser", () => {
  const testCtx = useTestApp()

  describe("when user does not exist", () => {
    test("creates a new user and returns created: true", async () => {
      const result = await findOrCreateUser(testCtx.db, "new@example.com")

      expect(result.created).toBe(true)
      expect(result.user.email).toBe("new@example.com")
      expect(result.user.id).toBeTruthy()
    })
  })

  describe("when user already exists", () => {
    let existingUser: User

    beforeEach(async () => {
      existingUser = await userFactory.create({ email: "existing@example.com" }, testCtx.db)
    })

    test("returns existing user and created: false", async () => {
      const result = await findOrCreateUser(testCtx.db, "existing@example.com")

      expect(result.created).toBe(false)
      expect(result.user.id).toBe(existingUser.id)
      expect(result.user.email).toBe("existing@example.com")
    })
  })
})
