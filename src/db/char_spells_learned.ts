import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

// Wizard spellbook: purely additive (wizards never forget spells)
export const CharSpellLearnedSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  spell_id: z.string(),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharSpellLearnedSchema = CharSpellLearnedSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharSpellLearned = z.infer<typeof CharSpellLearnedSchema>
export type CreateCharSpellLearned = z.infer<typeof CreateCharSpellLearnedSchema>

export async function create(
  db: SQL,
  spellLearned: CreateCharSpellLearned
): Promise<CharSpellLearned> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_spells_learned (id, character_id, spell_id, note, created_at)
    VALUES (
      ${id},
      ${spellLearned.character_id},
      ${spellLearned.spell_id},
      ${spellLearned.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharSpellLearnedSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharSpellLearned[]> {
  const result = await db`
    SELECT * FROM char_spells_learned
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharSpellLearnedSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function isSpellLearned(
  db: SQL,
  characterId: string,
  spellId: string
): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM char_spells_learned
    WHERE character_id = ${characterId} AND spell_id = ${spellId}
    LIMIT 1
  `

  return result[0].count > 0
}

export async function getCurrentLearnedSpells(db: SQL, characterId: string): Promise<string[]> {
  const spells = await findByCharacterId(db, characterId)
  return spells.map((s) => s.spell_id)
}
