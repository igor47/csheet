import { z } from "zod";
import { RaceNames, SubraceNames, ClassNames, BackgroundNames, SubclassNames } from "@src/lib/dnd";
import { create as createCharacterDb, nameExistsForUser, type Character } from "@src/db/characters";
import { create as createClassLevelDb } from "@src/db/char_levels";
import { db } from "@src/db";

/**
 * API Schema for creating a new character
 * This is separate from the DB schema to allow for different validation rules
 * and to include fields that may not be stored directly (like class)
 */
export const CreateCharacterApiSchema = z.object({
  user_id: z.string(),
  name: z.string().min(3, "Pick a better character name!").max(50, "That name is too long!"),
  race: z.enum(RaceNames, "Pick a valid race!"),
  subrace: z.enum(SubraceNames, "Pick a valid subrace!").nullable().default(null),
  class: z.enum(ClassNames, "Pick a valid class!"),
  subclass: z.enum(SubclassNames, "Pick a valid subclass!").nullable().default(null),
  background: z.enum(BackgroundNames, "Pick a valid background!"),
  alignment: z.nullable(z.string().optional()),
});

export type CreateCharacterApi = z.infer<typeof CreateCharacterApiSchema>;

/**
 * Create a new character
 * Handles validation and business logic before persisting to the database
 */
export async function createCharacter(data: CreateCharacterApi): Promise<Character> {
  return db.begin(async (tx) => {
    const exists = await nameExistsForUser(tx, data.user_id, data.name);
    if (exists) {
      throw new Error("You already have a character with this name");
    }

    // Create the character in the database
    const character = await createCharacterDb(tx, {
      user_id: data.user_id,
      name: data.name,
      race: data.race,
      subrace: data.subrace,
      background: data.background,
      alignment: data.alignment,
    });

    // set initial level in the class
    const level = await createClassLevelDb(tx, {
      character_id: character.id,
      class: data.class,
      subclass: data.subclass,
      level: 1,
      note: "Starting Level",
    })

    return character;
  });
}
