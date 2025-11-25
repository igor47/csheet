import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  created_by: z.string(),
  archived_at: z.date().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCampaignSchema = CampaignSchema.omit({
  id: true,
  archived_at: true,
  created_at: true,
  updated_at: true,
})

export type Campaign = z.infer<typeof CampaignSchema>
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCampaign(row: any): Campaign {
  return CampaignSchema.parse({
    ...row,
    archived_at: row.archived_at ? new Date(row.archived_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, campaign: CreateCampaign): Promise<Campaign> {
  const id = ulid()

  const result = await db`
    INSERT INTO campaigns (id, name, description, created_by)
    VALUES (
      ${id},
      ${campaign.name},
      ${campaign.description},
      ${campaign.created_by}
    )
    RETURNING *
  `

  return parseCampaign(result[0])
}

export async function findById(db: SQL, id: string): Promise<Campaign | null> {
  const result = await db`
    SELECT * FROM campaigns
    WHERE id = ${id}
    LIMIT 1
  `

  if (!result[0]) return null

  return parseCampaign(result[0])
}

export async function nameExistsForUser(db: SQL, userId: string, name: string): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM campaigns
    WHERE created_by = ${userId} AND LOWER(name) = LOWER(${name}) AND archived_at IS NULL
    LIMIT 1
  `

  return result[0].count > 0
}

export async function archive(db: SQL, id: string): Promise<Campaign | null> {
  const result = await db`
    UPDATE campaigns
    SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `

  if (!result[0]) return null
  return parseCampaign(result[0])
}

export async function unarchive(db: SQL, id: string): Promise<Campaign | null> {
  const result = await db`
    UPDATE campaigns
    SET archived_at = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `

  if (!result[0]) return null
  return parseCampaign(result[0])
}

export async function countArchivedByUserId(db: SQL, userId: string): Promise<number> {
  const result = await db`
    SELECT COUNT(*) as count FROM campaigns c
    WHERE c.archived_at IS NOT NULL
      AND (
        c.created_by = ${userId}
        OR EXISTS (
          SELECT 1 FROM campaign_members cm
          WHERE cm.campaign_id = c.id
            AND cm.user_id = ${userId}
            AND cm.accepted_at IS NOT NULL
        )
      )
  `

  return Number(result[0].count)
}
