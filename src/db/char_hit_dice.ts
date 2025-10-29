import type { HitDieType } from "@src/lib/dnd"
import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const HitDiceActions = ["use", "restore"] as const
export const HitDiceActionSchema = z.enum(HitDiceActions)
export type HitDiceAction = z.infer<typeof HitDiceActionSchema>

export const CharHitDiceSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  die_value: z
    .number()
    .int()
    .refine((val): val is HitDieType => [6, 8, 10, 12].includes(val)),
  action: HitDiceActionSchema,
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharHitDiceSchema = CharHitDiceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharHitDice = z.infer<typeof CharHitDiceSchema>
export type CreateCharHitDice = z.infer<typeof CreateCharHitDiceSchema>

export async function create(db: SQL, charHitDice: CreateCharHitDice): Promise<CharHitDice> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_hit_dice (id, character_id, die_value, action, note, created_at)
    VALUES (
      ${id},
      ${charHitDice.character_id},
      ${charHitDice.die_value},
      ${charHitDice.action},
      ${charHitDice.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharHitDiceSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharHitDice[]> {
  const result = await db`
    SELECT * FROM char_hit_dice
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharHitDiceSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_hit_dice
    WHERE id = ${id}
  `
}
