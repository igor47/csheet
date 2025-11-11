import type { MiddlewareHandler } from "hono"

/**
 * HTMX middleware - detects HTMX requests and sets a flag
 *
 * Sets c.var.isHtmx to true when the HX-Request header is present.
 * This allows routes to conditionally handle HTMX vs regular requests.
 */
export const htmxMiddleware: MiddlewareHandler = async (c, next) => {
  const isHtmx = c.req.header("HX-Request") === "true"
  c.set("isHtmx", isHtmx)
  await next()
}

// Type augmentation for Hono context
declare module "hono" {
  interface ContextVariableMap {
    isHtmx: boolean
  }
}
