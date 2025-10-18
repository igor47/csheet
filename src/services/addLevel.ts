import { create as createCharLevelDb, getCurrentLevels } from "@src/db/char_levels"
import { create as createTraitDb } from "@src/db/char_traits"
import type { Character } from "@src/db/characters"
import { ClassNames, ClassNamesSchema, type ClassNameType, getTraits } from "@src/lib/dnd"
import { getRuleset } from "@src/lib/dnd/rulesets"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { SQL } from "bun"
import { z } from "zod"

export const AddLevelApiSchema = z.object({
  character_id: z.string(),
  class: ClassNamesSchema,
  level: z.number().int().min(1).max(20),
  subclass: z.string().nullable().optional(),
  hit_die_roll: z.number().int().min(1).max(12),
  note: z.string().nullable().optional(),
})

export type AddLevelApi = z.infer<typeof AddLevelApiSchema>

export type AddLevelResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Add a level to a character
 * Validates level progression and adds the level to the database
 */
export async function addLevel(
  db: SQL,
  char: Character,
  data: Record<string, string>
): Promise<AddLevelResult> {
  const errors: Record<string, string> = {}
  const isCheck = data.is_check === "true"

  // Get character's ruleset and current levels
  const charRuleset = getRuleset(char.ruleset)
  const currentLevels = await getCurrentLevels(db, char.id)

  // Validate class
  if (!data.class || !ClassNames.includes(data.class as ClassNameType)) {
    if (!isCheck) {
      errors.class = "Class is required"
    }
    return { complete: false, values: data, errors }
  }

  const classDef = charRuleset.classes[data.class as ClassNameType]
  if (!classDef) {
    errors.class = "Invalid class"
    return { complete: false, values: data, errors }
  }

  // Find current level for this class
  const currentClassLevel = currentLevels.find((cl) => cl.class === data.class)
  const isMulticlassing = !currentClassLevel
  const nextLevel = isMulticlassing ? 1 : currentClassLevel.level + 1

  // Validate level
  const level = data.level ? parseInt(data.level, 10) : nextLevel
  if (Number.isNaN(level)) {
    errors.level = "Level must be a number"
    return { complete: false, values: data, errors }
  }

  if (level !== nextLevel) {
    errors.level = `Invalid level. Expected ${nextLevel}`
    return { complete: false, values: data, errors }
  }

  // Validate subclass if required
  const subclassNames = classDef.subclasses.map((s) => s.name)
  if (level === classDef.subclassLevel) {
    if (!data.subclass) {
      if (!isCheck) {
        errors.subclass = `Subclass is required at level ${classDef.subclassLevel}`
      }
    } else if (!subclassNames.includes(data.subclass)) {
      errors.subclass = `Invalid subclass for ${data.class}`
    }
  }

  // Validate hit die roll
  if (!data.hit_die_roll) {
    if (!isCheck) {
      errors.hit_die_roll = "Hit die roll is required"
    }
  } else {
    const hitDieRoll = parseInt(data.hit_die_roll, 10)
    if (Number.isNaN(hitDieRoll) || hitDieRoll < 1 || hitDieRoll > classDef.hitDie) {
      errors.hit_die_roll = `Hit die roll must be between 1 and ${classDef.hitDie}`
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // If we got here, let's actually validate and persist the data
  const result = AddLevelApiSchema.safeParse({
    character_id: char.id,
    class: data.class,
    level,
    subclass: data.subclass ? data.subclass : null,
    hit_die_roll: parseInt(data.hit_die_roll!, 10),
    note: data.note ? data.note : null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Determine subclass for levels beyond subclass level
  let finalSubclass = result.data.subclass
  if (result.data.level > classDef.subclassLevel) {
    finalSubclass = currentClassLevel?.subclass || null
  }

  // Calculate total character level (sum of all class levels + this new level)
  const totalLevel =
    currentLevels.reduce((sum, cl) => sum + cl.level, 0) + (currentClassLevel ? 0 : 1)

  await db.begin(async (tx) => {
    // Create the level
    await createCharLevelDb(tx, {
      character_id: char.id,
      class: result.data.class,
      level: result.data.level,
      subclass: finalSubclass ?? null,
      hit_die_roll: result.data.hit_die_roll,
      note: result.data.note ?? null,
    })

    // Add level-based traits from species/lineage
    const speciesTraits = getTraits(charRuleset, {
      species: char.species,
      lineage: char.lineage,
      level: totalLevel,
    })
    for (const trait of speciesTraits) {
      if (trait.level === totalLevel) {
        const sourceDetail = trait.source === "lineage" ? char.lineage : char.species
        await createTraitDb(tx, {
          character_id: char.id,
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
      background: char.background,
      level: totalLevel,
    })
    for (const trait of backgroundTraits) {
      if (trait.level === totalLevel) {
        await createTraitDb(tx, {
          character_id: char.id,
          name: trait.name,
          description: trait.description,
          source: "background",
          source_detail: char.background,
          level: totalLevel,
          note: `Gained at level ${totalLevel}`,
        })
      }
    }

    // Add level-based traits from class/subclass
    const classTraits = getTraits(charRuleset, {
      className: result.data.class,
      subclass: finalSubclass,
      level: result.data.level,
    })
    for (const trait of classTraits) {
      if (trait.level === result.data.level) {
        const sourceDetail = finalSubclass || result.data.class
        await createTraitDb(tx, {
          character_id: char.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: sourceDetail,
          level: result.data.level,
          note: `Gained at ${result.data.class} level ${result.data.level}`,
        })
      }
    }
  })

  return { complete: true }
}
