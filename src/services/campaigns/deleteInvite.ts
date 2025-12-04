import * as campaignMembers from "@src/db/campaign_members"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"

export type DeleteInviteResult = ServiceResult<object>

/**
 * Delete a pending or declined campaign invite
 *
 * DMs can delete invites that haven't been accepted yet.
 * This is useful for cleaning up declined invites or rescinding pending ones.
 */
export async function deleteInvite(
  db: SQL,
  campaignId: string,
  memberId: string
): Promise<DeleteInviteResult> {
  const member = await campaignMembers.findById(db, memberId)

  if (!member) {
    return { complete: false, values: {}, errors: { _form: "Invitation not found" } }
  }

  if (member.campaign_id !== campaignId) {
    return { complete: false, values: {}, errors: { _form: "Invitation not found" } }
  }

  if (member.accepted_at) {
    return { complete: false, values: {}, errors: { _form: "Cannot delete accepted membership" } }
  }

  await campaignMembers.softDelete(db, memberId)
  return { complete: true, result: {} }
}
