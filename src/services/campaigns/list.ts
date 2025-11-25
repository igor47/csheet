import type { Campaign } from "@src/db/campaigns"
import type { SQL } from "bun"

export interface ListCampaign extends Campaign {
  member_count: number
  character_count: number
}

export interface ListCampaignsFilter {
  userId: string
  includeArchived?: boolean
}

/**
 * Efficiently fetch campaigns with member and character counts for list views
 * Uses a single query with JOIN and aggregation to avoid N+1 queries
 */
export async function listCampaigns(db: SQL, filter: ListCampaignsFilter): Promise<ListCampaign[]> {
  const { userId, includeArchived = false } = filter

  // Build the archive filter and order clause based on includeArchived
  // biome-ignore lint/suspicious/noExplicitAny: Bun SQL query
  let archiveFilterQ: SQL.Query<any>, orderByQ: SQL.Query<any>
  if (includeArchived) {
    archiveFilterQ = db`true`
    orderByQ = db`c.archived_at IS NULL DESC, c.created_at DESC`
  } else {
    archiveFilterQ = db`c.archived_at IS NULL`
    orderByQ = db`c.created_at DESC`
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
    )
    SELECT
      c.*,
      COALESCE(mc.member_count, 0) as member_count,
      COALESCE(cc.character_count, 0) as character_count
    FROM campaigns c
    LEFT JOIN campaign_member_counts mc ON mc.campaign_id = c.id
    LEFT JOIN campaign_character_counts cc ON cc.campaign_id = c.id
    WHERE (c.created_by = ${userId}
       OR c.id IN (
         SELECT campaign_id
         FROM campaign_members
         WHERE user_id = ${userId} AND accepted_at IS NOT NULL
       ))
      AND ${archiveFilterQ}
    ORDER BY ${orderByQ}
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
    })
  )
}
