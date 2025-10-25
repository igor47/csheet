import { Login } from "@src/components/Login"
import { LoginOtp } from "@src/components/LoginOtp"
import { isSmtpConfigured } from "@src/config"
import { getDb } from "@src/db"
import * as authTokens from "@src/db/auth_tokens"
import { create, findByEmail } from "@src/db/users"
import { sendOtpEmail } from "@src/lib/email"
import { logger } from "@src/lib/logger"
import { clearAuthCookie, setAuthCookie } from "@src/middleware/auth"
import { setFlashMsg } from "@src/middleware/flash"
import { Hono } from "hono"

export const authRoutes = new Hono()

authRoutes.get("/login", (c) => {
  const redirect = c.req.query("redirect")
  return c.render(<Login redirect={redirect} />, { title: "Login" })
})

authRoutes.post("/login", async (c) => {
  const formData = await c.req.formData()
  const email = formData.get("email") as string
  const redirect = formData.get("redirect") as string | null

  if (!email) {
    return c.text("Email is required", 400)
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return c.text("Invalid email", 400)
  }

  // If SMTP is not configured, fall back to instant login
  if (!isSmtpConfigured()) {
    let user = await findByEmail(getDb(c), email)

    if (!user) {
      user = await create(getDb(c), email)
      await setFlashMsg(c, "Account created. You are now logged in.", "info")
    } else {
      await setFlashMsg(c, "Logged in successfully.", "success")
    }

    await setAuthCookie(c, user.id)
    return c.redirect(redirect || "/characters")
  }

  // SMTP is configured - use OTP flow
  const db = getDb(c)

  // Check rate limiting
  const canRequest = await authTokens.canRequestOtp(db, email)
  if (!canRequest) {
    await setFlashMsg(c, "Too many login attempts. Please try again later.", "error")
    return c.redirect("/login")
  }

  // Create OTP token
  const token = await authTokens.create(db, email)

  // Build magic link URL
  const protocol = c.req.header("x-forwarded-proto") || new URL(c.req.url).protocol.replace(":", "")
  const host = c.req.header("host") || new URL(c.req.url).host
  const magicLink = new URL(`${protocol}://${host}/login/token`)
  magicLink.searchParams.set("token", token.sessionToken)
  if (redirect) {
    magicLink.searchParams.set("redirect", redirect)
  }

  // Send email
  try {
    await sendOtpEmail({
      to: email,
      otpCode: token.otpCode,
      magicLink: magicLink.toString(),
    })

    logger.info("OTP email sent", { email })

    // Redirect to OTP entry page
    const params = new URLSearchParams({ email })
    if (redirect) {
      params.set("redirect", redirect)
    }
    return c.redirect(`/login/otp?${params.toString()}`)
  } catch (error) {
    logger.error("Failed to send OTP email", error as Error, { email })
    await setFlashMsg(c, "Failed to send login email. Please try again.", "error")
    return c.redirect("/login")
  }
})

authRoutes.get("/login/otp", (c) => {
  const email = c.req.query("email")
  const redirect = c.req.query("redirect")

  if (!email) {
    return c.redirect("/login")
  }

  return c.render(<LoginOtp email={email} redirect={redirect} />, { title: "Enter Login Code" })
})

authRoutes.post("/login/otp", async (c) => {
  const formData = await c.req.formData()
  const email = formData.get("email") as string
  const otpCode = formData.get("otp_code") as string
  const redirect = formData.get("redirect") as string | null

  if (!email || !otpCode) {
    await setFlashMsg(c, "Email and code are required.", "error")
    return c.redirect("/login")
  }

  const db = getDb(c)

  // Validate OTP - uses constant-time comparison internally
  const validEmail = await authTokens.validateOtp(db, email, otpCode)

  if (!validEmail) {
    await setFlashMsg(c, "Invalid or expired code. Please try again.", "error")
    const params = new URLSearchParams({ email })
    if (redirect) {
      params.set("redirect", redirect)
    }
    return c.redirect(`/login/otp?${params.toString()}`)
  }

  // Find or create user
  let user = await findByEmail(db, validEmail)
  if (!user) {
    user = await create(db, validEmail)
    await setFlashMsg(c, "Account created. You are now logged in.", "info")
  } else {
    await setFlashMsg(c, "Logged in successfully.", "success")
  }

  await setAuthCookie(c, user.id)
  return c.redirect(redirect || "/characters")
})

authRoutes.get("/login/token", async (c) => {
  const token = c.req.query("token")
  const redirect = c.req.query("redirect") as string | null

  if (!token) {
    await setFlashMsg(c, "Invalid login link.", "error")
    return c.redirect("/login")
  }

  const db = getDb(c)

  // Validate session token - uses constant-time comparison internally
  const validEmail = await authTokens.validateSessionToken(db, token)

  if (!validEmail) {
    await setFlashMsg(c, "Invalid or expired login link.", "error")
    return c.redirect("/login")
  }

  // Find or create user
  let user = await findByEmail(db, validEmail)
  if (!user) {
    user = await create(db, validEmail)
    await setFlashMsg(c, "Account created. You are now logged in.", "info")
  } else {
    await setFlashMsg(c, "Logged in successfully.", "success")
  }

  await setAuthCookie(c, user.id)
  return c.redirect(redirect || "/characters")
})

authRoutes.get("/logout", async (c) => {
  clearAuthCookie(c)
  await setFlashMsg(c, "You have been logged out.", "warning")
  return c.redirect("/")
})
