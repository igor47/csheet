import type { Campaign } from "@src/db/campaigns"
import type { SQL } from "bun"

// User's invite status for a campaign
export type InviteStatus = "pending" | "accepted" | "needs_character" | null

export interface ListCampaign extends Campaign {
  member_count: number
  character_count: number
  invite_status: InviteStatus
  invited_by_email: string | null
}

export interface ListCampaignsFilter {
  userId: string
  includeArchived?: boolean
}

/**
 * Efficiently fetch campaigns with member and character counts for list views
 * Uses a single query with JOIN and aggregation to avoid N+1 queries
 * Also includes the user's invite status for each campaign
 */
export async function listCampaigns(db: SQL, filter: ListCampaignsFilter): Promise<ListCampaign[]> {
  const { userId, includeArchived = false } = filter

  // Build the archive filter based on includeArchived
  // biome-ignore lint/suspicious/noExplicitAny: Bun SQL query
  let archiveFilterQ: SQL.Query<any>
  if (includeArchived) {
    archiveFilterQ = db`true`
  } else {
    archiveFilterQ = db`c.archived_at IS NULL`
  }

  const results = await db`
    WITH campaign_member_counts AS (
      SELECT
        campaign_id,
        COUNT(*) as member_count
      FROM campaign_members
      WHERE accepted_at IS NOT NULL
      GROUP BY campaign_id
    ),
    campaign_character_counts AS (
      SELECT
        campaign_id,
        COUNT(*) as character_count
      FROM campaign_characters
      GROUP BY campaign_id
    ),
    user_membership AS (
      SELECT
        cm.campaign_id,
        cm.accepted_at,
        cm.declined_at,
        cm.role,
        cm.invited_by,
        CASE
          WHEN cm.accepted_at IS NULL AND cm.declined_at IS NULL THEN 'pending'
          WHEN cm.accepted_at IS NOT NULL AND cm.role = 'player' AND NOT EXISTS (
            SELECT 1 FROM campaign_characters cc
            WHERE cc.campaign_id = cm.campaign_id AND cc.added_by = cm.user_id
          ) THEN 'needs_character'
          WHEN cm.accepted_at IS NOT NULL THEN 'accepted'
          ELSE NULL
        END as invite_status
      FROM campaign_members cm
      WHERE cm.user_id = ${userId}
        AND cm.deleted_at IS NULL
    )
    SELECT
      c.*,
      COALESCE(mc.member_count, 0) as member_count,
      COALESCE(cc.character_count, 0) as character_count,
      um.invite_status,
      inviter.email as invited_by_email
    FROM campaigns c
    LEFT JOIN campaign_member_counts mc ON mc.campaign_id = c.id
    LEFT JOIN campaign_character_counts cc ON cc.campaign_id = c.id
    LEFT JOIN user_membership um ON um.campaign_id = c.id
    LEFT JOIN users inviter ON inviter.id = um.invited_by
    WHERE c.id IN (
         SELECT campaign_id
         FROM campaign_members
         WHERE user_id = ${userId}
           AND declined_at IS NULL
           AND deleted_at IS NULL
       )
      AND ${archiveFilterQ}
    ORDER BY
      CASE WHEN um.invite_status = 'pending' THEN 0
           WHEN um.invite_status = 'needs_character' THEN 1
           ELSE 2
      END,
      c.archived_at IS NULL DESC,
      c.created_at DESC
  `

  return results.map(
    // biome-ignore lint/suspicious/noExplicitAny: database row
    (row: any): ListCampaign => ({
      id: row.id,
      name: row.name,
      description: row.description,
      created_by: row.created_by,
      archived_at: row.archived_at ? new Date(row.archived_at) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      member_count: Number(row.member_count),
      character_count: Number(row.character_count),
      invite_status: row.invite_status as InviteStatus,
      invited_by_email: row.invited_by_email ?? null,
    })
  )
}
