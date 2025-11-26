import type { Hono } from "hono"
import type { AuthVariables } from "./middleware/auth"
import { authMiddleware } from "./middleware/auth"
import type { FlashVariables } from "./middleware/flash"
import { flashMiddleware } from "./middleware/flash"
import { htmxMiddleware } from "./middleware/htmx"
import type { NotificationsVariables } from "./middleware/notifications"
import { notificationsMiddleware } from "./middleware/notifications"
import { requestLoggingMiddleware } from "./middleware/requestLogging"

type AllVars = AuthVariables & FlashVariables & NotificationsVariables

declare module "hono" {
  interface ContextVariableMap extends AllVars {}
}

export function applyMiddleware(app: Hono) {
  app.use("*", requestLoggingMiddleware)
  app.use("*", authMiddleware)
  app.use("*", notificationsMiddleware)
  app.use("*", flashMiddleware)
  app.use("*", htmxMiddleware)
}
