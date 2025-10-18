import { create as createAbilityDb } from "@src/db/char_abilities"
import { create as createClassLevelDb } from "@src/db/char_levels"
import { create as createSkillDb } from "@src/db/char_skills"
import { create as createTraitDb } from "@src/db/char_traits"
import { type Character, create as createCharacterDb, nameExistsForUser } from "@src/db/characters"
import type { User } from "@src/db/users"
import {
  type AbilityType,
  ClassNamesSchema,
  type ClassNameType,
  getRuleset,
  getTraits,
  type Ruleset,
  type SkillType,
} from "@src/lib/dnd"
import { RULESETS, type RulesetId, RulesetIdSchema } from "@src/lib/dnd/rulesets"
import { OptionalNullStringSchema } from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"

/**
 * Generic Create Character API Schema that works across all rulesets
 * Ruleset-specific validation happens in the service logic
 * Note: user_id is passed separately via User object, not in form data
 */
export const CreateCharacterApiSchema = z.object({
  name: z.string().min(3, "Pick a better character name!").max(50, "That name is too long!"),
  species: z.string(),
  lineage: OptionalNullStringSchema,
  class: ClassNamesSchema,
  subclass: OptionalNullStringSchema,
  background: z.string(),
  alignment: OptionalNullStringSchema,
  ruleset: RulesetIdSchema,
})

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
  user: User,
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
  } else {
    const exists = await nameExistsForUser(db, user.id, data.name)
    if (exists) {
      errors.name = "You already have a character with this name"
    }
  }

  // Validate species exists in ruleset
  if (data.species && !ruleset.species.find((s) => s.name === data.species)) {
    errors.species = "Invalid species for this ruleset"
  }

  // Validate lineage for selected species
  if (data.species) {
    const species = ruleset.species.find((s) => s.name === data.species)
    if (species) {
      // If species has lineages, one must be selected
      if (species.lineages && species.lineages.length > 0 && !data.lineage) {
        errors.lineage = "Lineage is required for this species"
      }
      // Validate lineage if provided
      if (data.lineage && !species.lineages?.find((l) => l.name === data.lineage)) {
        errors.lineage = "Invalid lineage for this species"
      }
    }
  }

  // Validate background exists in ruleset
  if (data.background && !ruleset.backgrounds[data.background]) {
    errors.background = "Invalid background for this ruleset"
  }

  // Validate subclass
  if (data.class) {
    const classDef = ruleset.classes[data.class as ClassNameType]
    if (classDef) {
      // Check if subclass is required at level 1
      if (classDef.subclassLevel === 1 && !data.subclass) {
        errors.subclass = "Subclass is required for this class at level 1"
      }
      // Check if subclass is provided but not available until later
      if (data.subclass && classDef.subclassLevel !== 1) {
        errors.subclass = `Subclass not available until level ${classDef.subclassLevel}`
      }
      // Validate subclass name if provided and allowed
      if (
        data.subclass &&
        classDef.subclassLevel === 1 &&
        !classDef.subclasses.find((sc) => sc.name === data.subclass)
      ) {
        errors.subclass = "Invalid subclass for this class"
      }
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values, errors }
  }

  // Full validation with Zod
  const result = CreateCharacterApiSchema.safeParse(data)

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
      user_id: user.id,
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

    // Add traits from species/lineage (only non-level traits at character creation)
    const speciesTraits = getTraits(ruleset, {
      species: validated.species,
      lineage: validated.lineage,
    })
    for (const trait of speciesTraits) {
      if (!trait.level) {
        const sourceDetail = validated.lineage || validated.species
        await createTraitDb(tx, {
          character_id: character.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: sourceDetail,
          level: null,
          note: null,
        })
      }
    }

    // Add traits from background (only non-level traits at character creation)
    const backgroundTraits = getTraits(ruleset, { background: validated.background })
    for (const trait of backgroundTraits) {
      if (!trait.level) {
        await createTraitDb(tx, {
          character_id: character.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: validated.background,
          level: null,
          note: null,
        })
      }
    }

    return character
  })

  return { complete: true, character }
}
