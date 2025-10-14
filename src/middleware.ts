import type { Hono } from "hono"
import type { AuthVariables } from "./middleware/auth"
import { authMiddleware } from "./middleware/auth"
import type { FlashVariables } from "./middleware/flash"
import { flashMiddleware } from "./middleware/flash"

type AllVars = AuthVariables & FlashVariables

declare module "hono" {
  interface ContextVariableMap extends AllVars {}
}

export function applyMiddleware(app: Hono) {
  app.use("*", authMiddleware)
  app.use("*", flashMiddleware)
}
