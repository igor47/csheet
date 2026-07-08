import { Blocked } from "@src/components/Blocked"
import { clientIpFromXff, isBlockedIp } from "@src/lib/ip"
import { logger } from "@src/lib/logger"
import { createMiddleware } from "hono/factory"

// Refuses requests from known-abusive datacenter ranges (see src/lib/ip.ts).
// Registered right after request logging so blocked requests are still logged
// but never reach auth, the DB, routes, or static assets.
export const ipBlocklistMiddleware = createMiddleware(async (c, next) => {
  const ip = clientIpFromXff(c.req.header("x-forwarded-for"))
  if (ip && isBlockedIp(ip)) {
    logger.warn("Blocked request from banned IP", { ip, path: c.req.path })
    return c.html(`<!DOCTYPE html>${<Blocked />}`, 403)
  }
  return next()
})
