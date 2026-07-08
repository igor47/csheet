import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { config } from "@src/config"
import type { CreateAuthTokenResult } from "@src/db/auth_tokens"
import type { Campaign } from "@src/db/campaigns"
import type { User } from "@src/db/users"
import { solvedAltchaPayload } from "@src/test/altcha"
import { useTestApp } from "@src/test/app"
import { authTokenFactory } from "@src/test/factories/auth_token"
import { campaignFactory, campaignMemberFactory } from "@src/test/factories/campaign"
import { userFactory } from "@src/test/factories/user"
import { elementExists, expectElement, makeRequest, parseHtml } from "@src/test/http"
import { createChallenge, solveChallenge } from "altcha-lib/v1"

const ORIGINAL_SMTP_HOST = config.smtpHost

describe("POST /login", () => {
  const testCtx = useTestApp()

  describe("with SMTP configured", () => {
    beforeEach(() => {
      ;(config as { smtpHost: string }).smtpHost = "test-smtp.example.com"
    })
    afterEach(() => {
      ;(config as { smtpHost: string }).smtpHost = ORIGINAL_SMTP_HOST
    })

    test("redirects to OTP form for existing user", async () => {
      const user = await userFactory.create({ email: "test@example.com" }, testCtx.db)

      const formData = new FormData()
      formData.append("email", user.email)
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")
      expect(response.headers.get("Location")).toContain(`email=${encodeURIComponent(user.email)}`)
    })

    test("redirects to OTP form for new user", async () => {
      const formData = new FormData()
      formData.append("email", "newuser@example.com")
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")
      expect(response.headers.get("Location")).toContain("email=newuser%40example.com")
    })

    test("preserves redirect parameter", async () => {
      const formData = new FormData()
      formData.append("email", "test@example.com")
      formData.append("redirect", "/custom-page")
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")
      expect(response.headers.get("Location")).toContain("redirect=%2Fcustom-page")
    })
  })

  describe("without SMTP configured (instant login)", () => {
    test("creates and logs in new user", async () => {
      const formData = new FormData()
      formData.append("email", "instant@example.com")
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      // New user redirected to welcome page
      const location = response.headers.get("Location") || ""
      expect(location).toContain("/welcome")
      expect(location).toContain("redirect=%2Fcharacters")

      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
    })

    test("logs in existing user", async () => {
      const user = await userFactory.create({ email: "existing@example.com" }, testCtx.db)

      const formData = new FormData()
      formData.append("email", user.email)
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      // Welcomed user goes straight to characters
      expect(response.headers.get("Location")).toBe("/characters")
    })

    test("preserves redirect parameter", async () => {
      const user = await userFactory.create({ email: "redirect@example.com" }, testCtx.db)

      const formData = new FormData()
      formData.append("email", user.email)
      formData.append("redirect", "/campaigns")
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")
    })
  })

  test("rejects empty email with a flash and redirect", async () => {
    const formData = new FormData()
    formData.append("email", "")

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
    expect(response.headers.get("Set-Cookie")).toContain("flash")
  })

  test("rejects invalid email with a flash and redirect", async () => {
    const formData = new FormData()
    formData.append("email", "not-an-email")

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
    expect(response.headers.get("Set-Cookie")).toContain("flash")
  })
})

describe("ALTCHA login protection", () => {
  const testCtx = useTestApp()

  test("GET /login renders the widget and vendored script", async () => {
    const response = await makeRequest(testCtx.app, "/login")
    const document = await parseHtml(response)

    // The widget must point at our challenge endpoint via the `challenge`
    // attribute (altcha v3 renamed it from `challengeurl`); a wrong name means
    // the widget silently can't fetch a challenge and login breaks.
    const widget = expectElement(document, "altcha-widget")
    expect(widget.getAttribute("challenge")).toBe("/login/challenge")
    expect(elementExists(document, 'script[src="/static/altcha.min.js"]')).toBe(true)
  })

  test("GET /login/challenge returns a signed challenge", async () => {
    const response = await makeRequest(testCtx.app, "/login/challenge")

    expect(response.status).toBe(200)
    const challenge = (await response.json()) as Record<string, unknown>
    expect(challenge.algorithm).toBe("SHA-256")
    expect(typeof challenge.challenge).toBe("string")
    expect(typeof challenge.salt).toBe("string")
    expect(typeof challenge.signature).toBe("string")
    expect(challenge.maxnumber).toBeGreaterThan(0)
  })

  test("rejects POST /login with no altcha payload", async () => {
    const formData = new FormData()
    formData.append("email", "nobody@example.com")

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
    expect(response.headers.get("Set-Cookie")).toContain("flash")

    // No email was sent and no OTP budget was consumed.
    const tokens = await testCtx.db`SELECT count(*)::int AS count FROM auth_tokens`
    expect(tokens[0].count).toBe(0)
  })

  test("rejects POST /login with a malformed altcha payload", async () => {
    const formData = new FormData()
    formData.append("email", "nobody@example.com")
    formData.append("altcha", "not-a-valid-payload")

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
    expect(response.headers.get("Set-Cookie")).toContain("flash")
  })

  test("accepts a valid solved payload and records it", async () => {
    const formData = new FormData()
    formData.append("email", "solver@example.com")
    formData.append("altcha", await solvedAltchaPayload())

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    // Instant-login path (no SMTP in tests): got past ALTCHA and logged in.
    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toContain("/welcome")

    const solutions = await testCtx.db`SELECT count(*)::int AS count FROM altcha_solutions`
    expect(solutions[0].count).toBe(1)
  })

  test("rejects a replayed payload", async () => {
    const payload = await solvedAltchaPayload()

    const first = new FormData()
    first.append("email", "replay@example.com")
    first.append("altcha", payload)
    const firstRes = await makeRequest(testCtx.app, "/login", { method: "POST", body: first })
    expect(firstRes.status).toBe(302)
    expect(firstRes.headers.get("Location")).toContain("/welcome")

    // Same solved challenge again — must be refused.
    const second = new FormData()
    second.append("email", "replay@example.com")
    second.append("altcha", payload)
    const secondRes = await makeRequest(testCtx.app, "/login", { method: "POST", body: second })
    expect(secondRes.status).toBe(302)
    expect(secondRes.headers.get("Location")).toBe("/login")
    expect(secondRes.headers.get("Set-Cookie")).toContain("flash")
  })

  test("rejects an expired challenge", async () => {
    const challenge = await createChallenge({
      hmacKey: config.altchaHmacKey,
      algorithm: "SHA-256",
      maxnumber: 1000,
      expires: new Date(Date.now() - 1000), // already expired
    })
    const { promise } = solveChallenge(
      challenge.challenge,
      challenge.salt,
      challenge.algorithm,
      challenge.maxnumber
    )
    const solution = await promise
    if (!solution) throw new Error("failed to solve challenge")
    const payload = btoa(
      JSON.stringify({
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        number: solution.number,
        salt: challenge.salt,
        signature: challenge.signature,
      })
    )

    const formData = new FormData()
    formData.append("email", "expired@example.com")
    formData.append("altcha", payload)

    const response = await makeRequest(testCtx.app, "/login", { method: "POST", body: formData })
    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
    expect(response.headers.get("Set-Cookie")).toContain("flash")
  })
})

describe("GET /login/otp", () => {
  const testCtx = useTestApp()

  test("displays OTP entry form", async () => {
    const response = await makeRequest(testCtx.app, "/login/otp?email=test@example.com")

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    const title = expectElement(document, "title")
    expect(title.textContent).toContain("Enter Login Code")

    // Check for form elements
    const emailInput = expectElement(document, 'input[name="email"]')
    expect(emailInput.getAttribute("value")).toBe("test@example.com")

    const otpInput = expectElement(document, 'input[name="otp_code"]')
    expect(otpInput.getAttribute("type")).toBe("text")
    expect(otpInput.getAttribute("maxlength")).toBe("6")
  })

  test("displays email address in message", async () => {
    const response = await makeRequest(testCtx.app, "/login/otp?email=test@example.com")

    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    expect(body).toContain("test@example.com")
  })

  test("preserves redirect parameter", async () => {
    const response = await makeRequest(
      testCtx.app,
      "/login/otp?email=test@example.com&redirect=/custom-page"
    )

    const document = await parseHtml(response)
    const redirectInput = expectElement(document, 'input[name="redirect"]')
    expect(redirectInput.getAttribute("value")).toBe("/custom-page")
  })

  test("redirects to login if email is missing", async () => {
    const response = await makeRequest(testCtx.app, "/login/otp")

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
  })
})

describe("POST /login/otp", () => {
  const testCtx = useTestApp()

  describe("with valid OTP", () => {
    let token: CreateAuthTokenResult

    beforeEach(async () => {
      token = await authTokenFactory.create({ email: "test@example.com" }, testCtx.db)
    })

    test("logs in existing user", async () => {
      await userFactory.create({ email: token.email }, testCtx.db)

      const formData = new FormData()
      formData.append("email", token.email)
      formData.append("otp_code", token.otpCode)

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/characters")

      // Check for auth cookie
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
    })

    test("creates new user and logs in", async () => {
      const formData = new FormData()
      formData.append("email", token.email)
      formData.append("otp_code", token.otpCode)

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      // New user is redirected to welcome page
      const location = response.headers.get("Location") || ""
      expect(location).toContain("/welcome")
      expect(location).toContain("redirect=%2Fcharacters")

      // Check for auth cookie
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
    })

    test("preserves redirect parameter", async () => {
      const formData = new FormData()
      formData.append("email", token.email)
      formData.append("otp_code", token.otpCode)
      formData.append("redirect", "/custom-page")

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      // New user is redirected to welcome page with original redirect preserved
      const location = response.headers.get("Location") || ""
      expect(location).toContain("/welcome")
      expect(location).toContain("redirect=%2Fcustom-page")
    })

    test("marks token as used", async () => {
      const formData1 = new FormData()
      formData1.append("email", token.email)
      formData1.append("otp_code", token.otpCode)

      await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData1,
      })

      // Try to use the same token again
      const formData2 = new FormData()
      formData2.append("email", token.email)
      formData2.append("otp_code", token.otpCode)

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData2,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })

  describe("with invalid OTP", () => {
    test("redirects back to OTP form with error", async () => {
      const formData = new FormData()
      formData.append("email", "test@example.com")
      formData.append("otp_code", "999999")

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")
      expect(response.headers.get("Location")).toContain("email=test%40example.com")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })

    test("preserves redirect parameter on error", async () => {
      const formData = new FormData()
      formData.append("email", "test@example.com")
      formData.append("otp_code", "999999")
      formData.append("redirect", "/custom-page")

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      const location = response.headers.get("Location") || ""
      expect(location).toContain("/login/otp")
      expect(location).toContain("redirect=%2Fcustom-page")
    })
  })

  describe("with expired OTP", () => {
    test("rejects expired token", async () => {
      const token = await authTokenFactory.create({ email: "test@example.com" }, testCtx.db)

      // Manually expire the token
      await testCtx.db`
        UPDATE auth_tokens
        SET expires_at = NOW() - INTERVAL '1 hour'
        WHERE id = ${token.id}
      `

      const formData = new FormData()
      formData.append("email", token.email)
      formData.append("otp_code", token.otpCode)

      const response = await makeRequest(testCtx.app, "/login/otp", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })

  test("rejects missing email or code", async () => {
    const formData = new FormData()
    formData.append("email", "")

    const response = await makeRequest(testCtx.app, "/login/otp", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
  })
})

describe("GET /login/token", () => {
  const testCtx = useTestApp()

  describe("with valid session token", () => {
    let token: CreateAuthTokenResult

    beforeEach(async () => {
      token = await authTokenFactory.create({ email: "test@example.com" }, testCtx.db)
    })

    test("logs in existing user", async () => {
      await userFactory.create({ email: token.email }, testCtx.db)

      const response = await makeRequest(testCtx.app, `/login/token?token=${token.sessionToken}`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/characters")

      // Check for auth cookie
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
    })

    test("creates new user and logs in", async () => {
      const response = await makeRequest(testCtx.app, `/login/token?token=${token.sessionToken}`)

      expect(response.status).toBe(302)
      // New user is redirected to welcome page
      const location = response.headers.get("Location") || ""
      expect(location).toContain("/welcome")
      expect(location).toContain("redirect=%2Fcharacters")

      // Check for auth cookie
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
    })

    test("marks token as used", async () => {
      await makeRequest(testCtx.app, `/login/token?token=${token.sessionToken}`)

      // Try to use the same token again
      const response = await makeRequest(testCtx.app, `/login/token?token=${token.sessionToken}`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/login")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })

  describe("with invalid session token", () => {
    test("redirects to login with error", async () => {
      const response = await makeRequest(testCtx.app, "/login/token?token=invalid-token")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/login")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })

  describe("with expired session token", () => {
    test("rejects expired token", async () => {
      const token = await authTokenFactory.create({ email: "test@example.com" }, testCtx.db)

      // Manually expire the token
      await testCtx.db`
        UPDATE auth_tokens
        SET expires_at = NOW() - INTERVAL '1 hour'
        WHERE id = ${token.id}
      `

      const response = await makeRequest(testCtx.app, `/login/token?token=${token.sessionToken}`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/login")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })

  test("rejects missing token", async () => {
    const response = await makeRequest(testCtx.app, "/login/token")

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")
  })
})

describe("OTP rate limiting", () => {
  const testCtx = useTestApp()
  beforeEach(() => {
    ;(config as { smtpHost: string }).smtpHost = "test-smtp.example.com"
  })
  afterEach(() => {
    ;(config as { smtpHost: string }).smtpHost = ORIGINAL_SMTP_HOST
  })

  test("allows up to 3 OTP requests per hour", async () => {
    const email = "ratelimit@example.com"

    // First 3 requests should succeed and redirect to OTP form
    for (let i = 0; i < 3; i++) {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("altcha", await solvedAltchaPayload())

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")
    }

    // Fourth request should be rate limited
    const formData = new FormData()
    formData.append("email", email)
    formData.append("altcha", await solvedAltchaPayload())

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("/login")

    // Check for error flash message
    const setCookie = response.headers.get("Set-Cookie")
    expect(setCookie).toContain("flash")
  })
})

describe("GET /invite/view", () => {
  const testCtx = useTestApp()

  describe("with a valid pending invite token", () => {
    let dmUser: User
    let invitedUser: User
    let campaign: Campaign
    let inviteToken: string

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      const member = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
      inviteToken = member.invite_token!
    })

    test("logs in user and redirects to campaigns with info flash", async () => {
      const response = await makeRequest(testCtx.app, `/invite/view?token=${inviteToken}`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")

      // Check for auth cookie
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
      expect(setCookie).toContain("flash")
    })
  })

  describe("with a soft-deleted invite token", () => {
    let dmUser: User
    let invitedUser: User
    let campaign: Campaign
    let inviteToken: string

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      const member = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
      inviteToken = member.invite_token!
      // Soft-delete the invite
      await testCtx.db`
        UPDATE campaign_members
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${member.id}
      `
    })

    test("logs in user and redirects to campaigns with warning flash", async () => {
      const response = await makeRequest(testCtx.app, `/invite/view?token=${inviteToken}`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")

      // Check for auth cookie - user is still logged in
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("user_id")
      expect(setCookie).toContain("flash")
    })
  })

  describe("with an invalid token", () => {
    test("redirects to login with error", async () => {
      const response = await makeRequest(testCtx.app, "/invite/view?token=invalid-token")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/login")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })

  describe("with no token", () => {
    test("redirects to login with error", async () => {
      const response = await makeRequest(testCtx.app, "/invite/view")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/login")

      // Check for error flash message
      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })
  })
})
