import type { Character } from "@src/db/characters"
import type { ClassNameType } from "@src/lib/dnd"
import type { SQL } from "bun"

export interface CharacterClass {
  class: ClassNameType
  level: number
  subclass: string | null
}

export interface ListCharacter extends Character {
  classes: CharacterClass[]
  totalLevel: number
}

/**
 * Efficiently fetch characters with their class/level information for list views
 * Uses a single query with JOIN and aggregation to avoid N+1 queries
 */
export async function listCharacters(
  db: SQL,
  userId: string,
  includeArchived = false
): Promise<ListCharacter[]> {
  // Get current level for each class per character (same logic as getCurrentLevels)
  const query = includeArchived
    ? db`
        WITH current_levels AS (
          SELECT
            cl.character_id,
            cl.class,
            cl.level,
            cl.subclass,
            cl.id,
            ROW_NUMBER() OVER (PARTITION BY cl.character_id, cl.class ORDER BY cl.id DESC) as rn
          FROM char_levels cl
          INNER JOIN characters c ON c.id = cl.character_id
          WHERE c.user_id = ${userId}
        )
        SELECT
          c.*,
          COALESCE(
            json_agg(
              json_build_object('class', cl.class, 'level', cl.level, 'subclass', cl.subclass)
              ORDER BY cl.id ASC
            ) FILTER (WHERE cl.class IS NOT NULL),
            '[]'
          ) as classes
        FROM characters c
        LEFT JOIN current_levels cl ON cl.character_id = c.id AND cl.rn = 1
        WHERE c.user_id = ${userId}
        GROUP BY c.id
        ORDER BY c.archived_at IS NULL DESC, c.created_at DESC
      `
    : db`
        WITH current_levels AS (
          SELECT
            cl.character_id,
            cl.class,
            cl.level,
            cl.subclass,
            cl.id,
            ROW_NUMBER() OVER (PARTITION BY cl.character_id, cl.class ORDER BY cl.id DESC) as rn
          FROM char_levels cl
          INNER JOIN characters c ON c.id = cl.character_id
          WHERE c.user_id = ${userId} AND c.archived_at IS NULL
        )
        SELECT
          c.*,
          COALESCE(
            json_agg(
              json_build_object('class', cl.class, 'level', cl.level, 'subclass', cl.subclass)
              ORDER BY cl.id ASC
            ) FILTER (WHERE cl.class IS NOT NULL),
            '[]'
          ) as classes
        FROM characters c
        LEFT JOIN current_levels cl ON cl.character_id = c.id AND cl.rn = 1
        WHERE c.user_id = ${userId} AND c.archived_at IS NULL
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `

  const results = await query

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return results.map((row: any): ListCharacter => {
    const classes: CharacterClass[] = Array.isArray(row.classes) ? row.classes : []
    const totalLevel = classes.reduce((sum, c) => sum + c.level, 0)

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
    }
  })
}
