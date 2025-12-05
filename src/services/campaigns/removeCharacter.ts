import * as campaignCharacters from "@src/db/campaign_characters"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"
import type { ComputedCampaign } from "./compute"

export type RemoveCharacterResult = ServiceResult<object>

/**
 * Remove a character from a campaign
 * - Character owners can remove their own characters
 * - DMs can remove any character
 */
export async function removeCharacterFromCampaign(
  db: SQL,
  campaign: ComputedCampaign,
  characterId: string
): Promise<RemoveCharacterResult> {
  // Find the character in the campaign
  const campaignCharacter = campaign.characters.find((cc) => cc.character_id === characterId)
  if (!campaignCharacter) {
    return { complete: false, values: {}, errors: { general: "Character not in this campaign" } }
  }

  // Check permissions: owner or DM can remove
  const isOwner = campaignCharacter.user_id === campaign.currentUserId
  const isDM = campaign.userRole === "dm"

  if (!isOwner && !isDM) {
    return {
      complete: false,
      values: {},
      errors: { general: "You don't have permission to remove this character" },
    }
  }

  // Remove the character
  const deleted = await campaignCharacters.deleteByCharacterId(db, campaign.id, characterId)
  if (!deleted) {
    return { complete: false, values: {}, errors: { general: "Failed to remove character" } }
  }

  return { complete: true, result: {} }
}
