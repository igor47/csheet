import { db } from "@src/db"
import { create as createAbilityDb } from "@src/db/char_abilities"
import { create as createClassLevelDb } from "@src/db/char_levels"
import { create as createSkillDb } from "@src/db/char_skills"
import { type Character, create as createCharacterDb, nameExistsForUser } from "@src/db/characters"
import {
  type AbilityType,
  ClassNames,
  getRuleset,
  type Ruleset,
  type SkillType,
} from "@src/lib/dnd"
import { z } from "zod"

/**
 * Create API Schema for creating a new character based on a ruleset
 * This is separate from the DB schema to allow for different validation rules
 * and to include fields that may not be stored directly (like class)
 */
export function createCharacterApiSchema(ruleset: Ruleset) {
  const speciesNames = ruleset.species.map((s) => s.name) as [string, ...string[]]
  const backgroundNames = Object.keys(ruleset.backgrounds) as [string, ...string[]]

  // Get all lineage names across all species
  const allLineageNames = ruleset.species.flatMap((s) => (s.lineages || []).map((l) => l.name)) as [
    string,
    ...string[],
  ]

  // Get all subclass names
  const allSubclassNames = ruleset.listSubclasses() as [string, ...string[]]

  return z.object({
    user_id: z.string(),
    name: z.string().min(3, "Pick a better character name!").max(50, "That name is too long!"),
    race: z.enum(speciesNames, "Pick a valid species!"),
    subrace:
      allLineageNames.length > 0
        ? z.enum(allLineageNames, "Pick a valid lineage!").nullable().default(null)
        : z.string().nullable().default(null),
    class: z.enum(ClassNames, "Pick a valid class!"),
    subclass:
      allSubclassNames.length > 0
        ? z.enum(allSubclassNames, "Pick a valid subclass!").nullable().default(null)
        : z.string().nullable().default(null),
    background: z.enum(backgroundNames, "Pick a valid background!"),
    alignment: z.nullable(z.string().optional()),
    ruleset: z.enum(["srd51", "srd52"]).default("srd51"),
  })
}

export type CreateCharacterApi = {
  user_id: string
  name: string
  race: string
  subrace: string | null
  class: (typeof ClassNames)[number]
  subclass: string | null
  background: string
  alignment?: string | null
  ruleset: "srd51" | "srd52"
}

/**
 * Calculate initial ability scores based on race and subrace modifiers
 */
type AbilityScore = {
  score: number
  note: string
}

function calculateInitialAbilityScores(
  ruleset: Ruleset,
  speciesName: string,
  lineageName: string | null
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

  // Find species
  const species = ruleset.species.find((s) => s.name === speciesName)
  if (!species) return scores

  // Apply species modifiers
  if (species.abilityScoreModifiers) {
    for (const [ability, modifier] of Object.entries(species.abilityScoreModifiers)) {
      scores[ability as AbilityType] = {
        score: baseScore.score + modifier,
        note: `Base score for ${species.name}`,
      }
    }
  }

  // Apply lineage modifiers
  if (lineageName) {
    const lineage = species.lineages?.find((l) => l.name === lineageName)
    if (lineage?.abilityScoreModifiers) {
      for (const [ability, modifier] of Object.entries(lineage.abilityScoreModifiers)) {
        scores[ability as AbilityType] = {
          score: baseScore.score + modifier,
          note: `Base score for ${lineage.name}`,
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
  // Get the ruleset for validation and data lookup
  const ruleset = getRuleset(data.ruleset)

  // Validate data against ruleset schema
  const schema = createCharacterApiSchema(ruleset)
  const validated = schema.parse(data)

  return db.begin(async (tx) => {
    const exists = await nameExistsForUser(tx, validated.user_id, validated.name)
    if (exists) {
      throw new Error("You already have a character with this name")
    }

    // Create the character in the database
    const character = await createCharacterDb(tx, {
      user_id: validated.user_id,
      name: validated.name,
      race: validated.race,
      subrace: validated.subrace,
      background: validated.background,
      ruleset: validated.ruleset,
      alignment: validated.alignment,
    })

    // set initial level in the class
    // At first level, characters get the maximum value of their hit die
    const classDef = ruleset.classes[validated.class]
    await createClassLevelDb(tx, {
      character_id: character.id,
      class: classDef.name,
      subclass: validated.subclass,
      level: 1,
      hit_die_roll: classDef.hitDie,
      note: "Starting Level",
    })

    // populate initial ability scores with species/lineage modifiers
    const initialScores = calculateInitialAbilityScores(ruleset, validated.race, validated.subrace)
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
    const background = ruleset.backgrounds[validated.background]
    const backgroundSkillProficiencies = new Set<SkillType>()

    if (background?.skillProficiencies) {
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
        note: `Proficiency as ${background?.name}`,
      })
    }

    return character
  })
}
