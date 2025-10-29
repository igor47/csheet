import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const CharCoinsSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  pp: z.number().int().min(0),
  gp: z.number().int().min(0),
  ep: z.number().int().min(0),
  sp: z.number().int().min(0),
  cp: z.number().int().min(0),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharCoinsSchema = CharCoinsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CharCoins = z.infer<typeof CharCoinsSchema>
export type CreateCharCoins = z.infer<typeof CreateCharCoinsSchema>

export async function create(db: SQL, charCoins: CreateCharCoins): Promise<CharCoins> {
  const id = ulid()

  const result = await db`
    INSERT INTO char_coins (id, character_id, pp, gp, ep, sp, cp, note, created_at)
    VALUES (
      ${id},
      ${charCoins.character_id},
      ${charCoins.pp},
      ${charCoins.gp},
      ${charCoins.ep},
      ${charCoins.sp},
      ${charCoins.cp},
      ${charCoins.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return CharCoinsSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharCoins[]> {
  const result = await db`
    SELECT * FROM char_coins
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) =>
    CharCoinsSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

export interface CurrentCoins {
  pp: number
  gp: number
  ep: number
  sp: number
  cp: number
}

export async function currentByCharacterId(
  db: SQL,
  characterId: string
): Promise<CurrentCoins | null> {
  const result = await db`
    SELECT pp, gp, ep, sp, cp
    FROM char_coins
    WHERE character_id = ${characterId}
    ORDER BY created_at DESC
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  return {
    pp: result[0].pp,
    gp: result[0].gp,
    ep: result[0].ep,
    sp: result[0].sp,
    cp: result[0].cp,
  }
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_coins
    WHERE id = ${id}
  `
}
