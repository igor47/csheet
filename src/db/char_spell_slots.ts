import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const SpellSlotActions = ["use", "restore"] as const
export const SpellSlotActionSchema = z.enum(SpellSlotActions)
export type SpellSlotAction = z.infer<typeof SpellSlotActionSchema>

export const SpellSlotLevel = z.number().int().min(1).max(9)
export type SpellSlotLevelType = z.infer<typeof SpellSlotLevel>

export const CharSpellSlotSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  slot_level: SpellSlotLevel,
  action: SpellSlotActionSchema,
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharSpellSlotSchema = CharSpellSlotSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharSpellSlot = z.infer<typeof CharSpellSlotSchema>
export type CreateCharSpellSlot = z.infer<typeof CreateCharSpellSlotSchema>

export async function create(db: SQL, charSpellSlot: CreateCharSpellSlot): Promise<CharSpellSlot> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_spell_slots (id, character_id, slot_level, action, note, created_at)
    VALUES (
      ${id},
      ${charSpellSlot.character_id},
      ${charSpellSlot.slot_level},
      ${charSpellSlot.action},
      ${charSpellSlot.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharSpellSlotSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharSpellSlot[]> {
  const result = await db`
    SELECT * FROM char_spell_slots
    WHERE character_id = ${characterId}
    ORDER BY id ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharSpellSlotSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_spell_slots
    WHERE id = ${id}
  `
}
