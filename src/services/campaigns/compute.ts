import {
  type CampaignCharacterWithAddedBy,
  findByCampaignId as findCharactersByCampaignId,
} from "@src/db/campaign_characters"
import {
  type CampaignMemberRole,
  type CampaignMemberWithUser,
  findByCampaignId as findMembersByCampaignId,
} from "@src/db/campaign_members"
import { type Campaign, findById } from "@src/db/campaigns"
import { type ListCharacter, listCharacters } from "@src/services/listCharacters"
import type { SQL } from "bun"

export interface ComputedCampaignMember extends CampaignMemberWithUser {
  hasCharacter: boolean
}

export interface ComputedCampaignCharacter extends CampaignCharacterWithAddedBy {
  name: string
  level: number
  class_name: string
  user_id: string // owner of character
  isNPC: boolean
}

export interface ComputedCampaign extends Campaign {
  userRole: CampaignMemberRole | null
  members: ComputedCampaignMember[]
  characters: ComputedCampaignCharacter[]
  canInviteMembers: boolean
  canAddCharacters: boolean
  canRevealCharacters: boolean
  canManageViewers: boolean
  canChangeDMRole: boolean
}

function getUserRole(
  campaign: Campaign,
  members: CampaignMemberWithUser[],
  userId: string
): CampaignMemberRole | null {
  if (campaign.created_by === userId) {
    // Creator is implicitly a DM if not explicitly a member
    const explicitMembership = members.find((m) => m.user_id === userId)
    return explicitMembership?.role || "dm"
  }
  const membership = members.find((m) => m.user_id === userId)
  if (membership?.accepted_at) {
    return membership.role
  }
  return null
}

function getDMUserIds(campaign: Campaign, members: CampaignMemberWithUser[]): Set<string> {
  const dmUserIds = new Set<string>()
  if (campaign.created_by) {
    dmUserIds.add(campaign.created_by)
  }
  for (const member of members) {
    if (member.role === "dm" && member.accepted_at) {
      dmUserIds.add(member.user_id)
    }
  }
  return dmUserIds
}

function buildComputedMembers(
  members: CampaignMemberWithUser[],
  charactersInCampaign: CampaignCharacterWithAddedBy[]
): ComputedCampaignMember[] {
  // Map character owners for hasCharacter check
  const characterOwners = new Set(
    charactersInCampaign.map((cc) => cc.added_by) // added_by is who added to campaign
  )

  return members.map((m) => ({
    ...m,
    hasCharacter: characterOwners.has(m.user_id),
  }))
}

function buildComputedCharacters(
  campaignChars: CampaignCharacterWithAddedBy[],
  characterDetails: ListCharacter[],
  dmUserIds: Set<string>
): ComputedCampaignCharacter[] {
  // Create lookup map for character details
  const detailsMap = new Map(characterDetails.map((c) => [c.id, c]))

  return campaignChars.map((cc) => {
    const details = detailsMap.get(cc.character_id)

    return {
      ...cc,
      name: details?.name || "Unknown",
      level: details?.totalLevel || 1,
      class_name: details?.classes[0]?.class || "Unknown",
      user_id: details?.user_id || "",
      isNPC: dmUserIds.has(cc.added_by),
    }
  })
}

export async function computeCampaign(
  db: SQL,
  campaignId: string,
  userId: string
): Promise<ComputedCampaign | null> {
  // Load campaign
  const campaign = await findById(db, campaignId)
  if (!campaign) return null

  // Load all members and campaign_characters using typed db functions
  const [members, campaignChars, characterDetails] = await Promise.all([
    findMembersByCampaignId(db, campaignId),
    findCharactersByCampaignId(db, campaignId),
    listCharacters(db, { campaignId }),
  ])

  // Compute user role and DM set
  const userRole = getUserRole(campaign, members, userId)
  const dmUserIds = getDMUserIds(campaign, members)

  // Build computed members and characters
  const computedMembers = buildComputedMembers(members, campaignChars)
  const computedCharacters = buildComputedCharacters(campaignChars, characterDetails, dmUserIds)

  // Compute permission flags
  const isDM = userRole === "dm"
  const isPlayer = userRole === "player"
  const dmCount = computedMembers.filter((m) => m.role === "dm" && m.accepted_at).length

  return {
    ...campaign,
    userRole,
    members: computedMembers,
    characters: computedCharacters,
    canInviteMembers: isDM,
    canAddCharacters: isDM || isPlayer,
    canRevealCharacters: isDM,
    canManageViewers: isDM || isPlayer,
    canChangeDMRole: isDM && (dmCount > 1),
  }
}
