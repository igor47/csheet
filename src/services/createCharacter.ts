import { beginOrSavepoint } from "@src/db"
import {
  create as createAbilityDb,
  findByCharacterId as findAbilities,
} from "@src/db/char_abilities"
import { create as createSkillDb } from "@src/db/char_skills"
import { type Character, create as createCharacterDb, nameExistsForUser } from "@src/db/characters"
import type { User } from "@src/db/users"
import {
  Abilities,
  type AbilityType,
  ClassNamesSchema,
  type ClassNameType,
  getRuleset,
  POINT_BUY_COSTS,
  type Ruleset,
  type SkillType,
} from "@src/lib/dnd"
import { RULESETS, type RulesetId, RulesetIdSchema } from "@src/lib/dnd/rulesets"
import { Checkbox, NumberField, NumericEnumField, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"
import { addLevel } from "./addLevel"

/**
 * Base Character Schema - common fields for all characters
 */
const BaseCharacterSchema = z.object({
  name: z.string().min(3, "Pick a better character name!").max(50, "That name is too long!"),
  species: z.string(),
  lineage: OptionalString(),
  class: ClassNamesSchema,
  subclass: OptionalString(),
  background: z.string(),
  alignment: OptionalString(),
  ruleset: RulesetIdSchema,
  is_check: Checkbox().optional().default(false),
})

/**
 * Ability Scores Schema - base ability scores selected by player
 */
const AbilityScoreField = NumberField(
  z
    .number({
      error: (iss) => (iss === undefined ? "Ability score is required" : "Must be a number"),
    })
    .int({ message: "Must be a whole number" })
    .min(3, { message: "Must be at least 3" })
    .max(20, { message: "Cannot exceed 20" })
)

const BaseAbilityScoresSchema = z.object({
  ability_method: z.enum(["standard-array", "point-buy", "random"]),
  ability_str: AbilityScoreField,
  ability_dex: AbilityScoreField,
  ability_con: AbilityScoreField,
  ability_int: AbilityScoreField,
  ability_wis: AbilityScoreField,
  ability_cha: AbilityScoreField,
})

/**
 * Method-specific schemas (discriminated union based on ability_method)
 */
const AbilityScoreMethodSchemas = z.discriminatedUnion("ability_method", [
  z.object({ ability_method: z.literal("standard-array") }),
  z.object({ ability_method: z.literal("point-buy") }),
  z.object({ ability_method: z.literal("random") }),
])

/**
 * 2024 Background Ability Score Bonuses
 * Player chooses how to distribute 3 points across 3 abilities
 */
const AbilityBonusField = NumericEnumField(z.union([z.literal(0), z.literal(1), z.literal(2)]))
  .optional()
  .default(0)

const Background2024Schema = z.object({
  background_ability_str_bonus: AbilityBonusField,
  background_ability_dex_bonus: AbilityBonusField,
  background_ability_con_bonus: AbilityBonusField,
  background_ability_int_bonus: AbilityBonusField,
  background_ability_wis_bonus: AbilityBonusField,
  background_ability_cha_bonus: AbilityBonusField,
})

/**
 * Class Skill Proficiency Selections
 * Each skill that can be selected from class has a corresponding field
 */
const ClassSkillProficiencySchema = z.object({
  class_proficiency_acrobatics: Checkbox().optional(),
  class_proficiency_animal_handling: Checkbox().optional(),
  class_proficiency_arcana: Checkbox().optional(),
  class_proficiency_athletics: Checkbox().optional(),
  class_proficiency_deception: Checkbox().optional(),
  class_proficiency_history: Checkbox().optional(),
  class_proficiency_insight: Checkbox().optional(),
  class_proficiency_intimidation: Checkbox().optional(),
  class_proficiency_investigation: Checkbox().optional(),
  class_proficiency_medicine: Checkbox().optional(),
  class_proficiency_nature: Checkbox().optional(),
  class_proficiency_perception: Checkbox().optional(),
  class_proficiency_performance: Checkbox().optional(),
  class_proficiency_persuasion: Checkbox().optional(),
  class_proficiency_religion: Checkbox().optional(),
  class_proficiency_sleight_of_hand: Checkbox().optional(),
  class_proficiency_stealth: Checkbox().optional(),
  class_proficiency_survival: Checkbox().optional(),
})

/**
 * Combined Create Character API Schema
 */
export const CreateCharacterApiSchema = BaseCharacterSchema.and(BaseAbilityScoresSchema)
  .and(AbilityScoreMethodSchemas)
  .and(Background2024Schema)
  .and(ClassSkillProficiencySchema)

export type CreateCharacterResult =
  | { complete: true; character: Character }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Validate standard array: must be exactly [15, 14, 13, 12, 10, 8] in any order
 */
function validateStandardArray(scores: number[]): boolean {
  const expected = [15, 14, 13, 12, 10, 8].sort()
  const actual = [...scores].sort()
  return JSON.stringify(expected) === JSON.stringify(actual)
}

/**
 * Validate point buy: scores must be 8-15 and cost exactly 27 points
 */
function validatePointBuy(scores: number[]): { valid: boolean; cost: number; error?: string } {
  // Check range
  if (scores.some((s) => s < 8 || s > 15)) {
    return { valid: false, cost: 0, error: "Point buy scores must be 8-15" }
  }

  // Calculate cost
  const cost = scores.reduce((sum, s) => sum + (POINT_BUY_COSTS[s] || 0), 0)

  if (cost !== 27) {
    return { valid: false, cost, error: `Point buy must spend exactly 27 points (spent ${cost})` }
  }

  return { valid: true, cost: 27 }
}

/**
 * Validate final scores after modifiers: must be ≤ 20
 */
function validateFinalScores(
  baseScores: Record<AbilityType, number>,
  modifiers: Record<AbilityType, number>
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const ability of Abilities) {
    const base = baseScores[ability]
    const modifier = modifiers[ability] || 0
    const final = base + modifier

    if (final > 20) {
      errors[`ability_${ability.substring(0, 3)}`] =
        `Final score (${base} + ${modifier}) exceeds maximum of 20`
    }
  }

  return errors
}

/**
 * Calculate ability score modifiers from species/background
 * Does NOT mutate base scores - returns modifiers separately
 */
function calculateModifiers(
  ruleset: Ruleset,
  rulesetId: RulesetId,
  data: Record<string, string | number | null | boolean>
): Record<AbilityType, number> {
  const modifiers: Record<AbilityType, number> = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  }

  if (rulesetId === "srd51") {
    // 2014 rules: Apply species and lineage modifiers
    const species = ruleset.species.find((s) => s.name === data.species)
    if (species) {
      // Apply species modifiers
      if (species.abilityScoreModifiers) {
        for (const [ability, modifier] of Object.entries(species.abilityScoreModifiers)) {
          const abilityType = ability as AbilityType
          modifiers[abilityType] += modifier
        }
      }

      // Apply lineage modifiers
      if (data.lineage) {
        const lineage = species.lineages?.find((l) => l.name === data.lineage)
        if (lineage?.abilityScoreModifiers) {
          for (const [ability, modifier] of Object.entries(lineage.abilityScoreModifiers)) {
            const abilityType = ability as AbilityType
            modifiers[abilityType] += modifier
          }
        }
      }
    }
  } else if (rulesetId === "srd52") {
    // 2024 rules: Apply background ability bonuses
    for (const ability of Abilities) {
      const fieldName = `background_ability_${ability.substring(0, 3)}_bonus`
      const bonus = Number(data[fieldName] || 0)
      if (bonus > 0) {
        modifiers[ability] = bonus
      }
    }
  }

  return modifiers
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

  // Validate ability scores (only on final submit, not on isCheck)
  if (!isCheck) {
    // Validate ability method is provided
    if (!data.ability_method) {
      errors.ability_method = "Ability score method is required"
    }

    // Parse base ability scores
    const baseScores = {
      strength: Number.parseInt(data.ability_str || "0", 10),
      dexterity: Number.parseInt(data.ability_dex || "0", 10),
      constitution: Number.parseInt(data.ability_con || "0", 10),
      intelligence: Number.parseInt(data.ability_int || "0", 10),
      wisdom: Number.parseInt(data.ability_wis || "0", 10),
      charisma: Number.parseInt(data.ability_cha || "0", 10),
    }

    // Method-specific validation
    if (data.ability_method === "standard-array") {
      const scores = Object.values(baseScores)
      if (!validateStandardArray(scores)) {
        errors.ability_method = "Standard array must use exactly the values [15, 14, 13, 12, 10, 8]"
      }
    } else if (data.ability_method === "point-buy") {
      const scores = Object.values(baseScores)
      const result = validatePointBuy(scores)
      if (!result.valid) {
        errors.ability_method = result.error || "Invalid point buy"
      }
    } else if (data.ability_method === "random") {
      // Validate scores are in realistic range for dice rolls (3-18)
      const scores = Object.values(baseScores)
      if (scores.some((s) => s < 3 || s > 18)) {
        errors.ability_method = "Random generation scores must be 3-18"
      }
    }

    // Validate 2024 background ability selections
    if (rulesetId === "srd52" && data.background) {
      const background = ruleset.backgrounds[data.background]
      if (background?.abilityScoresModified) {
        const allowedAbilities = background.abilityScoresModified
        let totalBonus = 0
        const bonusesApplied: AbilityType[] = []

        for (const ability of Abilities) {
          const fieldName = `background_ability_${ability.substring(0, 3)}_bonus`
          const bonus = Number.parseInt(data[fieldName] || "0", 10)

          if (bonus > 0) {
            // Check if this ability is allowed for this background
            if (!allowedAbilities.includes(ability)) {
              errors[fieldName] =
                `${ability} cannot receive a bonus from ${background.name} background`
            }

            bonusesApplied.push(ability)
            totalBonus += bonus
          }
        }

        // Must total exactly 3
        if (totalBonus !== 3) {
          errors.background = `Background ability bonuses must total 3 (currently ${totalBonus})`
        }

        // Must apply to at least 2 different abilities
        if (bonusesApplied.length < 2 && totalBonus > 0) {
          errors.background = "Must apply bonuses to at least 2 different abilities"
        }
      }
    }

    // Validate final scores (base + modifiers) are ≤ 20
    if (Object.keys(errors).length === 0) {
      const modifiers = calculateModifiers(ruleset, rulesetId, data)
      const finalScoreErrors = validateFinalScores(baseScores, modifiers)
      Object.assign(errors, finalScoreErrors)
    }

    // Validate class skill proficiency selections
    if (data.class) {
      const classDef = ruleset.classes[data.class as ClassNameType]
      if (classDef) {
        const skillChoices = classDef.skillChoices
        const selectedSkills: SkillType[] = []

        // Parse selected skills from form data
        for (const skill of skillChoices.from) {
          const fieldName = `class_proficiency_${skill.replace(/\s+/g, "_")}`
          const value = data[fieldName]
          if (value === "true" || value === "on") {
            selectedSkills.push(skill)
          }
        }

        // Check if exactly the required number of skills are selected
        if (selectedSkills.length !== skillChoices.choose) {
          errors.class_skills = `Must select exactly ${skillChoices.choose} skill${
            skillChoices.choose > 1 ? "s" : ""
          } (currently selected ${selectedSkills.length})`
        }

        // Check for conflicts with background skills
        if (data.background) {
          const background = ruleset.backgrounds[data.background]
          const backgroundSkills = background?.skillProficiencies || []
          for (const skill of selectedSkills) {
            if (backgroundSkills.includes(skill)) {
              const fieldName = `class_proficiency_${skill.replace(/\s+/g, "_")}`
              errors[fieldName] = `Already granted by ${background?.name} background`
            }
          }
        }

        // Check for any class_proficiency_* fields that aren't in the allowed list
        for (const key of Object.keys(data)) {
          const value = data[key]
          if (key.startsWith("class_proficiency_") && (value === "true" || value === "on")) {
            // Convert field name back to skill name
            const skillName = key.replace("class_proficiency_", "").replace(/_/g, " ")
            // Check if this skill is in the allowed list for this class
            if (!skillChoices.from.includes(skillName as SkillType)) {
              errors[key] = `${skillName} is not available for ${classDef.name}`
            }
          }
        }
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

  const character = await beginOrSavepoint(db, async (tx) => {
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

    // Get class definition for initial setup
    const classDef = ruleset.classes[validated.class]

    // Parse base ability scores
    const baseScores: Record<AbilityType, number> = {
      strength: validated.ability_str,
      dexterity: validated.ability_dex,
      constitution: validated.ability_con,
      intelligence: validated.ability_int,
      wisdom: validated.ability_wis,
      charisma: validated.ability_cha,
    }

    // Get method-specific note for base scores
    const methodNotes: Record<string, string> = {
      "standard-array": "Standard array selection",
      "point-buy": "Point buy selection",
      random: "Random die roll",
    }
    const baseNote = methodNotes[validated.ability_method] || "Base ability score"

    // Persist base ability scores to database
    const baseScorePromises = Object.entries(baseScores).map(([ability, score]) =>
      createAbilityDb(tx, {
        character_id: character.id,
        ability: ability as AbilityType,
        score,
        proficiency: false,
        note: baseNote,
      })
    )
    await Promise.all(baseScorePromises)

    // Calculate and apply modifiers from species/background as separate records
    const modifiers = calculateModifiers(ruleset, rulesetId, validated)

    for (const ability of Abilities) {
      const modifier = modifiers[ability]
      if (modifier && modifier > 0) {
        const base = baseScores[ability]
        const final = base + modifier

        // Determine modifier source
        let source = ""
        if (rulesetId === "srd51") {
          const species = ruleset.species.find((s) => s.name === validated.species)
          if (species) {
            source = species.name
            // Check if it's from lineage instead
            if (validated.lineage) {
              const lineage = species.lineages?.find((l) => l.name === validated.lineage)
              if (lineage?.abilityScoreModifiers?.[ability]) {
                source = lineage.name
              }
            }
          }
        } else if (rulesetId === "srd52") {
          source = validated.background
        }

        await createAbilityDb(tx, {
          character_id: character.id,
          ability,
          score: final,
          proficiency: false,
          note: `+${modifier} from ${source}`,
        })
      }
    }

    // Get all ability scores for saving throw proficiencies
    const scores = await findAbilities(tx, character.id)

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

    for (const skill of background?.skillProficiencies || []) {
      backgroundSkillProficiencies.add(skill)
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

    // Get class skill proficiency selections
    const skillChoices = classDef.skillChoices
    const classSkillProficiencies: SkillType[] = []
    const validatedData = validated as unknown as Record<string, string | number | boolean | null>

    for (const skill of skillChoices.from) {
      const fieldName = `class_proficiency_${skill.replace(/\s+/g, "_")}`
      // After Zod parsing, Checkbox() converts "true"/"on" to true
      if (validatedData[fieldName]) {
        classSkillProficiencies.push(skill)
      }
    }

    // Create skill entries for class proficiencies
    for (const skill of classSkillProficiencies) {
      await createSkillDb(tx, {
        character_id: character.id,
        skill,
        proficiency: "proficient",
        note: `Proficiency from ${classDef.name}`,
      })
    }

    // Add the initial level using addLevel service
    // This will add all traits (species/lineage/background/class/subclass)
    // At first level, characters get the maximum value of their hit die
    const levelResult = await addLevel(tx, character, {
      class: validated.class,
      subclass: validated.subclass || "",
      level: "1",
      hit_die_roll: classDef.hitDie.toString(),
      note: "Starting Level",
    })

    if (!levelResult.complete) {
      throw new Error("Failed to add initial level")
    }

    return character
  })

  return { complete: true, character }
}
