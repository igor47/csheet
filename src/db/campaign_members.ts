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
  invite_token: z.string().nullable(),
  invited_at: z.date(),
  invited_by: z.string(),
  accepted_at: z.date().nullable().default(null),
  declined_at: z.date().nullable().default(null),
  deleted_at: z.date().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCampaignMemberSchema = CampaignMemberSchema.omit({
  id: true,
  invited_at: true,
  deleted_at: true,
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
    deleted_at: row.deleted_at ? new Date(row.deleted_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, member: CreateCampaignMember): Promise<CampaignMember> {
  const id = ulid()

  const result = await db`
    INSERT INTO campaign_members (id, campaign_id, user_id, role, invite_token, invited_by, accepted_at, declined_at)
    VALUES (
      ${id},
      ${member.campaign_id},
      ${member.user_id},
      ${member.role},
      ${member.invite_token},
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
      AND cm.deleted_at IS NULL
    ORDER BY cm.invited_at ASC
  `

  return result.map(parseCampaignMemberWithUser)
}

/**
 * Find a campaign member by campaign and user
 */
export async function findByCampaignAndUser(
  db: SQL,
  campaignId: string,
  userId: string
): Promise<CampaignMember | null> {
  const result = await db`
    SELECT *
    FROM campaign_members
    WHERE campaign_id = ${campaignId}
      AND user_id = ${userId}
      AND deleted_at IS NULL
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignMember(result[0])
}

/**
 * Find any campaign member by campaign and user (including deleted)
 * Returns the most recent record if multiple exist
 * Used for invite logic to check all membership states
 */
export async function findAnyByCampaignAndUser(
  db: SQL,
  campaignId: string,
  userId: string
): Promise<CampaignMember | null> {
  const result = await db`
    SELECT *
    FROM campaign_members
    WHERE campaign_id = ${campaignId}
      AND user_id = ${userId}
    ORDER BY id DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignMember(result[0])
}

/**
 * Find a campaign member by ID
 */
export async function findById(db: SQL, id: string): Promise<CampaignMember | null> {
  const result = await db`
    SELECT *
    FROM campaign_members
    WHERE id = ${id}
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignMember(result[0])
}

/**
 * Accept a pending invite
 */
export async function accept(db: SQL, memberId: string): Promise<CampaignMember | null> {
  const now = new Date()

  const result = await db`
    UPDATE campaign_members
    SET accepted_at = ${now.toISOString()}, updated_at = ${now.toISOString()}
    WHERE id = ${memberId}
      AND accepted_at IS NULL
      AND declined_at IS NULL
    RETURNING *
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignMember(result[0])
}

/**
 * Decline a pending invite
 */
export async function decline(db: SQL, memberId: string): Promise<CampaignMember | null> {
  const now = new Date()

  const result = await db`
    UPDATE campaign_members
    SET declined_at = ${now.toISOString()}, updated_at = ${now.toISOString()}
    WHERE id = ${memberId}
      AND accepted_at IS NULL
      AND declined_at IS NULL
    RETURNING *
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignMember(result[0])
}

export interface NotificationCounts {
  pendingInvites: number
  pendingViewerInvites: number
  needsCharacter: number
}

/**
 * Get all notification counts for a user in a single query
 */
export async function getNotificationCounts(db: SQL, userId: string): Promise<NotificationCounts> {
  const result = await db`
    SELECT
      COUNT(*) FILTER (
        WHERE cm.accepted_at IS NULL
          AND cm.declined_at IS NULL
          AND cm.deleted_at IS NULL
      ) as pending_invites,
      COUNT(*) FILTER (
        WHERE cm.role = 'viewer'
          AND cm.accepted_at IS NULL
          AND cm.declined_at IS NULL
          AND cm.deleted_at IS NULL
      ) as pending_viewer_invites,
      COUNT(*) FILTER (
        WHERE cm.accepted_at IS NOT NULL
          AND cm.declined_at IS NULL
          AND cm.deleted_at IS NULL
          AND cm.role = 'player'
          AND NOT EXISTS (
            SELECT 1 FROM campaign_characters cc
            WHERE cc.campaign_id = cm.campaign_id
              AND cc.added_by = cm.user_id
          )
      ) as needs_character
    FROM campaign_members cm
    JOIN campaigns c ON c.id = cm.campaign_id
    WHERE cm.user_id = ${userId}
      AND c.archived_at IS NULL
  `

  return {
    pendingInvites: Number(result[0].pending_invites),
    pendingViewerInvites: Number(result[0].pending_viewer_invites),
    needsCharacter: Number(result[0].needs_character),
  }
}

export interface InviteTokenResult {
  memberId: string
  campaignId: string
  email: string
  deletedAt: Date | null
}

/**
 * Find an invite by its token
 * Returns null if token not found or invite already accepted/declined
 * Note: Also returns soft-deleted invites (check deletedAt field)
 */
export async function findByInviteToken(db: SQL, token: string): Promise<InviteTokenResult | null> {
  const result = await db`
    SELECT cm.id, cm.campaign_id, cm.deleted_at, u.email
    FROM campaign_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.invite_token = ${token}
      AND cm.accepted_at IS NULL
      AND cm.declined_at IS NULL
  `

  if (result.length === 0) {
    return null
  }

  return {
    memberId: result[0].id,
    campaignId: result[0].campaign_id,
    email: result[0].email,
    deletedAt: result[0].deleted_at ? new Date(result[0].deleted_at) : null,
  }
}

/**
 * Soft-delete a campaign member by ID (sets deleted_at)
 */
export async function softDelete(db: SQL, id: string): Promise<void> {
  const now = new Date()
  await db`
    UPDATE campaign_members
    SET deleted_at = ${now.toISOString()}, updated_at = ${now.toISOString()}
    WHERE id = ${id}
  `
}

/**
 * Reset an invite to pending state with a new token
 * Used when DM wants to re-invite someone who previously declined, removed, or resend expired invites
 */
export async function resetInvite(
  db: SQL,
  id: string,
  newToken: string,
  invitedBy: string
): Promise<CampaignMember | null> {
  const now = new Date()

  const result = await db`
    UPDATE campaign_members
    SET
      accepted_at = NULL,
      declined_at = NULL,
      deleted_at = NULL,
      invite_token = ${newToken},
      invited_at = ${now.toISOString()},
      invited_by = ${invitedBy},
      updated_at = ${now.toISOString()}
    WHERE id = ${id}
    RETURNING *
  `

  if (result.length === 0) {
    return null
  }

  return parseCampaignMember(result[0])
}
