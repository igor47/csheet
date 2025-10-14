import { db } from "@src/db"
import { create as createAbilityDb } from "@src/db/char_abilities"
import { create as createClassLevelDb } from "@src/db/char_levels"
import { create as createSkillDb } from "@src/db/char_skills"
import { type Character, create as createCharacterDb, nameExistsForUser } from "@src/db/characters"
import {
  Abilities,
  type AbilityType,
  BackgroundNames,
  Backgrounds,
  Classes,
  ClassNames,
  RaceNames,
  Races,
  Skills,
  type SkillType,
  SubclassNames,
  SubraceNames,
} from "@src/lib/dnd"
import { z } from "zod"

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
})

export type CreateCharacterApi = z.infer<typeof CreateCharacterApiSchema>

/**
 * Calculate initial ability scores based on race and subrace modifiers
 */
type AbilityScore = {
  score: number
  note: string
}

function calculateInitialAbilityScores(
  raceName: string,
  subraceName: string | null
): Record<AbilityType, AbilityScore> {
  const baseScore: AbilityScore = { score: 10, note: "Base score" }
  const scores: Record<AbilityType, AbilityScore> = {
    strength: { ...baseScore },
    dexterity: { ...baseScore },
    constitution: { ...baseScore },
    intelligence: { ...baseScore },
    wisdom: { ...baseScore },
    charisma: { ...baseScore },
  }

  // Find race
  const race = Races.find((r) => r.name === raceName)
  if (!race) return scores

  // Apply race modifiers
  if (race.ability_score_modifiers) {
    for (const [ability, modifier] of Object.entries(race.ability_score_modifiers)) {
      scores[ability as AbilityType] = {
        score: baseScore.score + modifier,
        note: `Base score for ${race.name}`,
      }
    }
  }

  // Apply subrace modifiers
  if (subraceName) {
    const subrace = race.subraces?.find((sr) => sr.name === subraceName)
    if (subrace?.ability_score_modifiers) {
      for (const [ability, modifier] of Object.entries(subrace.ability_score_modifiers)) {
        scores[ability as AbilityType] = {
          score: baseScore.score + modifier,
          note: `Base score for ${subrace.name}`,
        }
      }
    }
  }

  return scores
}

/**
 * Create a new character
 * Handles validation and business logic before persisting to the database
 */
export async function createCharacter(data: CreateCharacterApi): Promise<Character> {
  return db.begin(async (tx) => {
    const exists = await nameExistsForUser(tx, data.user_id, data.name)
    if (exists) {
      throw new Error("You already have a character with this name")
    }

    // Create the character in the database
    const character = await createCharacterDb(tx, {
      user_id: data.user_id,
      name: data.name,
      race: data.race,
      subrace: data.subrace,
      background: data.background,
      alignment: data.alignment,
    })

    // set initial level in the class
    // At first level, characters get the maximum value of their hit die
    const classDef = Classes[data.class]
    await createClassLevelDb(tx, {
      character_id: character.id,
      class: classDef.name,
      subclass: data.subclass,
      level: 1,
      hit_die_roll: classDef.hitDie,
      note: "Starting Level",
    })

    // populate initial ability scores with race/subrace modifiers
    const initialScores = calculateInitialAbilityScores(data.race, data.subrace)
    const promises = Object.entries(initialScores).map(([ability, score]) =>
      createAbilityDb(tx, {
        character_id: character.id,
        ability: ability as AbilityType,
        score: score.score,
        proficiency: false,
        note: score.note,
      })
    )
    const scores = await Promise.all(promises)

    // Get saving throw proficiencies from class
    const savingThrowProficiencies = new Set(classDef.savingThrows)
    for (const prof of savingThrowProficiencies) {
      const existing = scores.find((s) => s.ability === prof)!
      await createAbilityDb(tx, {
        character_id: character.id,
        ability: prof,
        score: existing.score,
        proficiency: true,
        note: `Proficiency from ${classDef.name}`,
      })
    }

    // Get skill proficiencies from background
    const background = Backgrounds[data.background]
    const backgroundSkillProficiencies = new Set<SkillType>()

    if (background) {
      for (const skill of background.skillProficiencies) {
        // Only handle fixed skills (not Choice objects)
        if (typeof skill === "string") {
          backgroundSkillProficiencies.add(skill as SkillType)
        }
      }
    }

    // Only create skill entries for proficient skills
    for (const skill of backgroundSkillProficiencies) {
      await createSkillDb(tx, {
        character_id: character.id,
        skill,
        proficiency: "proficient",
        note: `Proficiency as ${background!.name}`,
      })
    }

    return character
  })
}
