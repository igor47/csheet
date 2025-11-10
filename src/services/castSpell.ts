import type { SpellLevelType } from "@src/lib/dnd"
import { spells } from "@src/lib/dnd/spells"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { updateSpellSlots } from "./updateSpellSlots"

export const CastSpellApiSchema = z.object({
  spell_id: z.string().describe("The ID of the spell to cast (e.g., 'fire-bolt', 'magic-missile')"),
  as_ritual: Checkbox()
    .optional()
    .default(false)
    .describe("True if casting as a ritual (for ritual spells only, doesn't consume spell slot)"),
  slot_level: NumberField(
    z
      .number()
      .int({ message: "Spell slot level must be a whole number" })
      .min(1, { message: "Spell slot level must be at least 1" })
      .max(9, { message: "Spell slot level cannot exceed 9" })
      .nullable()
      .default(null)
  ).describe(
    "The level of spell slot to use (required for non-cantrip, non-ritual spells). Can be higher than spell level to upcast."
  ),
  note: OptionalString().describe("Optional additional notes about the casting"),
  is_check: Checkbox().optional().default(false),
})

export type CastSpellResult = ServiceResult<{ note: string; spellId: string }>

/**
 * Cast a spell, consuming a spell slot if not cast as a ritual
 */
export async function castSpell(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<CastSpellResult> {
  const checkD = CastSpellApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  // container for errors we find here
  const errors: Record<string, string> = {}

  // Validate spell exists
  const spell = spells.find((s) => s.id === checkD.data.spell_id)
  if (!spell) {
    errors.spell_id = "Spell not found"
    return { complete: false, errors, values: data }
  }

  const isKnown = char.spells.some((s) => s.knownSpells?.some((ks) => ks === spell.id))
  const isPrepared = char.spells.some(
    (s) =>
      s.preparedSpells.some((ps) => ps.spell_id === spell.id) ||
      s.cantripSlots.some((cs) => cs.spell_id === spell.id)
  )
  const isWizard = char.classes.some((c) => c.class === "wizard")
  const isCantrip = spell.level === 0
  const asRitual = checkD.data.as_ritual === true || data.as_ritual === "true"

  // Wizards can cast ritual spells from their spellbook without preparing them (but only as rituals)
  if (!isPrepared) {
    if (spell.ritual && isWizard && isKnown && asRitual) {
      // Wizard casting known ritual spell as a ritual - allow it
    } else if (asRitual) {
      errors.spell_id = `${spell.name} is not prepared and cannot be cast as a ritual`
      return { complete: false, errors, values: data }
    } else {
      errors.spell_id = `${spell.name} is not prepared!`
      return { complete: false, errors, values: data }
    }
  }

  if (asRitual && !spell.ritual) {
    errors.as_ritual = `${spell.name} cannot be cast as a ritual`
    return { complete: false, errors, values: data }
  }

  // rituals/cantrips cannot use spell slots
  if (isCantrip || asRitual) {
    if (checkD.data.slot_level) {
      errors.slot_level = `Cannot use spell slots when casting ${isCantrip ? "a cantrip" : "as a ritual"}`
      return { complete: false, errors, values: data }
    }

    // Non-ritual, non-cantrip: validate slot level
  } else {
    if (!checkD.data.slot_level && !data.slot_level) {
      if (!checkD.data.is_check) {
        errors.slot_level = "Spell slot level is required"
      }
      return { complete: false, values: data, errors }
    }

    const slotLevel = parseInt(data.slot_level || "", 10)
    if (
      typeof slotLevel !== "number" ||
      Number.isNaN(slotLevel) ||
      slotLevel < 1 ||
      slotLevel > 9
    ) {
      errors.slot_level = "Invalid slot level"
      return { complete: false, errors, values: data }
    }

    // Validate slot level is at least spell level
    if (slotLevel < spell.level) {
      errors.slot_level = `Cannot cast level ${spell.level} spell using level ${slotLevel} slot`
      return { complete: false, errors, values: data }
    }

    // Check if slot is available
    const slotAvailable = char.availableSpellSlots
      ? char.availableSpellSlots.includes(slotLevel as SpellLevelType)
      : false
    if (!slotAvailable) {
      errors.slot_level = `No level ${slotLevel} spell slots available`
      return { complete: false, errors, values: data }
    }
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = CastSpellApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually cast the spell

  // No spell slot used
  if (isCantrip || result.data.as_ritual) {
    return {
      complete: true,
      result: {
        note: `You cast ${spell.name}${asRitual ? " as a ritual" : ""}. No spell slot was used.`,
        spellId: spell.id,
      },
    }
  } else if (!result.data.slot_level) {
    errors.slot_level = "Splot spell level is required"
    return { complete: false, values: data, errors }
  }

  // Generate note
  let generatedNote = `Cast ${spell.name}`
  if (result.data.slot_level > spell.level) {
    generatedNote += ` (at level ${result.data.slot_level})`
  }
  if (result.data.note) {
    generatedNote += `. ${result.data.note}`
  }

  // Use the spell slot
  const slotResult = await updateSpellSlots(db, char, {
    is_check: "false",
    action: "use",
    slot_level: result.data.slot_level.toString(),
    note: generatedNote,
  })

  if (!slotResult.complete) {
    // This shouldn't happen since we already validated, but handle it just in case
    throw new Error("Failed to use spell slot")
  }

  return {
    complete: true,
    result: {
      note: `You cast ${spell.name} using a level ${result.data.slot_level} spell slot.`,
      spellId: spell.id,
    },
  }
}

// Vercel AI SDK tool definition
export const castSpellToolName = "cast_spell" as const
export const castSpellTool = tool({
  name: castSpellToolName,
  description: `Cast a spell. Requires a spell id, which you must *always* get beforehand using lookup_spell tool. If casting a cantrip or casting as a ritual, this requires using a spell slot. Feel free to assume a spell slot level when appropriate.`,
  inputSchema: CastSpellApiSchema.omit({ note: true, is_check: true }).extend({
    note: z.string().optional().describe("Optional additional notes about the casting"),
  }),
})

/**
 * Execute the cast_spell tool from AI assistant
 * Converts AI parameters to service format and calls castSpell
 */
export async function executeCastSpell(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    spell_id: parameters.spell_id?.toString() || "",
    as_ritual: parameters.as_ritual?.toString() || "false",
    slot_level: parameters.slot_level?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return castSpell(db, char, data)
}

/**
 * Format approval message for cast_spell tool calls
 */
export function formatCastSpellApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { spell_id, as_ritual, slot_level, note } = parameters

  const spell = spells.find((s) => s.id === spell_id)
  const spellName = spell?.name || spell_id
  const isCantrip = spell?.level === 0

  let message = `Cast ${spellName}`

  if (as_ritual) {
    message += " as a ritual"
  } else if (!isCantrip && slot_level) {
    message += ` using level ${slot_level} slot`
  }

  if (note) {
    message += ` with note '${note}'`
  }

  return message
}
