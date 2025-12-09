import * as campaignCharacters from "@src/db/campaign_characters"
import * as campaignMembers from "@src/db/campaign_members"
import { CampaignMemberRoleSchema } from "@src/db/campaign_members"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { ComputedCampaign, ComputedCampaignMember } from "@src/services/campaigns/compute"
import type { SQL } from "bun"
import { z } from "zod"

export const ChangeRoleSchema = z.object({
  newRole: CampaignMemberRoleSchema,
})

export interface ChangeRoleResult {
  npcsRevealed: number
}

export type ChangeRoleServiceResult = ServiceResult<ChangeRoleResult>

/**
 * Change a campaign member's role
 *
 * Validation rules:
 * - Cannot reduce DM count below 1
 * - DM->Viewer blocked if DM has any NPCs (viewers can't own characters)
 * - DM->Player reveals all their NPCs (they become player characters)
 * - Player->Viewer blocked if player has characters (must remove first)
 * - Player->DM: Characters automatically become NPCs (via isNPC computed field)
 * - DMs cannot change other DMs' roles (they must do it themselves)
 */
export async function changeRole(
  db: SQL,
  campaign: ComputedCampaign,
  member: ComputedCampaignMember,
  actingUserId: string,
  data: Record<string, string>
): Promise<ChangeRoleServiceResult> {
  // Validate with Zod schema
  const parsed = ChangeRoleSchema.safeParse(data)
  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string
      errors[field] = issue.message
    }
    return { complete: false, values: data, errors }
  }

  const { newRole } = parsed.data
  const currentRole = member.role

  // No change needed
  if (currentRole === newRole) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Member already has this role" },
    }
  }

  // Must be an accepted member
  if (!member.accepted_at) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Cannot change role of pending invites" },
    }
  }

  // Determine if this is self-change or DM changing another member
  const isSelfChange = member.user_id === actingUserId

  // For DM changing another member (not self), cannot change other DMs
  if (!isSelfChange && currentRole === "dm") {
    return {
      complete: false,
      values: data,
      errors: { _form: "Cannot change another DM's role. They must change it themselves." },
    }
  }

  // Count accepted DMs
  const acceptedDMs = campaign.members.filter((m) => m.role === "dm" && m.accepted_at)

  // If DM is changing role, ensure at least one DM remains
  if (currentRole === "dm" && acceptedDMs.length <= 1) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Cannot change role: you are the only DM" },
    }
  }

  // Count characters added by this member
  const characterCount = campaign.characters.filter((c) => c.added_by === member.user_id).length

  // Block DM->Viewer if DM has NPCs (viewers can't own characters)
  if (currentRole === "dm" && newRole === "viewer" && characterCount > 0) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Remove your NPCs from the campaign before becoming a viewer" },
    }
  }

  // Block player->viewer if player has characters
  if (currentRole === "player" && newRole === "viewer" && characterCount > 0) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Remove your characters from the campaign before becoming a viewer" },
    }
  }

  let npcsRevealed = 0

  // Handle DM->Player transition: reveal all their NPCs
  if (currentRole === "dm" && newRole === "player") {
    npcsRevealed = await campaignCharacters.revealAllByAddedBy(db, campaign.id, member.user_id)
  }

  // Update the role
  await campaignMembers.updateRole(db, member.id, newRole)

  return {
    complete: true,
    result: { npcsRevealed },
  }
}
