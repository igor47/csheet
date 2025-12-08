import * as campaignMembers from "@src/db/campaign_members"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"

export type DeleteInviteResult = ServiceResult<object>

/**
 * Delete a campaign member or invite
 *
 * DMs can:
 * - Delete pending or declined invites
 * - Remove accepted viewers and players from the campaign
 *
 * Cannot remove accepted DMs (they must leave themselves).
 */
export async function deleteInvite(
  db: SQL,
  campaignId: string,
  memberId: string
): Promise<DeleteInviteResult> {
  const member = await campaignMembers.findById(db, memberId)

  if (!member) {
    return { complete: false, values: {}, errors: { _form: "Member not found" } }
  }

  if (member.campaign_id !== campaignId) {
    return { complete: false, values: {}, errors: { _form: "Member not found" } }
  }

  // Can always delete pending or declined invites
  // For accepted members, viewers and players can be removed by DMs
  // DMs must leave themselves
  if (member.accepted_at && member.role === "dm") {
    return {
      complete: false,
      values: {},
      errors: { _form: "Cannot remove accepted DMs. They must leave themselves." },
    }
  }

  await campaignMembers.softDelete(db, memberId)
  return { complete: true, result: {} }
}
