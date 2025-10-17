import { afterEach, beforeEach } from "bun:test"
import { createApp } from "@src/app"
import { getDbForTests } from "@src/db"
import type { SQL } from "bun"
import type { Hono } from "hono"

/**
 * Set up a test app with transaction-based test isolation
 *
 * Usage:
 *   const { app, db } = useTestApp()
 *
 *   test("example", async () => {
 *     const user = await userFactory.create({}, db)
 *     const response = await makeRequest(app, "/path")
 *   })
 *
 * This function sets up beforeEach and afterEach hooks that:
 * - Reserve a database connection
 * - Start a transaction
 * - Create a fresh app instance with the test database injected
 * - Rollback the transaction after each test
 */
export function useTestApp() {
  const state = {
    app: null as Hono | null,
    db: null as SQL | null,
  }

  beforeEach(async () => {
    const db = getDbForTests()
    const reserved = await db.reserve()
    await reserved.unsafe("BEGIN")

    // Create app with test database injected
    // This ensures db is available when auth middleware runs
    const testApp = createApp(reserved)

    state.app = testApp
    state.db = reserved
  })

  afterEach(async () => {
    if (state.db) {
      await state.db.unsafe("ROLLBACK")
    }
  })

  return {
    get app() {
      return state.app!
    },
    get db() {
      return state.db!
    },
  }
}
