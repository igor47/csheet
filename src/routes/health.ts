import { Hono } from "hono"
import { getDb } from "@src/db"

export const healthRoutes = new Hono()

// Liveness probe - lightweight, no dependencies
// Cloud Run uses this to detect unrecoverable failures
healthRoutes.get("/healthz", (c) => {
  return c.json({ status: "ok" })
})

// Readiness/Startup probe - checks DB connectivity
// Cloud Run uses this to verify app is ready before sending traffic
healthRoutes.get("/readyz", async (c) => {
  try {
    const db = getDb(c)
    await db`SELECT 1`
    return c.json({ status: "ready", database: "connected" })
  } catch (_err) {
    return c.json({ status: "not ready", database: "disconnected" }, 503)
  }
})
