import * as campaignCharacters from "@src/db/campaign_characters"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"

export type RevealCharacterResult = ServiceResult<{ characterId: string }>

/**
 * Reveal an NPC to all players in the campaign
 */
export async function revealCharacter(
  db: SQL,
  campaignId: string,
  characterId: string
): Promise<RevealCharacterResult> {
  const updated = await campaignCharacters.updateRevealedAt(db, campaignId, characterId, new Date())

  if (!updated) {
    return {
      complete: false,
      values: {},
      errors: { general: "Character not found in this campaign" },
    }
  }

  return { complete: true, result: { characterId } }
}

/**
 * Hide an NPC from players in the campaign
 */
export async function hideCharacter(
  db: SQL,
  campaignId: string,
  characterId: string
): Promise<RevealCharacterResult> {
  const updated = await campaignCharacters.updateRevealedAt(db, campaignId, characterId, null)

  if (!updated) {
    return {
      complete: false,
      values: {},
      errors: { general: "Character not found in this campaign" },
    }
  }

  return { complete: true, result: { characterId } }
}
