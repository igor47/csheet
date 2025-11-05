import { beginOrSavepoint } from "@src/db"
import { create as createCharLevelDb, getCurrentLevels } from "@src/db/char_levels"
import { create as createTraitDb } from "@src/db/char_traits"
import type { Character } from "@src/db/characters"
import { ClassNames, ClassNamesSchema, type ClassNameType, getTraits } from "@src/lib/dnd"
import { getRuleset } from "@src/lib/dnd/rulesets"
import { zodToFormErrors } from "@src/lib/formErrors"
import { type ServiceResult, serviceResultToToolResult } from "@src/lib/serviceResult"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const AddLevelApiSchema = z.object({
  character_id: z.string(),
  class: ClassNamesSchema.describe("The class to add a level in (e.g., 'fighter', 'wizard')"),
  level: z
    .number()
    .int()
    .min(1)
    .max(20)
    .describe(
      "The new class level (automatically determined, typically you don't need to specify this)"
    ),
  subclass: z
    .string()
    .nullable()
    .optional()
    .describe(
      "The subclass name (required at subclass level, e.g., 'Evocation' for wizards at level 3)"
    ),
  hit_die_roll: z
    .number()
    .int()
    .min(1)
    .max(12)
    .describe(
      "The HP rolled on the hit die for this level. Ask the user to roll their hit die and provide the result."
    ),
  note: z.string().nullable().optional().describe("Optional note about this level gain"),
})

export type AddLevelApi = z.infer<typeof AddLevelApiSchema>

export type AddLevelResult = ServiceResult<undefined>

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
    if (isCheck) {
      data.level = nextLevel.toString()
    } else {
      errors.level = `Invalid level. Expected ${nextLevel}`
    }
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

  // Calculate level variables for clearer conditionals
  const classLevelNew = nextLevel
  const totalLevelOld = currentLevels.reduce((sum, cl) => sum + cl.level, 0)
  const totalLevelNew = totalLevelOld + 1

  // Helper function to add level and traits within a transaction
  await beginOrSavepoint(db, async (tx) => {
    // Create the level
    await createCharLevelDb(tx, {
      character_id: char.id,
      class: result.data.class,
      level: result.data.level,
      subclass: finalSubclass ?? null,
      hit_die_roll: result.data.hit_die_roll,
      note: result.data.note ?? null,
    })

    // Add traits from species/lineage
    // At total level 1: add always-on traits (!trait.level) and level 1 traits
    // At other levels: only add traits for that specific level
    const speciesTraits = getTraits(charRuleset, {
      species: char.species,
      lineage: char.lineage,
      level: totalLevelNew,
    })
    for (const trait of speciesTraits) {
      if (trait.level === totalLevelNew || (totalLevelNew === 1 && !trait.level)) {
        const sourceDetail = trait.source === "lineage" ? char.lineage : char.species
        await createTraitDb(tx, {
          character_id: char.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: sourceDetail,
          level: trait.level || null,
          note: trait.level ? `Gained at level ${totalLevelNew}` : null,
        })
      }
    }

    // Add traits from background
    // At total level 1: add always-on traits (!trait.level) and level 1 traits
    // At other levels: only add traits for that specific level
    const backgroundTraits = getTraits(charRuleset, {
      background: char.background,
      level: totalLevelNew,
    })
    for (const trait of backgroundTraits) {
      if (trait.level === totalLevelNew || (totalLevelNew === 1 && !trait.level)) {
        await createTraitDb(tx, {
          character_id: char.id,
          name: trait.name,
          description: trait.description,
          source: "background",
          source_detail: char.background,
          level: trait.level || null,
          note: trait.level ? `Gained at level ${totalLevelNew}` : null,
        })
      }
    }

    // Add traits from class/subclass
    // At class level 1 (including multiclass): add always-on traits (!trait.level) and level 1 traits
    // At other class levels: only add traits for that specific level
    const classTraits = getTraits(charRuleset, {
      className: result.data.class,
      subclass: finalSubclass,
      level: classLevelNew,
    })
    for (const trait of classTraits) {
      if (trait.level === classLevelNew || (classLevelNew === 1 && !trait.level)) {
        // Use trait.source to determine if this is a class or subclass trait
        const sourceDetail = trait.source === "subclass" ? finalSubclass || null : result.data.class
        await createTraitDb(tx, {
          character_id: char.id,
          name: trait.name,
          description: trait.description,
          source: trait.source,
          source_detail: sourceDetail,
          level: trait.level || null,
          note: trait.level ? `Gained at ${result.data.class} level ${classLevelNew}` : null,
        })
      }
    }
  })

  return { complete: true, result: undefined }
}

// Vercel AI SDK tool definition
export const addLevelToolName = "add_level" as const
export const addLevelTool = tool({
  name: addLevelToolName,
  description: `Add a level to the character (level up). Automatically adds class traits/features for the new level. Ask the user to roll their hit die for HP.`,
  inputSchema: AddLevelApiSchema.omit({ character_id: true, level: true }),
})

/**
 * Execute the add_level tool from AI assistant
 */
export async function executeAddLevel(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
): Promise<ToolExecutorResult> {
  const data: Record<string, string> = {
    class: parameters.class?.toString() || "",
    subclass: parameters.subclass?.toString() || "",
    hit_die_roll: parameters.hit_die_roll?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  const result = await addLevel(db, char, data)

  return serviceResultToToolResult(result)
}

/**
 * Format approval message for add_level tool calls
 */
export function formatAddLevelApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { class: className, subclass, hit_die_roll, note } = parameters

  let message = `Add level in ${className}`
  if (subclass) {
    message += ` (${subclass} subclass)`
  }
  message += `, rolled ${hit_die_roll} HP`

  if (note) {
    message += `\n${note}`
  }

  return message
}
