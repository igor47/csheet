import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const ShortRestDetailsSchema = z.object({
  diceRolls: z.array(
    z.object({
      die: z.number(),
      roll: z.number(),
      modifier: z.number(),
    })
  ),
  arcaneRecoveryUsed: z.boolean(),
})

export const LongRestDetailsSchema = z.null()

export const RestDetailsSchema = z.union([ShortRestDetailsSchema, LongRestDetailsSchema])

export const CharRestSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  rest_type: z.enum(["short", "long"]),
  hp_restored: z.number(),
  hit_dice_spent: z.number(),
  hit_dice_restored: z.number(),
  spell_slots_restored: z.number(),
  details: RestDetailsSchema.nullable().default(null),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharRestSchema = CharRestSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type ShortRestDetails = z.infer<typeof ShortRestDetailsSchema>
export type CharRest = z.infer<typeof CharRestSchema>
export type CreateCharRest = z.infer<typeof CreateCharRestSchema>

// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseRestRow(row: any): CharRest {
  return CharRestSchema.parse({
    ...row,
    details: row.details ?? null,
    note: row.note ?? null,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function create(db: SQL, rest: CreateCharRest): Promise<CharRest> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_rests (
      id,
      character_id,
      rest_type,
      hp_restored,
      hit_dice_spent,
      hit_dice_restored,
      spell_slots_restored,
      details,
      note
    )
    VALUES (
      ${id},
      ${rest.character_id},
      ${rest.rest_type},
      ${rest.hp_restored},
      ${rest.hit_dice_spent},
      ${rest.hit_dice_restored},
      ${rest.spell_slots_restored},
      ${rest.details},
      ${rest.note}
    )
    RETURNING *
  `

  return parseRestRow(result[0])
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharRest[]> {
  const result = await db`
    SELECT * FROM char_rests
    WHERE character_id = ${characterId}
    ORDER BY created_at DESC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) => parseRestRow(row))
}

export async function findRecentByCharacterId(
  db: SQL,
  characterId: string,
  limit = 10
): Promise<CharRest[]> {
  const result = await db`
    SELECT * FROM char_rests
    WHERE character_id = ${characterId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) => parseRestRow(row))
}
