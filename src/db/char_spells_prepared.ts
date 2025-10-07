import { ulid } from "ulid";
import { z } from "zod";
import type { SQL } from "bun";

export const CharSpellPreparedSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  spell_id: z.string(),
  prepared_at: z.date(),
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateCharSpellPreparedSchema = CharSpellPreparedSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CharSpellPrepared = z.infer<typeof CharSpellPreparedSchema>;
export type CreateCharSpellPrepared = z.infer<typeof CreateCharSpellPreparedSchema>;

export async function create(db: SQL, spellPrepared: CreateCharSpellPrepared): Promise<CharSpellPrepared> {
  const id = ulid();

  const result = await db`
    INSERT INTO char_spells_prepared (id, character_id, spell_id, prepared_at, note, created_at)
    VALUES (
      ${id},
      ${spellPrepared.character_id},
      ${spellPrepared.spell_id},
      ${spellPrepared.prepared_at},
      ${spellPrepared.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  const row = result[0];
  return CharSpellPreparedSchema.parse({
    ...row,
    prepared_at: new Date(row.prepared_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  });
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharSpellPrepared[]> {
  const result = await db`
    SELECT * FROM char_spells_prepared
    WHERE character_id = ${characterId}
    ORDER BY prepared_at DESC, created_at ASC
  `;

  return result.map((row: any) => CharSpellPreparedSchema.parse({
    ...row,
    prepared_at: new Date(row.prepared_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

/**
 * Get currently prepared spells (latest prepared_at session)
 */
export async function getCurrentlyPrepared(db: SQL, characterId: string): Promise<CharSpellPrepared[]> {
  // First, get the latest prepared_at timestamp
  const latestResult = await db`
    SELECT MAX(prepared_at) as latest_prepared_at
    FROM char_spells_prepared
    WHERE character_id = ${characterId}
  `;

  const latestPreparedAt = latestResult[0]?.latest_prepared_at;
  if (!latestPreparedAt) {
    return [];
  }

  // Then get all spells from that session
  const result = await db`
    SELECT * FROM char_spells_prepared
    WHERE character_id = ${characterId} AND prepared_at = ${latestPreparedAt}
    ORDER BY created_at ASC
  `;

  return result.map((row: any) => CharSpellPreparedSchema.parse({
    ...row,
    prepared_at: new Date(row.prepared_at),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

/**
 * Clear all prepared spells for a character (for a new preparation session)
 */
export async function clearPrepared(db: SQL, characterId: string, beforeDate: Date): Promise<void> {
  await db`
    DELETE FROM char_spells_prepared
    WHERE character_id = ${characterId} AND prepared_at < ${beforeDate.toISOString()}
  `;
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_spells_prepared
    WHERE id = ${id}
  `;
}

export async function deleteBySpellId(db: SQL, characterId: string, spellId: string): Promise<void> {
  await db`
    DELETE FROM char_spells_prepared
    WHERE character_id = ${characterId} AND spell_id = ${spellId}
  `;
}
