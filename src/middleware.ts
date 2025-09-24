import { authMiddleware } from "./middleware/auth";

import type { Hono } from "hono";
import type { AuthVariables } from "./middleware/auth";

declare module 'hono' {
  interface ContextVariableMap extends AuthVariables {}
}

export function applyMiddleware(app: Hono) {
  app.use('*', authMiddleware)
}
