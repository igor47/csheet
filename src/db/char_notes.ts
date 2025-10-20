import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const CharNoteSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  content: z.string(),
  is_backup: z.boolean(),
  restored_from_id: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharNoteSchema = CharNoteSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharNote = z.infer<typeof CharNoteSchema>
export type CreateCharNote = z.infer<typeof CreateCharNoteSchema>

export async function create(db: SQL, charNote: CreateCharNote): Promise<CharNote> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_notes (id, character_id, content, is_backup, restored_from_id, created_at)
    VALUES (
      ${id},
      ${charNote.character_id},
      ${charNote.content},
      ${charNote.is_backup},
      ${charNote.restored_from_id},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharNoteSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function getCurrent(db: SQL, characterId: string): Promise<CharNote | null> {
  const result = await db`
    SELECT * FROM char_notes
    WHERE character_id = ${characterId}
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (!result[0]) return null

  const row = result[0]
  return CharNoteSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharNote[]> {
  const result = await db`
    SELECT * FROM char_notes
    WHERE character_id = ${characterId}
    ORDER BY created_at DESC
  `

  return result.map((row: CharNote) =>
    CharNoteSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function findById(db: SQL, id: string): Promise<CharNote | null> {
  const result = await db`
    SELECT * FROM char_notes
    WHERE id = ${id}
    LIMIT 1
  `

  if (!result[0]) return null

  const row = result[0]
  return CharNoteSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function update(db: SQL, id: string, content: string): Promise<CharNote> {
  const result = await db`
    UPDATE char_notes
    SET content = ${content}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `

  const row = result[0]
  return CharNoteSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function markAsBackup(db: SQL, id: string): Promise<CharNote> {
  const result = await db`
    UPDATE char_notes
    SET is_backup = true
    WHERE id = ${id}
    RETURNING *
  `

  const row = result[0]
  return CharNoteSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}
