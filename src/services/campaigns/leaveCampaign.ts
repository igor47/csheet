import * as campaignCharacters from "@src/db/campaign_characters"
import * as campaignMembers from "@src/db/campaign_members"
import { findById } from "@src/db/users"
import type { ServiceResult } from "@src/lib/serviceResult"
import { syncContact } from "@src/services/syncContact"
import type { SQL } from "bun"

export type LeaveCampaignResult = ServiceResult<object>

/**
 * Leave a campaign (self-removal)
 *
 * Any accepted member can leave a campaign, except:
 * - The sole DM cannot leave (campaign must have at least one DM)
 * - Members with characters in the campaign must remove them first
 */
export async function leaveCampaign(
  db: SQL,
  campaignId: string,
  userId: string
): Promise<LeaveCampaignResult> {
  const member = await campaignMembers.findByCampaignAndUser(db, campaignId, userId)

  if (!member) {
    return {
      complete: false,
      values: {},
      errors: { _form: "You are not a member of this campaign" },
    }
  }

  if (!member.accepted_at) {
    return {
      complete: false,
      values: {},
      errors: { _form: "You have not accepted this invitation yet" },
    }
  }

  // Check if user has characters in the campaign
  const characters = await campaignCharacters.findByCampaignId(db, campaignId)
  const userCharacters = characters.filter((c) => c.added_by === userId)
  if (userCharacters.length > 0) {
    return {
      complete: false,
      values: {},
      errors: { _form: "Remove your characters from the campaign before leaving." },
    }
  }

  // If user is a DM, check if they're the only one
  if (member.role === "dm") {
    const allMembers = await campaignMembers.findByCampaignId(db, campaignId)
    const acceptedDMs = allMembers.filter((m) => m.role === "dm" && m.accepted_at)

    if (acceptedDMs.length <= 1) {
      return {
        complete: false,
        values: {},
        errors: { _form: "You cannot leave as the sole DM. Promote another member to DM first." },
      }
    }
  }

  await campaignMembers.softDelete(db, member.id)

  const user = await findById(db, userId)
  if (user) {
    await syncContact(db, user)
  }

  return { complete: true, result: {} }
}
