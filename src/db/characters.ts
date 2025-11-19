import { RulesetIdSchema } from "@src/lib/dnd/rulesets"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const CharacterSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(3),
  species: z.string(),
  lineage: z.string().nullable().default(null),
  background: z.string(),
  alignment: z.nullish(z.string()),
  ruleset: RulesetIdSchema.default(SRD51_ID),
  archived_at: z.date().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharacterSchema = CharacterSchema.omit({
  id: true,
  archived_at: true,
  created_at: true,
  updated_at: true,
})

export type Character = z.infer<typeof CharacterSchema>
export type CreateCharacter = z.infer<typeof CreateCharacterSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseCharacter(row: any): Character {
  return CharacterSchema.parse({
    ...row,
    archived_at: row.archived_at ? new Date(row.archived_at) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, character: CreateCharacter): Promise<Character> {
  const id = ulid()

  const result = await db`
    INSERT INTO characters (id, user_id, name, species, lineage, background, alignment, ruleset)
    VALUES (
      ${id},
      ${character.user_id},
      ${character.name},
      ${character.species},
      ${character.lineage},
      ${character.background},
      ${character.alignment},
      ${character.ruleset}
    )
    RETURNING *
  `

  return parseCharacter(result[0])
}

export async function findById(db: SQL, id: string): Promise<Character | null> {
  const result = await db`
    SELECT * FROM characters
    WHERE id = ${id}
    LIMIT 1
  `

  if (!result[0]) return null

  return parseCharacter(result[0])
}

export async function findByUserId(
  db: SQL,
  userId: string,
  includeArchived = false
): Promise<Character[]> {
  const result = includeArchived
    ? await db`
        SELECT * FROM characters
        WHERE user_id = ${userId}
        ORDER BY archived_at IS NULL DESC, id DESC
      `
    : await db`
        SELECT * FROM characters
        WHERE user_id = ${userId} AND archived_at IS NULL
        ORDER BY id DESC
      `

  return result.map(parseCharacter)
}

export async function findArchivedByUserId(db: SQL, userId: string): Promise<Character[]> {
  const result = await db`
    SELECT * FROM characters
    WHERE user_id = ${userId} AND archived_at IS NOT NULL
    ORDER BY archived_at DESC
  `

  return result.map(parseCharacter)
}

export async function countArchivedByUserId(db: SQL, userId: string): Promise<number> {
  const result = await db`
    SELECT COUNT(*) as count FROM characters
    WHERE user_id = ${userId} AND archived_at IS NOT NULL
  `

  return Number(result[0].count)
}

export async function nameExistsForUser(db: SQL, userId: string, name: string): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM characters
    WHERE user_id = ${userId} AND LOWER(name) = LOWER(${name}) AND archived_at IS NULL
    LIMIT 1
  `

  return result[0].count > 0
}

export async function archive(db: SQL, id: string): Promise<void> {
  await db`
    UPDATE characters
    SET archived_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
}

export async function unarchive(db: SQL, id: string): Promise<void> {
  await db`
    UPDATE characters
    SET archived_at = NULL
    WHERE id = ${id}
  `
}
