import type { Character } from "@src/db/characters"
import type { ClassNameType } from "@src/lib/dnd"
import type { CharacterAvatarWithUrl } from "@src/services/computeCharacter"
import type { SQL } from "bun"

export interface CharacterClass {
  class: ClassNameType
  level: number
  subclass: string | null
}

export interface ListCharacter extends Character {
  classes: CharacterClass[]
  totalLevel: number
  avatars: Omit<
    CharacterAvatarWithUrl,
    "id" | "character_id" | "upload_id" | "created_at" | "updated_at"
  >[]
}

export type ListCharactersFilter =
  | {
      campaignId: string
    }
  | {
      userId: string
      includeArchived?: boolean
    }

// biome-ignore lint/suspicious/noExplicitAny: database row
function parseListCharacterRow(row: any): ListCharacter {
  const classes: CharacterClass[] = Array.isArray(row.classes) ? row.classes : []
  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0)

  const avatars = row.primary_avatar
    ? [
        {
          uploadUrl: row.primary_avatar.uploadUrl,
          is_primary: true,
          crop_x_percent: row.primary_avatar.crop_x_percent,
          crop_y_percent: row.primary_avatar.crop_y_percent,
          crop_width_percent: row.primary_avatar.crop_width_percent,
          crop_height_percent: row.primary_avatar.crop_height_percent,
        },
      ]
    : []

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    species: row.species,
    lineage: row.lineage,
    background: row.background,
    alignment: row.alignment,
    ruleset: row.ruleset,
    archived_at: row.archived_at ? new Date(row.archived_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    classes,
    totalLevel,
    avatars,
  }
}

/**
 * Efficiently fetch characters with their class/level information for list views
 * Uses a single query with JOIN and aggregation to avoid N+1 queries
 */
export async function listCharacters(
  db: SQL,
  filter: ListCharactersFilter
): Promise<ListCharacter[]> {
  // biome-ignore lint/suspicious/noExplicitAny: Bun SQL query
  let characterIdsQ: SQL.Query<any>, orderByQ: SQL.Query<any>
  if ("campaignId" in filter) {
    characterIdsQ = db`
      SELECT cc.character_id as id
      FROM campaign_characters cc
      WHERE cc.campaign_id = ${filter.campaignId}
    `
    orderByQ = db`c.id ASC`
  } else if ("userId" in filter) {
    if (filter.includeArchived) {
      characterIdsQ = db`
        SELECT c.id
        FROM characters c
        WHERE c.user_id = ${filter.userId}
      `
      orderByQ = db`c.archived_at IS NULL DESC, c.id DESC`
    } else {
      characterIdsQ = db`
      SELECT c.id
      FROM characters c
      WHERE c.user_id = ${filter.userId} AND c.archived_at IS NULL
      `
      orderByQ = db`c.id DESC`
    }
  } else {
    return []
  }

  // Build the query using Bun's SQL tagged template
  // The structure is the same, just the filter conditions change
  const results = await db`
    WITH character_ids AS (${characterIdsQ}),
    current_levels AS (
      SELECT
        cl.character_id,
        cl.class,
        cl.level,
        cl.subclass,
        cl.id,
        ROW_NUMBER() OVER (PARTITION BY cl.character_id, cl.class ORDER BY cl.id DESC) as rn
      FROM char_levels cl
      WHERE cl.character_id IN (SELECT id FROM character_ids)
    ),
    primary_avatars AS (
      SELECT DISTINCT ON (ca.character_id)
        ca.character_id,
        ca.crop_x_percent,
        ca.crop_y_percent,
        ca.crop_width_percent,
        ca.crop_height_percent,
        u.id as upload_id
      FROM character_avatars ca
      INNER JOIN uploads u ON u.id = ca.upload_id
      WHERE ca.is_primary = true AND ca.character_id IN (SELECT id FROM character_ids)
      ORDER BY ca.character_id, ca.created_at DESC
    )
    SELECT
      c.*,
      COALESCE(
        json_agg(
          json_build_object('class', cl.class, 'level', cl.level, 'subclass', cl.subclass)
          ORDER BY cl.id ASC
        ) FILTER (WHERE cl.class IS NOT NULL),
        '[]'
      ) as classes,
      CASE
        WHEN pa.upload_id IS NOT NULL THEN
          json_build_object(
            'uploadUrl', '/uploads/' || pa.upload_id,
            'crop_x_percent', pa.crop_x_percent,
            'crop_y_percent', pa.crop_y_percent,
            'crop_width_percent', pa.crop_width_percent,
            'crop_height_percent', pa.crop_height_percent
          )
        ELSE NULL
      END as primary_avatar
    FROM characters c
    INNER JOIN character_ids ci ON ci.id = c.id
    LEFT JOIN current_levels cl ON cl.character_id = c.id AND cl.rn = 1
    LEFT JOIN primary_avatars pa ON pa.character_id = c.id
    GROUP BY c.id, pa.upload_id, pa.crop_x_percent, pa.crop_y_percent, pa.crop_width_percent, pa.crop_height_percent
    ORDER BY ${orderByQ}
  `

  return results.map(parseListCharacterRow)
}
