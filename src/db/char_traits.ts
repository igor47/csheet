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

export async function findById(db: SQL, id: string): Promise<CharTrait | null> {
  const result = await db`
    SELECT * FROM char_traits
    WHERE id = ${id}
  `

  if (result.length === 0) {
    return null
  }

  const row = result[0]
  return CharTraitSchema.parse({
    ...row,
    level: row.level !== null ? Number(row.level) : null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export const UpdateCharTraitSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  note: z.string().nullable().optional(),
})

export type UpdateCharTrait = z.infer<typeof UpdateCharTraitSchema>

export async function update(db: SQL, id: string, updates: UpdateCharTrait): Promise<CharTrait> {
  const result = await db`
    UPDATE char_traits
    SET
      name = COALESCE(${updates.name ?? null}, name),
      description = COALESCE(${updates.description ?? null}, description),
      note = ${updates.note !== undefined ? updates.note : null},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
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

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_traits
    WHERE id = ${id}
  `
}
