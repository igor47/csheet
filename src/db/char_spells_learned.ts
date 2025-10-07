import { ulid } from "ulid";
import { z } from "zod";
import type { SQL } from "bun";

export const SpellLearnActions = ["learn", "forget"] as const;
export const SpellLearnActionSchema = z.enum(SpellLearnActions);
export type SpellLearnAction = z.infer<typeof SpellLearnActionSchema>;

export const CharSpellLearnedSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  spell_id: z.string(),
  action: SpellLearnActionSchema,
  note: z.string().nullable().default(null),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateCharSpellLearnedSchema = CharSpellLearnedSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CharSpellLearned = z.infer<typeof CharSpellLearnedSchema>;
export type CreateCharSpellLearned = z.infer<typeof CreateCharSpellLearnedSchema>;

export async function create(db: SQL, spellLearned: CreateCharSpellLearned): Promise<CharSpellLearned> {
  const id = ulid();

  const result = await db`
    INSERT INTO char_spells_learned (id, character_id, spell_id, action, note, created_at)
    VALUES (
      ${id},
      ${spellLearned.character_id},
      ${spellLearned.spell_id},
      ${spellLearned.action},
      ${spellLearned.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  const row = result[0];
  return CharSpellLearnedSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  });
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharSpellLearned[]> {
  const result = await db`
    SELECT * FROM char_spells_learned
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `;

  return result.map((row: any) => CharSpellLearnedSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

export async function isSpellLearned(db: SQL, characterId: string, spellId: string): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM char_spells_learned
    WHERE character_id = ${characterId} AND spell_id = ${spellId}
    LIMIT 1
  `;

  return result[0].count > 0;
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM char_spells_learned
    WHERE id = ${id}
  `;
}

export async function deleteBySpellId(db: SQL, characterId: string, spellId: string): Promise<void> {
  await db`
    DELETE FROM char_spells_learned
    WHERE character_id = ${characterId} AND spell_id = ${spellId}
  `;
}

export async function getCurrentLearnedSpells(db: SQL, characterId: string): Promise<string[]> {
  const allEvents = await findByCharacterId(db, characterId);
  const spellCounts = new Map<string, number>();

  for (const event of allEvents) {
    const current = spellCounts.get(event.spell_id) || 0;
    spellCounts.set(event.spell_id, event.action === 'learn' ? current + 1 : current - 1);
  }

  return Array.from(spellCounts.entries())
    .filter(([_, count]) => count > 0)
    .map(([spellId, _]) => spellId);
}
