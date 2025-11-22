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
