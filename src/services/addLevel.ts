import { type CharLevel, create as createCharLevelDb, getCurrentLevels } from "@src/db/char_levels"
import { create as createTraitDb } from "@src/db/char_traits"
import { findById as findCharacterById } from "@src/db/characters"
import { ClassNames, ClassNamesSchema, type ClassNameType, getTraits } from "@src/lib/dnd"
import { getRuleset } from "@src/lib/dnd/rulesets"
import srd51 from "@src/lib/dnd/srd51"
import type { SQL } from "bun"
import { z } from "zod"

// TODO: Make this dynamic based on character's ruleset
const ruleset = srd51

export const AddLevelApiSchema = z.object({
  character_id: z.string(),
  class: ClassNamesSchema,
  level: z.number().int().min(1).max(20),
  subclass: z.string().nullable().optional(),
  hit_die_roll: z.number().int().min(1).max(12),
  note: z.string().nullable().optional(),
})

export type AddLevelApi = z.infer<typeof AddLevelApiSchema>

/**
 * Prepare form values for live validation (/check endpoint)
 * Mutates values to be helpful (auto-calculate level, reset invalid fields)
 * Returns soft validation hints
 */
export function prepareAddLevelForm(
  values: Record<string, string>,
  currentLevels: CharLevel[]
): { values: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const preparedValues = { ...values }

  if (!(preparedValues.class && ClassNames.includes(values.class as ClassNameType))) {
    return { values: preparedValues, errors }
  }

  const classDef = ruleset.classes[preparedValues.class as ClassNameType]
  if (!classDef) {
    errors.class = "Invalid class"
    return { values: preparedValues, errors }
  }

  // Find current level for this class
  const currentClassLevel = currentLevels.find((cl) => cl.class === preparedValues.class)
  const isMulticlassing = !currentClassLevel
  const nextLevel = isMulticlassing ? 1 : currentClassLevel.level + 1

  // Auto-calculate level
  preparedValues.level = nextLevel.toString()

  // If multiclassing, set hit die to max (first level in class = max HP)
  if (isMulticlassing) {
    preparedValues.hit_die_roll = classDef.hitDie.toString()
  }

  // Reset subclass if it's invalid for the current class
  const subclassNames = classDef.subclasses.map((s) => s.name)
  if (preparedValues.subclass && !subclassNames.includes(preparedValues.subclass)) {
    preparedValues.subclass = ""
  }

  // Validate subclass if required at this level
  if (nextLevel === classDef.subclassLevel) {
    if (!preparedValues.subclass) {
      errors.subclass = `Subclass is required at level ${classDef.subclassLevel}`
    } else if (!subclassNames.includes(preparedValues.subclass)) {
      errors.subclass = `Invalid subclass for ${preparedValues.class}`
    }
  }

  // Validate hit die roll
  if (preparedValues.hit_die_roll) {
    const hitDieRoll = parseInt(preparedValues.hit_die_roll, 10)
    if (Number.isNaN(hitDieRoll) || hitDieRoll < 1 || hitDieRoll > classDef.hitDie) {
      errors.hit_die_roll = `Hit die roll must be between 1 and ${classDef.hitDie}`
    }
  }

  return { values: preparedValues, errors }
}

/**
 * Strict validation for form submission (POST endpoint)
 * Does NOT mutate values - validates as-is
 * Returns hard errors
 */
export function validateAddLevel(
  values: Record<string, string>,
  currentLevels: CharLevel[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!values.class || !ClassNames.includes(values.class as ClassNameType)) {
    errors.class = "Class is required"
    return { valid: false, errors }
  }

  const classDef = ruleset.classes[values.class as ClassNameType]
  if (!classDef) {
    errors.class = "Invalid class"
    return { valid: false, errors }
  }

  // Validate level
  const level = parseInt(values.level || "", 10)
  if (Number.isNaN(level)) {
    errors.level = "Level must be a number"
    return { valid: false, errors }
  }

  const currentClassLevel = currentLevels.find((cl) => cl.class === values.class)
  const expectedLevel = currentClassLevel ? currentClassLevel.level + 1 : 1

  if (level !== expectedLevel) {
    errors.level = `Invalid level. Expected ${expectedLevel}`
    return { valid: false, errors }
  }

  // Validate subclass if required
  const subclassNames = classDef.subclasses.map((s) => s.name)
  if (level === classDef.subclassLevel) {
    if (!values.subclass) {
      errors.subclass = `Subclass is required at level ${classDef.subclassLevel}`
    } else if (!subclassNames.includes(values.subclass)) {
      errors.subclass = `Invalid subclass for ${values.class}`
    }
  }

  // Validate hit die roll
  if (!values.hit_die_roll) {
    errors.hit_die_roll = "Hit die roll is required"
  } else {
    const hitDieRoll = parseInt(values.hit_die_roll, 10)
    if (Number.isNaN(hitDieRoll) || hitDieRoll < 1 || hitDieRoll > classDef.hitDie) {
      errors.hit_die_roll = `Hit die roll must be between 1 and ${classDef.hitDie}`
    }
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors }
}

/**
 * Add a level to a character
 * Validates level progression and adds the level to the database
 */
export async function addLevel(db: SQL, data: AddLevelApi): Promise<void> {
  // Get current levels to validate progression
  const currentLevels = await getCurrentLevels(db, data.character_id)

  // Find the current level for this class (if it exists)
  const currentClassLevel = currentLevels.find((cl) => cl.class === data.class)

  if (currentClassLevel) {
    // Continuing an existing class - must be exactly level + 1
    if (data.level !== currentClassLevel.level + 1) {
      throw new Error(
        `Cannot skip levels. Next level for ${data.class} should be ${currentClassLevel.level + 1}`
      )
    }
  } else {
    // Multiclassing to a new class - must start at level 1
    if (data.level !== 1) {
      throw new Error(`When multiclassing to ${data.class}, you must start at level 1`)
    }
  }

  // Validate hit die roll is within range for this class
  const classDef = ruleset.classes[data.class]
  if (!classDef) {
    throw new Error(`Invalid class: ${data.class}`)
  }

  if (data.hit_die_roll < 1 || data.hit_die_roll > classDef.hitDie) {
    throw new Error(`Hit die roll must be between 1 and ${classDef.hitDie} for ${data.class}`)
  }

  // Validate subclass if required
  const subclassNames = classDef.subclasses.map((s) => s.name)
  if (data.level === classDef.subclassLevel) {
    if (!data.subclass) {
      throw new Error(
        `Subclass is required when reaching level ${classDef.subclassLevel} in ${data.class}`
      )
    }
    if (!subclassNames.includes(data.subclass)) {
      throw new Error(`Invalid subclass ${data.subclass} for ${data.class}`)
    }
  } else if (data.level > classDef.subclassLevel) {
    data.subclass = currentClassLevel?.subclass
  }

  // Get character for trait lookup
  const character = await findCharacterById(db, data.character_id)
  if (!character) {
    throw new Error(`Character with ID ${data.character_id} not found`)
  }

  // Use character's ruleset instead of hardcoded srd51
  const charRuleset = getRuleset(character.ruleset)

  // Calculate total character level (sum of all class levels + this new level)
  const totalLevel =
    currentLevels.reduce((sum, cl) => sum + cl.level, 0) + (currentClassLevel ? 0 : 1)

  await db.begin(async (tx) => {
    // Create the level
    await createCharLevelDb(tx, {
      character_id: data.character_id,
      class: data.class,
      level: data.level,
      subclass: data.subclass || null,
      hit_die_roll: data.hit_die_roll,
      note: data.note || null,
    })

    // Add level-based traits from species/lineage
    const speciesTraits = getTraits(charRuleset, {
      species: character.species,
      lineage: character.lineage,
      level: totalLevel,
    })
    for (const trait of speciesTraits) {
      if (trait.level === totalLevel) {
        const sourceDetail = trait.source === 'lineage' ? character.lineage : character.species
        await createTraitDb(tx, {
          character_id: character.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: sourceDetail,
          level: totalLevel,
          note: `Gained at level ${totalLevel}`,
        })
      }
    }

    // Add level-based traits from background
    const backgroundTraits = getTraits(charRuleset, {
      background: character.background,
      level: totalLevel,
    })
    for (const trait of backgroundTraits) {
      if (trait.level === totalLevel) {
        await createTraitDb(tx, {
          character_id: character.id,
          name: trait.name,
          description: trait.description,
          source: "background",
          source_detail: character.background,
          level: totalLevel,
          note: `Gained at level ${totalLevel}`,
        })
      }
    }

    // Add level-based traits from class/subclass
    const classTraits = getTraits(charRuleset, {
      className: data.class,
      subclass: data.subclass,
      level: data.level,
    })
    for (const trait of classTraits) {
      if (trait.level === data.level) {
        const sourceDetail = data.subclass || data.class
        await createTraitDb(tx, {
          character_id: character.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: sourceDetail,
          level: data.level,
          note: `Gained at ${data.class} level ${data.level}`,
        })
      }
    }
  })
}
