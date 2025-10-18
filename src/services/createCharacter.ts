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
import { RULESETS, type RulesetId, RulesetIdSchema } from "@src/lib/dnd/rulesets"
import type { SQL } from "bun"
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
    species: z.enum(speciesNames, "Pick a valid species!"),
    lineage:
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
    ruleset: RulesetIdSchema,
  })
}

export type CreateCharacterResult =
  | { complete: true; character: Character }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Calculate initial ability scores based on spiecies and lineage modifiers
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
export async function createCharacter(
  db: SQL,
  data: Record<string, string>
): Promise<CreateCharacterResult> {
  const errors: Record<string, string> = {}
  const values = data
  const isCheck = data.is_check === "true"

  // Get the ruleset for validation and data lookup
  const rulesetId = (data.ruleset as RulesetId) || RULESETS[0]!.id
  const ruleset = getRuleset(rulesetId)

  // Soft validation for is_check
  if (!data.name) {
    if (!isCheck) {
      errors.name = "Character name is required"
    }
  } else if (data.name.trim().length === 0) {
    errors.name = "Character name is required"
  } else if (data.name.length < 3) {
    errors.name = "Character name must be at least 3 characters"
  } else if (data.name.length > 50) {
    errors.name = "Character name must be less than 50 characters"
  } else if (data.user_id) {
    const exists = await nameExistsForUser(db, data.user_id, data.name)
    if (exists) {
      errors.name = "You already have a character with this name"
    }
  }

  // Validate species exists in ruleset
  if (data.species && !ruleset.species.find((s) => s.name === data.species)) {
    errors.species = "Invalid species for this ruleset"
  }

  // Validate lineage exists for selected species
  if (data.lineage && data.species) {
    const species = ruleset.species.find((s) => s.name === data.species)
    if (species && !species.lineages?.find((l) => l.name === data.lineage)) {
      errors.lineage = "Invalid lineage for this species"
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values, errors }
  }

  // Full validation with Zod
  const schema = createCharacterApiSchema(ruleset)
  const result = schema.safeParse(data)

  if (!result.success) {
    const zodErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      zodErrors[field] = issue.message
    }
    return { complete: false, values, errors: zodErrors }
  }

  const validated = result.data

  const character = await db.begin(async (tx) => {
    // Create the character in the database
    const character = await createCharacterDb(tx, {
      user_id: validated.user_id,
      name: validated.name,
      species: validated.species,
      lineage: validated.lineage,
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
    const initialScores = calculateInitialAbilityScores(
      ruleset,
      validated.species,
      validated.lineage
    )
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

  return { complete: true, character }
}
