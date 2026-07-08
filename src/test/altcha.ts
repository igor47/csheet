import { config } from "@src/config"
import { createChallenge, solveChallenge } from "altcha-lib/v1"

/**
 * Mint a fresh, low-difficulty login challenge and solve it, returning the
 * base64 payload the ALTCHA widget would submit in the "altcha" form field.
 *
 * A small maxnumber keeps solving near-instant in tests; difficulty has no
 * effect on verification (which checks signature, expiry, and solution only).
 * Each call uses a new challenge (unique salt), so repeated calls never collide
 * on replay.
 */
export async function solvedAltchaPayload(): Promise<string> {
  const challenge = await createChallenge({
    hmacKey: config.altchaHmacKey,
    algorithm: "SHA-256",
    maxnumber: 1000,
    expires: new Date(Date.now() + config.altchaChallengeExpiryMinutes * 60_000),
  })
  const { promise } = solveChallenge(
    challenge.challenge,
    challenge.salt,
    challenge.algorithm,
    challenge.maxnumber
  )
  const solution = await promise
  if (!solution) {
    throw new Error("failed to solve ALTCHA challenge in test")
  }
  return btoa(
    JSON.stringify({
      algorithm: challenge.algorithm,
      challenge: challenge.challenge,
      number: solution.number,
      salt: challenge.salt,
      signature: challenge.signature,
    })
  )
}
