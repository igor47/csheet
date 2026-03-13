import { config } from "@src/config"
import { getDb } from "@src/db"
import * as users from "@src/db/users"
import { logger } from "@src/lib/logger"
import { Hono } from "hono"
import type { WebhookEventPayload } from "resend"
import { Webhook } from "svix"

export const webhookRoutes = new Hono()

webhookRoutes.post("/webhooks/resend", async (c) => {
  const secret = config.resendWebhookSecret
  if (!secret) {
    logger.warn("Resend webhook received but RESEND_WEBHOOK_SECRET is not configured")
    return c.body(null, 500)
  }

  const payload = await c.req.text()

  let event: WebhookEventPayload
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": c.req.header("svix-id") || "",
      "svix-timestamp": c.req.header("svix-timestamp") || "",
      "svix-signature": c.req.header("svix-signature") || "",
    }) as WebhookEventPayload
  } catch {
    logger.warn("Resend webhook signature verification failed")
    return c.body(null, 400)
  }

  if (event.type === "contact.updated") {
    const email = event.data.email
    const newOptIn = !event.data.unsubscribed
    const db = getDb(c)
    const user = await users.findByEmail(db, email)
    if (user && user.marketing_opt_in !== newOptIn) {
      await users.update(db, user.id, { name: user.name, marketing_opt_in: newOptIn })
      logger.info(`User ${newOptIn ? "opted in" : "opted out"} via Resend webhook`, { email })
    }
  }

  return c.body(null, 200)
})
