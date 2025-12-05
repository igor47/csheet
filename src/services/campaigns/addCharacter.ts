import * as campaignCharacters from "@src/db/campaign_characters"
import * as characters from "@src/db/characters"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"
import type { ComputedCampaign } from "./compute"

export type AddCharacterResult = ServiceResult<{ campaignCharacterId: string }>

/**
 * Add a character to a campaign
 */
export async function addCharacterToCampaign(
  db: SQL,
  campaign: ComputedCampaign,
  characterId: string,
  userId: string
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

  // Add to campaign - player characters are immediately visible
  const campaignCharacter = await campaignCharacters.create(db, {
    campaign_id: campaign.id,
    character_id: characterId,
    added_by: userId,
    revealed_at: new Date(),
  })

  return { complete: true, result: { campaignCharacterId: campaignCharacter.id } }
}
