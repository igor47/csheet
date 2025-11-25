import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CampaignMemberRoleSchema = z.enum(["dm", "player", "viewer"])
export type CampaignMemberRole = z.infer<typeof CampaignMemberRoleSchema>

export const CampaignMemberSchema = z.object({
  id: z.string(),
  campaign_id: z.string(),
  user_id: z.string(),
  role: CampaignMemberRoleSchema,
  invited_at: z.date(),
  invited_by: z.string(),
  accepted_at: z.date().nullable().default(null),
  declined_at: z.date().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCampaignMemberSchema = CampaignMemberSchema.omit({
  id: true,
  invited_at: true,
  created_at: true,
  updated_at: true,
})

export type CampaignMember = z.infer<typeof CampaignMemberSchema>
export type CreateCampaignMember = z.infer<typeof CreateCampaignMemberSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCampaignMember(row: any): CampaignMember {
  return CampaignMemberSchema.parse({
    ...row,
    invited_at: new Date(row.invited_at),
    accepted_at: row.accepted_at ? new Date(row.accepted_at) : null,
    declined_at: row.declined_at ? new Date(row.declined_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, member: CreateCampaignMember): Promise<CampaignMember> {
  const id = ulid()

  const result = await db`
    INSERT INTO campaign_members (id, campaign_id, user_id, role, invited_by, accepted_at, declined_at)
    VALUES (
      ${id},
      ${member.campaign_id},
      ${member.user_id},
      ${member.role},
      ${member.invited_by},
      ${member.accepted_at},
      ${member.declined_at}
    )
    RETURNING *
  `

  return parseCampaignMember(result[0])
}

export interface CampaignMemberWithUser extends CampaignMember {
  email: string
}

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCampaignMemberWithUser(row: any): CampaignMemberWithUser {
  return {
    ...parseCampaignMember(row),
    email: row.email,
  }
}

export async function findByCampaignId(
  db: SQL,
  campaignId: string
): Promise<CampaignMemberWithUser[]> {
  const result = await db`
    SELECT cm.*, u.email
    FROM campaign_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.campaign_id = ${campaignId}
    ORDER BY cm.invited_at ASC
  `

  return result.map(parseCampaignMemberWithUser)
}
