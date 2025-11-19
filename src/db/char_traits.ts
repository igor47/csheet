import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const TraitSources = [
  "species",
  "lineage",
  "background",
  "class",
  "subclass",
  "custom",
] as const
export const TraitSourceSchema = z.enum(TraitSources)
export type TraitSource = z.infer<typeof TraitSourceSchema>

export const CharTraitSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  name: z.string(),
  description: z.string(),
  source: TraitSourceSchema,
  source_detail: z.string().nullable().default(null),
  level: z.number().int().nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharTraitSchema = CharTraitSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharTrait = z.infer<typeof CharTraitSchema>
export type CreateCharTrait = z.infer<typeof CreateCharTraitSchema>

export async function create(db: SQL, trait: CreateCharTrait): Promise<CharTrait> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_traits (id, character_id, name, description, source, source_detail, level, note, created_at)
    VALUES (
      ${id},
      ${trait.character_id},
      ${trait.name},
      ${trait.description},
      ${trait.source},
      ${trait.source_detail},
      ${trait.level},
      ${trait.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharTraitSchema.parse({
    ...row,
    level: row.level !== null ? Number(row.level) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharTrait[]> {
  const result = await db`
    SELECT * FROM char_traits
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharTraitSchema.parse({
      ...row,
      level: row.level !== null ? Number(row.level) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}
