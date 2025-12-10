import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CampaignCharacterSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  character_id: z.string(),
  revealed_at: z.date().nullable().default(null),
  added_by: z.string(),
  added_at: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCampaignCharacterSchema = CampaignCharacterSchema.omit({
  id: true,
  added_at: true,
  created_at: true,
  updated_at: true,
})

export type CampaignCharacter = z.infer<typeof CampaignCharacterSchema>
export type CreateCampaignCharacter = z.infer<typeof CreateCampaignCharacterSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCampaignCharacter(row: any): CampaignCharacter {
  return CampaignCharacterSchema.parse({
    ...row,
    revealed_at: row.revealed_at ? new Date(row.revealed_at) : null,
    added_at: new Date(row.added_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(
  db: SQL,
  campaignCharacter: CreateCampaignCharacter
): Promise<CampaignCharacter> {
  const id = ulid()

  const result = await db`
    INSERT INTO campaign_characters (id, campaign_id, character_id, revealed_at, added_by)
    VALUES (
      ${id},
      ${campaignCharacter.campaign_id},
      ${campaignCharacter.character_id},
      ${campaignCharacter.revealed_at},
      ${campaignCharacter.added_by}
    )
    RETURNING *
  `

  return parseCampaignCharacter(result[0])
}

export interface CampaignCharacterWithAddedBy extends CampaignCharacter {
  added_by_email: string
  added_by_name: string | null
}

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCampaignCharacterWithAddedBy(row: any): CampaignCharacterWithAddedBy {
  return {
    ...parseCampaignCharacter(row),
    added_by_email: row.added_by_email,
    added_by_name: row.added_by_name ?? null,
  }
}

export async function findByCampaignId(
  db: SQL,
  campaignId: string
): Promise<CampaignCharacterWithAddedBy[]> {
  const result = await db`
    SELECT cc.*, u.email as added_by_email, u.name as added_by_name
    FROM campaign_characters cc
    JOIN users u ON u.id = cc.added_by
    WHERE cc.campaign_id = ${campaignId}
    ORDER BY cc.added_at ASC
  `

  return result.map(parseCampaignCharacterWithAddedBy)
}

export async function deleteByCharacterId(
  db: SQL,
  campaignId: string,
  characterId: string
): Promise<boolean> {
  const result = await db`
    DELETE FROM campaign_characters
    WHERE campaign_id = ${campaignId} AND character_id = ${characterId}
    RETURNING id
  `

  return result.length > 0
}

export async function updateRevealedAt(
  db: SQL,
  campaignId: string,
  characterId: string,
  revealedAt: Date | null
): Promise<CampaignCharacter | null> {
  const result = await db`
    UPDATE campaign_characters
    SET revealed_at = ${revealedAt}, updated_at = CURRENT_TIMESTAMP
    WHERE campaign_id = ${campaignId} AND character_id = ${characterId}
    RETURNING *
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignCharacter(result[0])
}

/**
 * Reveal all hidden characters added by a specific user in a campaign
 * Used when DM becomes player - their NPCs become player characters
 * Returns the number of characters revealed
 */
export async function revealAllByAddedBy(
  db: SQL,
  campaignId: string,
  addedBy: string
): Promise<number> {
  const result = await db`
    UPDATE campaign_characters
    SET revealed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE campaign_id = ${campaignId}
      AND added_by = ${addedBy}
      AND revealed_at IS NULL
    RETURNING id
  `

  return result.length
}

/**
 * Count characters added by a specific user in a campaign
 * Used for validation when changing roles
 */
export async function countByAddedBy(
  db: SQL,
  campaignId: string,
  addedBy: string
): Promise<number> {
  const result = await db`
    SELECT COUNT(*) as count
    FROM campaign_characters
    WHERE campaign_id = ${campaignId}
      AND added_by = ${addedBy}
  `

  return Number(result[0].count)
}

/**
 * Role a user has in relation to a character through campaign membership
 */
export type CharacterCampaignRole = "dm" | "party"

/**
 * Get the user's role in relation to a character through campaign membership.
 * Returns the highest role if user is in multiple campaigns with this character.
 *
 * Returns:
 * - "dm" if user is DM (creator or explicit DM role) of any campaign with this character
 * - "party" if user is a non-DM member of any campaign with this character
 * - null if user is not a member of any campaign with this character
 */
export async function getUserCharacterCampaignRole(
  db: SQL,
  characterId: string,
  userId: string
): Promise<CharacterCampaignRole | null> {
  const result = await db`
    SELECT
      CASE
        WHEN c.created_by = ${userId} THEN 'dm'
        WHEN cm.role = 'dm' THEN 'dm'
        ELSE 'party'
      END as role_type
    FROM campaign_characters cc
    JOIN campaigns c ON c.id = cc.campaign_id
    JOIN campaign_members cm ON cm.campaign_id = cc.campaign_id
      AND cm.user_id = ${userId}
      AND cm.accepted_at IS NOT NULL
      AND cm.deleted_at IS NULL
    WHERE cc.character_id = ${characterId}
    ORDER BY
      CASE WHEN c.created_by = ${userId} OR cm.role = 'dm' THEN 0 ELSE 1 END
    LIMIT 1
  `

  if (result.length === 0) return null
  return result[0].role_type as CharacterCampaignRole
}
