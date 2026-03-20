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

/**
 * Validate that a redirect path is a relative path (starts with /).
 * Returns the fallback if the path is missing, empty, or absolute (e.g. https://evil.com).
 */
export function safeRedirect(path: string | null | undefined, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback
  }
  return path
}
