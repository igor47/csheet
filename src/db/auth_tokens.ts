import { config } from "@src/config"
import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"

export interface AuthToken {
  id: string
  email: string
  session_token_hash: string
  otp_code_hash: string
  created_at: string
  expires_at: string
  used_at: string | null
}

export interface CreateAuthTokenResult {
  id: string
  email: string
  otpCode: string // Plain text, not stored
  sessionToken: string // Plain text, not stored
  expiresAt: Date
}

/**
 * Hash a string using SHA-256
 */
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Generate a cryptographically secure 6-digit OTP code
 */
function generateOtpCode(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const value = array[0]
  if (value === undefined) {
    throw new Error("Failed to generate random value")
  }
  const code = value % 1000000
  return code.toString().padStart(6, "0")
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Create a new auth token with OTP and session token
 */
export async function create(db: SQL, email: string): Promise<CreateAuthTokenResult> {
  const id = ulid()
  const otpCode = generateOtpCode()
  const sessionToken = crypto.randomUUID()

  const otpCodeHash = await hashValue(otpCode)
  const sessionTokenHash = await hashValue(sessionToken)

  const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000)

  await db`
    INSERT INTO auth_tokens (id, email, session_token_hash, otp_code_hash, expires_at)
    VALUES (${id}, ${email}, ${sessionTokenHash}, ${otpCodeHash}, ${expiresAt.toISOString()})
  `

  return {
    id,
    email,
    otpCode,
    sessionToken,
    expiresAt,
  }
}

/**
 * Check if an email can request an OTP (rate limiting)
 * Returns true if the email can request an OTP
 */
export async function canRequestOtp(db: SQL, email: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const result = await db`
    SELECT COUNT(*) as count
    FROM auth_tokens
    WHERE email = ${email}
      AND created_at > ${oneHourAgo.toISOString()}
  `

  const count = Number.parseInt(result[0].count as string, 10)
  return count < config.otpRateLimitPerHour
}

/**
 * Validate an OTP code for an email
 * Returns the email if valid, null otherwise
 * Uses timing-safe comparison to prevent info leakage
 */
export async function validateOtp(db: SQL, email: string, otpCode: string): Promise<string | null> {
  const otpCodeHash = await hashValue(otpCode)
  const now = new Date()

  // Get all unused, non-expired tokens for this email
  const results = await db`
    SELECT *
    FROM auth_tokens
    WHERE email = ${email}
      AND used_at IS NULL
      AND expires_at > ${now.toISOString()}
    ORDER BY id DESC
  `

  // Use timing-safe comparison to prevent info leakage
  let validToken: AuthToken | null = null
  for (const token of results) {
    const isMatch = timingSafeEqual(token.otp_code_hash, otpCodeHash)
    if (isMatch) {
      validToken = token as AuthToken
      // Don't break - continue iterating to maintain constant time
    }
  }

  if (!validToken) {
    // Sleep for a constant time to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 100))
    return null
  }

  // Mark as used
  await db`
    UPDATE auth_tokens
    SET used_at = ${now.toISOString()}
    WHERE id = ${validToken.id}
  `

  return validToken.email
}

/**
 * Validate a session token (magic link)
 * Returns the email if valid, null otherwise
 * Uses timing-safe comparison to prevent info leakage
 */
export async function validateSessionToken(db: SQL, sessionToken: string): Promise<string | null> {
  const sessionTokenHash = await hashValue(sessionToken)
  const now = new Date()

  // Get all unused, non-expired tokens
  const results = await db`
    SELECT *
    FROM auth_tokens
    WHERE used_at IS NULL
      AND expires_at > ${now.toISOString()}
    ORDER BY id DESC
  `

  // Use timing-safe comparison to prevent info leakage
  let validToken: AuthToken | null = null
  for (const token of results) {
    const isMatch = timingSafeEqual(token.session_token_hash, sessionTokenHash)
    if (isMatch) {
      validToken = token as AuthToken
      // Don't break - continue iterating to maintain constant time
    }
  }

  if (!validToken) {
    // Sleep for a constant time to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 100))
    return null
  }

  // Mark as used
  await db`
    UPDATE auth_tokens
    SET used_at = ${now.toISOString()}
    WHERE id = ${validToken.id}
  `

  return validToken.email
}

/**
 * Clean up expired tokens
 * Should be called periodically (e.g., via cron job)
 */
export async function cleanup(db: SQL): Promise<number> {
  const now = new Date()

  const result = await db`
    DELETE FROM auth_tokens
    WHERE expires_at < ${now.toISOString()}
  `

  return result.length
}
