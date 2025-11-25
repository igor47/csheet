import { getDb } from "@src/db"
import type { CampaignMemberRole } from "@src/db/campaign_members"
import { setFlashMsg } from "@src/middleware/flash"
import type { Context } from "hono"
import { type ComputedCampaign, computeCampaign } from "./compute"

/**
 * Reasons why campaign access might not be allowed
 */
export type UnallowedReason = "not_authenticated" | "campaign_not_found" | "not_member"

/**
 * Result of authorization check - discriminated union
 */
export type CampaignAllowedResult =
  | { allowed: true; campaign: ComputedCampaign; role: CampaignMemberRole }
  | { allowed: false; reason: UnallowedReason }

/**
 * Authorize access to a campaign
 *
 * Checks:
 * 1. User is authenticated
 * 2. Campaign exists
 * 3. User is a member (creator, DM, player, or viewer)
 *
 * @param c - Hono context (must have user from auth middleware)
 * @param campaignId - ID of campaign to authorize
 * @returns CampaignAllowedResult with either the campaign and role or a reason for denial
 */
export async function authorizeCampaign(
  c: Context,
  campaignId: string
): Promise<CampaignAllowedResult> {
  // Check authentication
  const user = c.var.user
  if (!user) {
    return { allowed: false, reason: "not_authenticated" }
  }

  // Fetch campaign with computed data
  const campaign = await computeCampaign(getDb(c), campaignId, user.id)
  if (!campaign) {
    return { allowed: false, reason: "campaign_not_found" }
  }

  // Check membership (userRole is null if not a member)
  if (!campaign.userRole) {
    return { allowed: false, reason: "not_member" }
  }

  // Success!
  return { allowed: true, campaign, role: campaign.userRole }
}

/**
 * Handle unauthorized campaign access by setting flash message and redirecting
 *
 * Automatically detects HTMX requests and uses appropriate redirect mechanism.
 * Uses semantic HTTP status codes:
 * - 401 for not authenticated
 * - 404 for campaign not found
 * - 403 for not member
 *
 * @param c - Hono context (must have isHtmx from HTMX middleware)
 * @param reason - Why access was denied
 * @returns Response with appropriate status code and redirect
 */
export async function handleCampaignUnallowed(
  c: Context,
  reason: UnallowedReason
): Promise<Response> {
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
    case "campaign_not_found":
      status = 404
      message = "Campaign not found"
      redirectTo = "/campaigns"
      break
    case "not_member":
      status = 403
      message = "You do not have permission to access this campaign"
      redirectTo = "/campaigns"
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
