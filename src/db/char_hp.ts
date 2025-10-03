import { ulid } from "ulid";
import { z } from "zod";
import type { SQL } from "bun";

export const CharHPSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  delta: z.number().int(),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateCharHPSchema = CharHPSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CharHP = z.infer<typeof CharHPSchema>;
export type CreateCharHP = z.infer<typeof CreateCharHPSchema>;

export async function create(db: SQL, charHP: CreateCharHP): Promise<CharHP> {
  const id = ulid();

  const result = await db`
    INSERT INTO char_hp (id, character_id, delta, note, created_at)
    VALUES (
      ${id},
      ${charHP.character_id},
      ${charHP.delta},
      ${charHP.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  const row = result[0];
  return CharHPSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  });
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharHP[]> {
  const result = await db`
    SELECT * FROM char_hp
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `;

  return result.map((row: any) => CharHPSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

export async function getHpDelta(db: SQL, characterId: string): Promise<number> {
  const result = await db`
    SELECT COALESCE(SUM(delta), 0) as total
    FROM char_hp
    WHERE character_id = ${characterId}
  `;

  return result[0].total;
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_hp
    WHERE id = ${id}
  `;
}
