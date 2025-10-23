import { createMiddleware } from "hono/factory"
import { logger } from "@src/lib/logger"
import type { AuthVariables } from "./auth"

// Request logging middleware (skip health checks)
export const requestLoggingMiddleware = createMiddleware<{
  Variables: AuthVariables
}>(async (c, next) => {
  const path = c.req.path
  if (path === "/healthz" || path === "/readyz") {
    return next()
  }

  const start = Date.now()
  await next()
  const duration = Date.now() - start
  logger.info("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    user: c.get("user")?.email,
  })
})
