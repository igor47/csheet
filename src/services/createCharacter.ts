import { z } from "zod";
import { RaceNames, SubraceNames, ClassNames, BackgroundNames, SubclassNames, Abilities, Races, type AbilityType } from "@src/lib/dnd";
import { create as createCharacterDb, nameExistsForUser, type Character } from "@src/db/characters";
import { create as createClassLevelDb } from "@src/db/char_levels";
import { create as createAbilityDb } from "@src/db/char_abilities";
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
 * Calculate initial ability scores based on race and subrace modifiers
 */
function calculateInitialAbilityScores(raceName: string, subraceName: string | null): Record<AbilityType, number> {
  const baseScore = 10;
  const scores: Record<AbilityType, number> = {
    strength: baseScore,
    dexterity: baseScore,
    constitution: baseScore,
    intelligence: baseScore,
    wisdom: baseScore,
    charisma: baseScore,
  };

  // Find race
  const race = Races.find(r => r.name === raceName);
  if (!race) return scores;

  // Apply race modifiers
  if (race.ability_score_modifiers) {
    for (const [ability, modifier] of Object.entries(race.ability_score_modifiers)) {
      scores[ability as AbilityType] += modifier;
    }
  }

  // Apply subrace modifiers
  if (subraceName) {
    const subrace = race.subraces?.find(sr => sr.name === subraceName);
    if (subrace?.ability_score_modifiers) {
      for (const [ability, modifier] of Object.entries(subrace.ability_score_modifiers)) {
        scores[ability as AbilityType] += modifier;
      }
    }
  }

  return scores;
}

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

    // populate initial ability scores with race/subrace modifiers
    const initialScores = calculateInitialAbilityScores(data.race, data.subrace);
    for (const ability of Abilities) {
      await createAbilityDb(tx, {
        character_id: character.id,
        ability,
        score: initialScores[ability],
        note: "Initial score",
      });
    }

    return character;
  });
}
