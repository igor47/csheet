import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { config } from "@src/config"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { makeRequest } from "@src/test/http"
import { Webhook } from "svix"

const TEST_WEBHOOK_SECRET = "whsec_dGVzdF9zZWNyZXRfZm9yX3dlYmhvb2tz"

function signPayload(payload: string) {
  const wh = new Webhook(TEST_WEBHOOK_SECRET)
  const msgId = "msg_test123"
  const timestamp = new Date()
  const signature = wh.sign(msgId, timestamp, payload)
  return {
    "svix-id": msgId,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature": signature,
  }
}

function contactUpdatedPayload(email: string, unsubscribed: boolean) {
  return JSON.stringify({
    type: "contact.updated",
    created_at: new Date().toISOString(),
    data: {
      id: "cont_test123",
      audience_id: "aud_test123",
      segment_ids: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email,
      unsubscribed,
    },
  })
}

describe("POST /webhooks/resend", () => {
  const testCtx = useTestApp()

  describe("without webhook secret configured", () => {
    test("returns 500", async () => {
      const response = await makeRequest(testCtx.app, "/webhooks/resend", {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json" },
      })

      expect(response.status).toBe(500)
    })
  })

  describe("with webhook secret configured", () => {
    const originalSecret = config.resendWebhookSecret
    beforeEach(() => {
      ;(config as { resendWebhookSecret: string }).resendWebhookSecret = TEST_WEBHOOK_SECRET
    })
    afterEach(() => {
      ;(config as { resendWebhookSecret: string }).resendWebhookSecret = originalSecret
    })

    test("returns 400 for invalid signature", async () => {
      const response = await makeRequest(testCtx.app, "/webhooks/resend", {
        method: "POST",
        body: "{}",
        headers: {
          "Content-Type": "application/json",
          "svix-id": "msg_fake",
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,invalid",
        },
      })

      expect(response.status).toBe(400)
    })

    test("returns 200 for valid signature", async () => {
      const payload = contactUpdatedPayload("nobody@example.com", false)
      const headers = signPayload(payload)

      const response = await makeRequest(testCtx.app, "/webhooks/resend", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json", ...headers },
      })

      expect(response.status).toBe(200)
    })

    describe("contact.updated with unsubscribed=true", () => {
      let user: User

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
      })

      test("sets marketing_opt_in to false", async () => {
        const payload = contactUpdatedPayload(user.email, true)
        const headers = signPayload(payload)

        const response = await makeRequest(testCtx.app, "/webhooks/resend", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json", ...headers },
        })

        expect(response.status).toBe(200)

        const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
        expect(result[0].marketing_opt_in).toBe(false)
      })

      test("does nothing for unknown email", async () => {
        const payload = contactUpdatedPayload("unknown@example.com", true)
        const headers = signPayload(payload)

        const response = await makeRequest(testCtx.app, "/webhooks/resend", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json", ...headers },
        })

        expect(response.status).toBe(200)

        // Original user unchanged
        const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
        expect(result[0].marketing_opt_in).toBe(true)
      })
    })

    describe("contact.updated with unsubscribed=false", () => {
      let user: User

      beforeEach(async () => {
        user = await userFactory.create({}, testCtx.db)
        await testCtx.db`UPDATE users SET marketing_opt_in = false WHERE id = ${user.id}`
      })

      test("sets marketing_opt_in to true", async () => {
        const payload = contactUpdatedPayload(user.email, false)
        const headers = signPayload(payload)

        const response = await makeRequest(testCtx.app, "/webhooks/resend", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json", ...headers },
        })

        expect(response.status).toBe(200)

        const result = await testCtx.db`SELECT marketing_opt_in FROM users WHERE id = ${user.id}`
        expect(result[0].marketing_opt_in).toBe(true)
      })
    })
  })
})
