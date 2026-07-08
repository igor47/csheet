import { config } from "@src/config"
import * as altchaSolutions from "@src/db/altcha_solutions"
// altcha-lib's default export is the v2 (KDF) API, whose memory-hard algorithms
// (Argon2) aren't available on Bun. The v1 API is classic SHA-256 hashcash,
// which the widget solves in-browser and Bun verifies natively.
import { createChallenge, extractParams, verifySolution } from "altcha-lib/v1"
import type { Challenge } from "altcha-lib/v1/types"
import type { SQL } from "bun"

/** Mint a signed, expiring proof-of-work challenge for the login form. */
export function createLoginChallenge(): Promise<Challenge> {
  return createChallenge({
    hmacKey: config.altchaHmacKey,
    algorithm: "SHA-256",
    maxnumber: config.altchaMaxNumber,
    expires: new Date(Date.now() + config.altchaChallengeExpiryMinutes * 60_000),
  })
}

export type AltchaVerifyResult = "ok" | "invalid" | "replay"

/**
 * Verify a solved ALTCHA payload submitted with the login form.
 *
 * - "invalid": missing, malformed, expired, or signature/solution mismatch.
 * - "replay": valid, but this challenge salt was already spent.
 * - "ok": valid and now recorded as spent.
 */
export async function verifyLoginSolution(db: SQL, payload: string): Promise<AltchaVerifyResult> {
  // verifySolution checks expiry, recomputes the PoW hash, and validates the
  // HMAC signature against our key (so a client can't forge a challenge). It
  // returns false rather than throwing on malformed input.
  const valid = await verifySolution(payload, config.altchaHmacKey, true)
  if (!valid) return "invalid"

  // The salt (random bytes + embedded "?expires=..." params) uniquely
  // identifies the challenge, so it's our replay key.
  let salt: string
  try {
    const decoded = JSON.parse(atob(payload)) as { salt?: unknown }
    if (typeof decoded.salt !== "string" || decoded.salt.length === 0) return "invalid"
    salt = decoded.salt
  } catch {
    return "invalid"
  }

  // Reuse the challenge's own expiry as the replay-record TTL: once the
  // challenge can no longer verify, the record is prunable.
  const expiresParam = extractParams(payload).expires
  const expiresSecs = expiresParam ? Number(expiresParam) : Number.NaN
  const expiresAt = Number.isFinite(expiresSecs)
    ? new Date(expiresSecs * 1000)
    : new Date(Date.now() + config.altchaChallengeExpiryMinutes * 60_000)

  const recorded = await altchaSolutions.recordSolution(db, salt, expiresAt)
  return recorded ? "ok" : "replay"
}
