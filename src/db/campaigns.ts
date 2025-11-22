import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  created_by: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCampaignSchema = CampaignSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type Campaign = z.infer<typeof CampaignSchema>
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCampaign(row: any): Campaign {
  return CampaignSchema.parse({
    ...row,
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
