import * as campaignMembers from "@src/db/campaign_members"
import type { User } from "@src/db/users"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"

type RespondAction = "accept" | "decline"

export type RespondResult = ServiceResult<{ action: RespondAction }>

/**
 * Respond to a campaign invite (accept or decline)
 *
 * Note: This service cannot use authorizeCampaign because pending invites
 * don't have accepted_at set, so getUserRole() returns null and the user
 * would be treated as "not_member". We must look up membership directly.
 */
export async function respondToInvite(
  db: SQL,
  campaignId: string,
  user: User,
  action: RespondAction
): Promise<RespondResult> {
  const member = await campaignMembers.findByCampaignAndUser(db, campaignId, user.id)

  if (!member) {
    return { complete: false, values: {}, errors: { _form: "Invitation not found" } }
  }

  if (member.accepted_at) {
    return {
      complete: false,
      values: {},
      errors: { _form: "You have already accepted this invitation" },
    }
  }

  if (member.declined_at) {
    return { complete: false, values: {}, errors: { _form: "This invitation has been declined" } }
  }

  if (action === "accept") {
    await campaignMembers.accept(db, member.id)
  } else {
    await campaignMembers.decline(db, member.id)
  }

  return { complete: true, result: { action } }
}
