import { config } from "@src/config"
import { logger } from "@src/lib/logger"
import { createMiddleware } from "hono/factory"
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

  const data = {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
    user: c.get("user")?.email,
  }

  if (config.isProd) {
    logger.info("request", data)
  } else if (config.isTest) {
    // nothing!
  } else {
    logger.info(
      `${data.method} ${data.path} - ${data.status} - ${data.duration}ms${data.user ? ` - user: ${data.user}` : ""}`
    )
  }
})
