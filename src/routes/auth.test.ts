import { beforeEach, describe, expect, test } from "bun:test"
import type { CreateAuthTokenResult } from "@src/db/auth_tokens"
import { useTestApp } from "@src/test/app"
import { authTokenFactory } from "@src/test/factories/auth_token"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("POST /login", () => {
  const testCtx = useTestApp()

  describe("when requesting login", () => {
    test("redirects to OTP form for existing user", async () => {
      const user = await userFactory.create({ email: "test@example.com" }, testCtx.db)

      const formData = new FormData()
      formData.append("email", user.email)

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

      const response = await makeRequest(testCtx.app, "/login", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login/otp")
      expect(response.headers.get("Location")).toContain("redirect=%2Fcustom-page")
    })
  })

  test("rejects empty email", async () => {
    const formData = new FormData()
    formData.append("email", "")

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toContain("Email is required")
  })

  test("rejects invalid email", async () => {
    const formData = new FormData()
    formData.append("email", "not-an-email")

    const response = await makeRequest(testCtx.app, "/login", {
      method: "POST",
      body: formData,
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toContain("Invalid email")
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
      expect(response.headers.get("Location")).toBe("/characters")

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
      expect(response.headers.get("Location")).toBe("/custom-page")
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
      expect(response.headers.get("Location")).toBe("/characters")

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

  test("allows up to 3 OTP requests per hour", async () => {
    const email = "ratelimit@example.com"

    // First 3 requests should succeed and redirect to OTP form
    for (let i = 0; i < 3; i++) {
      const formData = new FormData()
      formData.append("email", email)

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
