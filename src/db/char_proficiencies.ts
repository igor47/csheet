import {
  ProficiencyActionSchema,
  type ProficiencyGrant,
  ProficiencyKindSchema,
  ProficiencySourceSchema,
} from "@src/lib/dnd/proficiencies"
import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

/**
 * A grant or removal of a proficiency; see the char_proficiencies migration
 */
export const CharProficiencySchema = z.object({
  id: z.string(),
  character_id: z.string(),
  kind: ProficiencyKindSchema,
  name: z.string(),
  action: ProficiencyActionSchema,
  source: ProficiencySourceSchema,
  source_detail: z.string().nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharProficiencySchema = CharProficiencySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharProficiency = z.infer<typeof CharProficiencySchema>
export type CreateCharProficiency = z.infer<typeof CreateCharProficiencySchema>

/** A proficiency the character has now, from their origin or classes or added by hand */
export type CurrentProficiency = ProficiencyGrant

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseRow(row: any): CharProficiency {
  return CharProficiencySchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, prof: CreateCharProficiency): Promise<CharProficiency> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_proficiencies
      (id, character_id, kind, name, action, source, source_detail, note, created_at)
    VALUES (
      ${id},
      ${prof.character_id},
      ${prof.kind},
      ${prof.name},
      ${prof.action},
      ${prof.source},
      ${prof.source_detail},
      ${prof.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseRow(result[0])
}

/**
 * All proficiency grants and removals for a character, oldest first
 */
export async function findByCharacterId(db: SQL, characterId: string): Promise<CharProficiency[]> {
  const result = await db`
    SELECT * FROM char_proficiencies
    WHERE character_id = ${characterId}
    ORDER BY id ASC
  `

  return result.map(parseRow)
}
