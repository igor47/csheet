import { ulid } from "ulid";
import { z } from "zod";
import type { SQL } from "bun";

import { BackgroundNamesSchema, RaceNamesSchema, SubraceNames } from "@src/lib/dnd"

export const CharacterSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(3),
  race: RaceNamesSchema,
  subrace: z.enum(SubraceNames).nullable().default(null),
  background: BackgroundNamesSchema,
  alignment: z.nullish(z.string()),
  ruleset: z.enum(["srd51", "srd52"]).default("srd51"),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateCharacterSchema = CharacterSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Character = z.infer<typeof CharacterSchema>;
export type CreateCharacter = z.infer<typeof CreateCharacterSchema>;

export async function create(db: SQL, character: CreateCharacter): Promise<Character> {
  const id = ulid();

  const result = await db`
    INSERT INTO characters (id, user_id, name, race, subrace, background, alignment, ruleset)
    VALUES (
      ${id},
      ${character.user_id},
      ${character.name},
      ${character.race},
      ${character.subrace},
      ${character.background},
      ${character.alignment},
      ${character.ruleset}
    )
    RETURNING *
  `;

  const row = result[0];
  return CharacterSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  });
}

export async function findById(db: SQL, id: string): Promise<Character | null> {
  const result = await db`
    SELECT * FROM characters
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!result[0]) return null;

  const row = result[0];
  return CharacterSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  });
}

export async function findByUserId(db: SQL, userId: string): Promise<Character[]> {
  const result = await db`
    SELECT * FROM characters
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return result.map((row: any) => CharacterSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  }));
}

export async function nameExistsForUser(db: SQL, userId: string, name: string): Promise<boolean> {
  const result = await db`
    SELECT COUNT(*) as count FROM characters
    WHERE user_id = ${userId} AND LOWER(name) = LOWER(${name})
    LIMIT 1
  `;

  return result[0].count > 0;
}
