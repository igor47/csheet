import type { Context } from "hono"

/**
 * Get the base URL from request headers (protocol + host)
 * Respects x-forwarded-proto for reverse proxies
 */
export function getBaseUrl(c: Context): string {
  const protocol = c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", "")
  const host = c.req.header("host") || new URL(c.req.url).host
  return `${protocol}://${host}`
}
