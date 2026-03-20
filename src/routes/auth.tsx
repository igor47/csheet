import { InviteSwitchAccount } from "@src/components/InviteSwitchAccount"
import { Login } from "@src/components/Login"
import { LoginOtp } from "@src/components/LoginOtp"
import { config, isSmtpConfigured } from "@src/config"
import { getDb } from "@src/db"
import * as authTokens from "@src/db/auth_tokens"
import * as campaignMembers from "@src/db/campaign_members"
import { sendOtpEmail } from "@src/lib/email"
import { logger } from "@src/lib/logger"
import { getBaseUrl } from "@src/lib/url"
import { clearAuthCookie, setAuthCookie } from "@src/middleware/auth"
import { setFlashMsg } from "@src/middleware/flash"
import { findOrCreateUser } from "@src/services/findOrCreateUser"
import { Hono } from "hono"

function postLoginRedirect(user: { welcomed_at: string | null }, intendedTarget: string): string {
  if (config.showWelcomePage && !user.welcomed_at) {
    const params = new URLSearchParams({ redirect: intendedTarget })
    return `/welcome?${params.toString()}`
  }
  return intendedTarget
}

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
    const { user, created } = await findOrCreateUser(getDb(c), email)
    await setFlashMsg(
      c,
      created ? "Account created. You are now logged in." : "Logged in successfully.",
      created ? "info" : "success"
    )

    await setAuthCookie(c, user.id)
    return c.redirect(postLoginRedirect(user, redirect || "/characters"))
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
  const magicLink = new URL(`${getBaseUrl(c)}/login/token`)
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
  const { user, created } = await findOrCreateUser(db, validEmail)
  await setFlashMsg(
    c,
    created ? "Account created. You are now logged in." : "Logged in successfully.",
    created ? "info" : "success"
  )

  await setAuthCookie(c, user.id)
  return c.redirect(postLoginRedirect(user, redirect || "/characters"))
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
  const { user, created } = await findOrCreateUser(db, validEmail)
  await setFlashMsg(
    c,
    created ? "Account created. You are now logged in." : "Logged in successfully.",
    created ? "info" : "success"
  )

  await setAuthCookie(c, user.id)
  return c.redirect(postLoginRedirect(user, redirect || "/characters"))
})

authRoutes.get("/logout", async (c) => {
  clearAuthCookie(c)
  await setFlashMsg(c, "You have been logged out.", "warning")

  // Support redirect param for flows like invite account switching
  const redirect = c.req.query("redirect")
  return c.redirect(redirect || "/")
})

// View campaign invite via magic link
// Token is NOT consumed here - it's just proof of email access (like OTP)
// Accept/decline happens via /campaigns/:id/accept and /campaigns/:id/decline
authRoutes.get("/invite/view", async (c) => {
  const token = c.req.query("token")

  if (!token) {
    await setFlashMsg(c, "Invalid invitation link.", "error")
    return c.redirect("/login")
  }

  // Find pending invite by token
  const db = getDb(c)
  const tokenResult = await campaignMembers.findByInviteToken(db, token)

  if (!tokenResult) {
    await setFlashMsg(c, "Invalid or expired invitation link.", "error")
    return c.redirect("/login")
  }

  const currentUser = c.var.user

  // Flow 2: Logged in as different user - show switch account page
  if (currentUser && currentUser.email !== tokenResult.email) {
    return c.render(
      <InviteSwitchAccount
        currentEmail={currentUser.email!}
        inviteEmail={tokenResult.email}
        token={token}
      />,
      { title: "Switch Account?" }
    )
  }

  // Flow 1: Not logged in, or logged in as correct user
  // Log in as the invited email and redirect to campaigns
  const { user, created } = await findOrCreateUser(db, tokenResult.email)
  if (created) {
    logger.info("Created user from invite", { email: tokenResult.email })
  }

  await setAuthCookie(c, user.id)

  // Check if invite was deleted - show warning instead of normal message
  if (tokenResult.deletedAt) {
    await setFlashMsg(
      c,
      "This invitation has been deleted. Contact the campaign organizer if you believe this is a mistake.",
      "warning"
    )
  } else {
    await setFlashMsg(c, "You have a pending campaign invite - accept or decline below", "info")
  }

  return c.redirect(postLoginRedirect(user, "/campaigns"))
})
