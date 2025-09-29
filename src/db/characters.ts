import { ulid } from "ulid";
import { db } from "../db";

export interface Character {
  id: string;
  user_id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  size: string;
  alignment?: string;
  created_at: string;
  updated_at: string;
}

export async function create(character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Promise<Character> {
  const id = ulid();

  const result = await db`
    INSERT INTO characters (id, user_id, name, race, class, background, size, alignment)
    VALUES (
      ${id},
      ${character.user_id},
      ${character.name},
      ${character.race},
      ${character.class},
      ${character.background},
      ${character.size},
      ${character.alignment}
    )
    RETURNING *
  `;

  return result[0] as Character;
}

export async function findById(id: string): Promise<Character | null> {
  const result = await db`
    SELECT * FROM characters
    WHERE id = ${id}
    LIMIT 1
  `;

  return result[0] as Character || null;
}

export async function findByUserId(userId: string): Promise<Character[]> {
  const result = await db`
    SELECT * FROM characters
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return result as Character[];
}
