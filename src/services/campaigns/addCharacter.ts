import * as campaignCharacters from "@src/db/campaign_characters"
import type { CampaignMemberRole } from "@src/db/campaign_members"
import * as characters from "@src/db/characters"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"
import type { ComputedCampaign } from "./compute"

export type AddCharacterResult = ServiceResult<{ campaignCharacterId: string }>

/**
 * Add a character to a campaign
 *
 * @param role - The user's role in the campaign. DMs add NPCs (hidden), players add characters (visible).
 */
export async function addCharacterToCampaign(
  db: SQL,
  campaign: ComputedCampaign,
  characterId: string,
  userId: string,
  role: CampaignMemberRole
): Promise<AddCharacterResult> {
  // Verify character exists
  const character = await characters.findById(db, characterId)
  if (!character) {
    return { complete: false, values: {}, errors: { general: "Character not found" } }
  }

  // Verify user owns the character
  if (character.user_id !== userId) {
    return { complete: false, values: {}, errors: { general: "You don't own this character" } }
  }

  // Check if character already in campaign (using computed data)
  const alreadyInCampaign = campaign.characters.some((cc) => cc.character_id === characterId)
  if (alreadyInCampaign) {
    return {
      complete: false,
      values: {},
      errors: { general: "Character already in this campaign" },
    }
  }

  // DMs add NPCs (hidden by default), players add characters (immediately visible)
  const revealedAt = role === "dm" ? null : new Date()

  const campaignCharacter = await campaignCharacters.create(db, {
    campaign_id: campaign.id,
    character_id: characterId,
    added_by: userId,
    revealed_at: revealedAt,
  })

  return { complete: true, result: { campaignCharacterId: campaignCharacter.id } }
}
