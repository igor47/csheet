import { beginOrSavepoint } from "@src/db"
import { create as createAbilityDb } from "@src/db/char_abilities"
import { create as createSkillDb } from "@src/db/char_skills"
import { type Character, create as createCharacterDb, nameExistsForUser } from "@src/db/characters"
import type { User } from "@src/db/users"
import { Abilities, type AbilityType, ClassNames, type ClassNameType, Skills } from "@src/lib/dnd"
import { getRuleset, RULESETS, type RulesetId, RulesetIdSchema } from "@src/lib/dnd/rulesets"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"
import { addLevel } from "./addLevel"

/**
 * Import Character Schema
 */
const BaseImportSchema = z.object({
  name: z.string().min(3, "Pick a better character name!").max(50, "That name is too long!"),
  species: z.string(),
  lineage: OptionalString(),
  background: z.string(),
  custom_background: OptionalString(),
  alignment: OptionalString(),
  ruleset: RulesetIdSchema,
  max_hp: NumberField(
    z
      .number({ error: "Max HP is required" })
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must be at least 1" })
  ),
  is_check: Checkbox().optional().default(false),
})

/**
 * Multi-class selections schema
 * Each class has a checkbox (classes_CLASS), level dropdown (levels_CLASS), and optional subclass (subclass_CLASS)
 */
const MultiClassSchema = z.object({
  // Checkboxes for each class
  classes_barbarian: Checkbox().optional(),
  classes_bard: Checkbox().optional(),
  classes_cleric: Checkbox().optional(),
  classes_druid: Checkbox().optional(),
  classes_fighter: Checkbox().optional(),
  classes_monk: Checkbox().optional(),
  classes_paladin: Checkbox().optional(),
  classes_ranger: Checkbox().optional(),
  classes_rogue: Checkbox().optional(),
  classes_sorcerer: Checkbox().optional(),
  classes_warlock: Checkbox().optional(),
  classes_wizard: Checkbox().optional(),

  // Level selections for each class (NumberField converts form strings to numbers)
  levels_barbarian: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_bard: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_cleric: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_druid: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_fighter: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_monk: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_paladin: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_ranger: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_rogue: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_sorcerer: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_warlock: NumberField(z.number().int().min(1).max(20)).optional(),
  levels_wizard: NumberField(z.number().int().min(1).max(20)).optional(),

  // Subclass selections for each class (optional, shown when level >= subclassLevel)
  subclass_barbarian: OptionalString(),
  subclass_bard: OptionalString(),
  subclass_cleric: OptionalString(),
  subclass_druid: OptionalString(),
  subclass_fighter: OptionalString(),
  subclass_monk: OptionalString(),
  subclass_paladin: OptionalString(),
  subclass_ranger: OptionalString(),
  subclass_rogue: OptionalString(),
  subclass_sorcerer: OptionalString(),
  subclass_warlock: OptionalString(),
  subclass_wizard: OptionalString(),
})

/**
 * Direct ability score inputs (final scores, not base)
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

const DirectAbilityScoresSchema = z.object({
  ability_strength: AbilityScoreField,
  ability_dexterity: AbilityScoreField,
  ability_constitution: AbilityScoreField,
  ability_intelligence: AbilityScoreField,
  ability_wisdom: AbilityScoreField,
  ability_charisma: AbilityScoreField,
})

/**
 * Saving throw proficiency checkboxes
 */
const SavingThrowProficiencySchema = z.object({
  save_strength: Checkbox().optional(),
  save_dexterity: Checkbox().optional(),
  save_constitution: Checkbox().optional(),
  save_intelligence: Checkbox().optional(),
  save_wisdom: Checkbox().optional(),
  save_charisma: Checkbox().optional(),
})

/**
 * Skill proficiency radio buttons (none, half, proficient, expert)
 */
const ProficiencyFormFieldSchema = z
  .union([
    z.literal("none"),
    z.literal("half"),
    z.literal("proficient"),
    z.literal("expert"),
    z.undefined(),
  ])
  .default("none")

const SkillProficiencySchema = z.object({
  acrobatics_proficiency: ProficiencyFormFieldSchema,
  animal_handling_proficiency: ProficiencyFormFieldSchema,
  arcana_proficiency: ProficiencyFormFieldSchema,
  athletics_proficiency: ProficiencyFormFieldSchema,
  deception_proficiency: ProficiencyFormFieldSchema,
  history_proficiency: ProficiencyFormFieldSchema,
  insight_proficiency: ProficiencyFormFieldSchema,
  intimidation_proficiency: ProficiencyFormFieldSchema,
  investigation_proficiency: ProficiencyFormFieldSchema,
  medicine_proficiency: ProficiencyFormFieldSchema,
  nature_proficiency: ProficiencyFormFieldSchema,
  perception_proficiency: ProficiencyFormFieldSchema,
  performance_proficiency: ProficiencyFormFieldSchema,
  persuasion_proficiency: ProficiencyFormFieldSchema,
  religion_proficiency: ProficiencyFormFieldSchema,
  sleight_of_hand_proficiency: ProficiencyFormFieldSchema,
  stealth_proficiency: ProficiencyFormFieldSchema,
  survival_proficiency: ProficiencyFormFieldSchema,
})

/**
 * Combined Import Character API Schema
 */
export const ImportCharacterApiSchema = BaseImportSchema.and(MultiClassSchema)
  .and(DirectAbilityScoresSchema)
  .and(SavingThrowProficiencySchema)
  .and(SkillProficiencySchema)

export type ImportCharacterResult =
  | { complete: true; character: Character }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Import an existing character
 * Allows direct entry of final stats, multiple classes, and explicit skill selection
 */
export async function importCharacter(
  db: SQL,
  user: User,
  data: Record<string, string>
): Promise<ImportCharacterResult> {
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

  // Validate species
  if (!data.species) {
    if (!isCheck) {
      errors.species = "Species is required"
    }
  } else if (!ruleset.species.find((s) => s.name === data.species)) {
    errors.species = "Invalid species for this ruleset"
  } else {
    // Validate lineage for selected species
    const species = ruleset.species.find((s) => s.name === data.species)
    if (species) {
      // If species has lineages, one must be selected
      if (species.lineages && species.lineages.length > 0) {
        if (!data.lineage) {
          if (!isCheck) {
            errors.lineage = "Lineage is required for this species"
          }
        } else if (!species.lineages.find((l) => l.name === data.lineage)) {
          errors.lineage = "Invalid lineage for this species"
        }
      }
    }
  }

  // Validate background (allow custom)
  if (!data.background) {
    if (!isCheck) {
      errors.background = "Background is required"
    }
  } else {
    const isCustomBackground = data.background === "_custom"
    if (isCustomBackground) {
      if (!data.custom_background) {
        if (!isCheck) {
          errors.custom_background = "Custom background name is required"
        }
      } else if (data.custom_background.trim().length === 0) {
        errors.custom_background = "Custom background name is required"
      } else if (data.custom_background.length > 50) {
        errors.custom_background = "Background name must be less than 50 characters"
      }
    } else if (!ruleset.backgrounds[data.background]) {
      errors.background = "Invalid background for this ruleset"
    }
  }

  // Validate classes: at least one must be selected
  const selectedClasses: Array<{ class: ClassNameType; level: number; subclass?: string }> = []
  let totalLevels = 0

  for (const className of ClassNames) {
    const isSelected = data[`classes_${className}`] === "on"
    if (isSelected) {
      // For soft validation, parse the string. Zod will do full validation later.
      const levelStr = data[`levels_${className}`] || "1"
      const level = Number.parseInt(levelStr, 10)

      if (Number.isNaN(level)) {
        if (!isCheck) {
          errors[`levels_${className}`] = "Level must be a number"
        }
      } else if (level < 1 || level > 20) {
        if (!isCheck) {
          errors[`levels_${className}`] = "Level must be between 1 and 20"
        }
      } else {
        const classDef = ruleset.classes[className]
        const subclass = data[`subclass_${className}`]

        // Validate subclass if level requires it
        if (classDef && level >= classDef.subclassLevel) {
          if (!subclass || subclass.trim().length === 0) {
            if (!isCheck) {
              errors[`subclass_${className}`] =
                `Subclass is required at level ${classDef.subclassLevel}+`
            }
          } else if (!classDef.subclasses.find((sc) => sc.name === subclass)) {
            errors[`subclass_${className}`] = "Invalid subclass"
          }
        }

        selectedClasses.push({ class: className, level, subclass })
        totalLevels += level
      }
    }
  }

  if (selectedClasses.length === 0 && !isCheck) {
    errors.classes = "You must select at least one class"
  }

  if (totalLevels > 20) {
    errors.classes = `Total level (${totalLevels}) cannot exceed 20`
  }

  // Validate ability scores (just check they're provided, Zod will validate range)
  for (const ability of Abilities) {
    const fieldName = `ability_${ability}`
    if (!data[fieldName] && !isCheck) {
      errors[fieldName] = "Ability score is required"
    }
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    return { complete: false, values, errors }
  }

  // Only proceed with full validation and database operations if not a check
  if (isCheck) {
    return { complete: false, values, errors }
  }

  // Full validation with Zod
  const result = ImportCharacterApiSchema.safeParse(data)

  if (!result.success) {
    const zodErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      zodErrors[field] = issue.message
    }
    return { complete: false, values, errors: zodErrors }
  }

  const validated = result.data

  // Determine final background name
  const isCustomBackground = validated.background === "_custom"
  const finalBackground = isCustomBackground ? validated.custom_background! : validated.background

  // Final validation: ensure all selected classes have subclass when required
  for (const { class: className, level, subclass } of selectedClasses) {
    const classDef = ruleset.classes[className]
    if (classDef && level >= classDef.subclassLevel) {
      if (!subclass || subclass.trim().length === 0) {
        return {
          complete: false,
          values: data,
          errors: {
            [`subclass_${className}`]: `Subclass is required for ${className} at level ${classDef.subclassLevel}+`,
          },
        }
      }
    }
  }

  const character = await beginOrSavepoint(db, async (tx) => {
    // Create the character in the database
    const character = await createCharacterDb(tx, {
      user_id: user.id,
      name: validated.name,
      species: validated.species,
      lineage: validated.lineage,
      background: finalBackground,
      ruleset: validated.ruleset,
      alignment: validated.alignment,
      avatar_id: null,
    })

    // Parse final ability scores (these are already modified)
    const finalScores: Record<AbilityType, number> = {
      strength: validated.ability_strength,
      dexterity: validated.ability_dexterity,
      constitution: validated.ability_constitution,
      intelligence: validated.ability_intelligence,
      wisdom: validated.ability_wisdom,
      charisma: validated.ability_charisma,
    }

    // Create ability score records (marked as imported, no base/modifier separation)
    const abilityPromises = Object.entries(finalScores).map(([ability, score]) =>
      createAbilityDb(tx, {
        character_id: character.id,
        ability: ability as AbilityType,
        score,
        proficiency: false,
        note: "Imported character",
      })
    )
    await Promise.all(abilityPromises)

    // Add saving throw proficiencies
    for (const ability of Abilities) {
      const fieldName = `save_${ability}`
      const isProficient = validated[fieldName as keyof typeof validated]

      if (isProficient) {
        await createAbilityDb(tx, {
          character_id: character.id,
          ability,
          score: finalScores[ability],
          proficiency: true,
          note: "Saving throw proficiency (imported)",
        })
      }
    }

    // Create skill proficiency records (only for non-"none" proficiencies)
    for (const skill of Skills) {
      const fieldName = `${skill.replace(/\s+/g, "_")}_proficiency`
      const proficiency = validated[fieldName as keyof typeof validated] as string

      // Only create records for skills with proficiency (not "none")
      if (proficiency && proficiency !== "none") {
        await createSkillDb(tx, {
          character_id: character.id,
          skill,
          proficiency: proficiency as "half" | "proficient" | "expert",
          note: "Imported character",
        })
      }
    }

    // Add levels for each selected class using addLevel service
    // addLevel creates the level record AND all associated traits (species/lineage/background/class/subclass)

    // Sort by level descending to add primary class first
    const sortedClasses = [...selectedClasses].sort((a, b) => b.level - a.level)

    // Calculate HP distribution across levels
    const totalCharacterLevel = selectedClasses.reduce((sum, cls) => sum + cls.level, 0)
    const maxHp = validated.max_hp
    const hpPerLevel = Math.floor(maxHp / totalCharacterLevel)
    const hpRemainder = maxHp % totalCharacterLevel

    // Build a flat list of levels to add in order with subclass info
    const levelsToAdd: Array<{ class: ClassNameType; classLevel: number; subclass?: string }> = []
    for (const { class: className, level: totalLevel, subclass } of sortedClasses) {
      for (let lvl = 1; lvl <= totalLevel; lvl++) {
        levelsToAdd.push({ class: className, classLevel: lvl, subclass })
      }
    }

    // Add each level using addLevel service (which creates traits)
    for (let i = 0; i < levelsToAdd.length; i++) {
      const { class: className, classLevel, subclass } = levelsToAdd[i]!

      // Calculate HP for this absolute level (1-indexed)
      const absoluteLevel = i + 1
      const isInRemainderRange = absoluteLevel > totalCharacterLevel - hpRemainder
      let hitDieRoll = hpPerLevel + (isInRemainderRange ? 1 : 0)

      // Clamp hit die roll to valid range (1 to class's hit die maximum)
      const classDef = ruleset.classes[className]
      if (classDef) {
        hitDieRoll = Math.max(1, Math.min(hitDieRoll, classDef.hitDie))
      }

      // Determine if we should provide subclass for this specific level
      // Subclass is needed at subclassLevel or later
      const needsSubclass = classDef && classLevel >= classDef.subclassLevel

      // Call addLevel which creates level record AND all traits
      const levelResult = await addLevel(tx, character, {
        class: className,
        subclass: needsSubclass && subclass ? subclass : "",
        hit_die_roll: hitDieRoll.toString(),
        note: "Imported character",
      })

      if (!levelResult.complete) {
        // This should not happen since we validated above, but if it does, abort the transaction
        const errorMsg = Object.entries(levelResult.errors)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
        throw new Error(
          `Unexpected addLevel failure for ${className} level ${classLevel}: ${errorMsg}`
        )
      }
    }

    return character
  })

  return { complete: true, character }
}
