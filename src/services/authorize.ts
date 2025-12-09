import { getDb } from "@src/db"
import { isUserDMOfCharacterCampaign } from "@src/db/campaign_characters"
import { setFlashMsg } from "@src/middleware/flash"
import type { Context } from "hono"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"

/**
 * Reasons why character access might not be allowed
 */
export type UnallowedReason = "not_authenticated" | "character_not_found" | "not_owner"

/**
 * Access type for a character - how the user is authorized to access it
 */
export type AccessType = "owner" | "dm"

/**
 * Result of authorization check - discriminated union
 */
export type AllowedResult =
  | { allowed: true; character: ComputedCharacter; accessType: AccessType }
  | { allowed: false; reason: UnallowedReason }

/**
 * Authorize access to a character (owner only)
 *
 * Checks:
 * 1. User is authenticated
 * 2. Character exists
 * 3. User owns the character
 *
 * @param c - Hono context (must have user from auth middleware)
 * @param characterId - ID of character to authorize
 * @returns AllowedResult with either the character or a reason for denial
 */
export async function authorizeCharacter(c: Context, characterId: string): Promise<AllowedResult> {
  // Check authentication
  const user = c.var.user
  if (!user) {
    return { allowed: false, reason: "not_authenticated" }
  }

  // Fetch character
  const character = await computeCharacter(getDb(c), characterId)
  if (!character) {
    return { allowed: false, reason: "character_not_found" }
  }

  // Check ownership
  if (character.user_id !== user.id) {
    return { allowed: false, reason: "not_owner" }
  }

  // Success!
  return { allowed: true, character, accessType: "owner" }
}

/**
 * Authorize view access to a character (owner or DM)
 *
 * Wraps authorizeCharacter and additionally allows DMs of campaigns
 * containing this character to view it.
 *
 * @param c - Hono context (must have user from auth middleware)
 * @param characterId - ID of character to authorize
 * @returns AllowedResult with either the character and access type, or a reason for denial
 */
export async function authorizeCharacterView(
  c: Context,
  characterId: string
): Promise<AllowedResult> {
  // First try owner authorization
  const ownerResult = await authorizeCharacter(c, characterId)
  if (ownerResult.allowed) {
    return ownerResult
  }

  // If not owner, check if user is DM of a campaign with this character
  // (only makes sense if user is authenticated and character exists)
  if (ownerResult.reason === "not_owner") {
    const user = c.var.user
    if (user) {
      const db = getDb(c)
      const isDM = await isUserDMOfCharacterCampaign(db, characterId, user.id)
      if (isDM) {
        // Re-fetch character for the result (authorizeCharacter already validated it exists)
        const character = await computeCharacter(db, characterId)
        if (character) {
          return { allowed: true, character, accessType: "dm" }
        }
      }
    }
  }

  // Not authorized
  return ownerResult
}

/**
 * Handle unauthorized access by setting flash message and redirecting
 *
 * Automatically detects HTMX requests and uses appropriate redirect mechanism.
 * Uses semantic HTTP status codes:
 * - 401 for not authenticated
 * - 404 for character not found
 * - 403 for not owner
 *
 * @param c - Hono context (must have isHtmx from HTMX middleware)
 * @param reason - Why access was denied
 * @returns Response with appropriate status code and redirect
 */
export async function handleUnallowed(c: Context, reason: UnallowedReason): Promise<Response> {
  // Determine status code and flash message
  let status: 401 | 403 | 404
  let message: string
  let redirectTo: string

  switch (reason) {
    case "not_authenticated":
      status = 401
      message = "Please log in to continue"
      redirectTo = "/login"
      break
    case "character_not_found":
      status = 404
      message = "Character not found"
      redirectTo = "/characters"
      break
    case "not_owner":
      status = 403
      message = "You do not have permission to access this character"
      redirectTo = "/characters"
      break
  }

  // Set flash message
  await setFlashMsg(c, message, "error")

  // Handle redirect based on request type
  const isHtmx = c.var.isHtmx
  if (isHtmx) {
    // HTMX request - use HX-Redirect header with semantic status
    c.header("HX-Redirect", redirectTo)
    return c.body(null, status)
  }

  // Regular request - use 302 redirect (semantic status codes don't work with redirects)
  return c.redirect(redirectTo, 302)
}
