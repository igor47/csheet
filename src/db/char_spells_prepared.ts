import { ulid } from "ulid";
import { z } from "zod";
import type { SQL } from "bun";
import { ClassNamesSchema } from "@src/lib/dnd";

export const SpellPrepareActions = ["prepare", "unprepare"] as const;
export const SpellPrepareActionSchema = z.enum(SpellPrepareActions);
export type SpellPrepareAction = z.infer<typeof SpellPrepareActionSchema>;

// Event-sourced prepare/unprepare actions for all non-wizard casters
export const CharSpellPreparedSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  class: ClassNamesSchema,
  spell_id: z.string(),
  action: SpellPrepareActionSchema,
  always_prepared: z.boolean().default(false),
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
    INSERT INTO char_spells_prepared (id, character_id, class, spell_id, action, always_prepared, note, created_at)
    VALUES (
      ${id},
      ${spellPrepared.character_id},
      ${spellPrepared.class},
      ${spellPrepared.spell_id},
      ${spellPrepared.action},
      ${spellPrepared.always_prepared},
      ${spellPrepared.note},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `;

  const row = result[0];
  return CharSpellPreparedSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  });
}

export async function findByCharacterId(db: SQL, characterId: string): Promise<CharSpellPrepared[]> {
  const result = await db`
    SELECT * FROM char_spells_prepared
    WHERE character_id = ${characterId}
    ORDER BY created_at ASC
  `;

  return result.map((row: any) => CharSpellPreparedSchema.parse({
    ...row,
    always_prepared: Boolean(row.always_prepared),
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

/**
 * Get currently prepared spells for all classes using event-sourcing
 * Process all prepare/unprepare events and return spells with net positive count
 * OR spells marked as always_prepared
 * Groups by class+spell to handle multiclassing correctly
 */
export async function getCurrentlyPrepared(db: SQL, characterId: string): Promise<CharSpellPrepared[]> {
  const allEvents = await findByCharacterId(db, characterId);

  // Track counts per class+spell combination
  const classSpellCounts = new Map<string, number>(); // key: "class:spell_id"
  const classSpellInfo = new Map<string, { alwaysPrepared: boolean; lastEvent: CharSpellPrepared }>();

  for (const event of allEvents) {
    const key = `${event.class}:${event.spell_id}`;
    const current = classSpellCounts.get(key) || 0;
    classSpellCounts.set(
      key,
      event.action === 'prepare' ? current + 1 : current - 1
    );

    classSpellInfo.set(key, {
      alwaysPrepared: event.always_prepared,
      lastEvent: event,
    });
  }

  // Return spells that are currently prepared (positive count OR always_prepared)
  const prepared: CharSpellPrepared[] = [];
  for (const [key, info] of classSpellInfo.entries()) {
    const count = classSpellCounts.get(key) || 0;
    if (count > 0 || info.alwaysPrepared) {
      prepared.push(info.lastEvent);
    }
  }

  return prepared;
}
