import { type Spell, spells } from "@src/lib/dnd/spells"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LookupSpellApiSchema = z.object({
  spell_name: z
    .string()
    .describe(
      "The name or partial name of the spell to look up (e.g., 'fireball', 'magic missile', 'shield'). Case-insensitive, supports partial matches."
    ),
})

export const lookupSpellToolName = "lookup_spell" as const

/**
 * Vercel AI SDK tool definition for spell lookup
 * This is a read-only informational tool that doesn't modify character state
 */
export const lookupSpellTool = tool({
  name: lookupSpellToolName,
  description:
    "Look up a spell by name to get its ID and details. ALWAYS use this FIRST whenever a spell is mentioned by name, before using prepare_spell, cast_spell, or learn_spell. Returns the spell's ID, description, components, casting time, range, duration, damage, and other mechanical details.",
  inputSchema: LookupSpellApiSchema,
})

/**
 * Execute spell lookup
 * Searches the spell catalog and returns matching spell details
 */
export async function executeLookupSpell(
  _db: SQL,
  _char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<Spell>> {
  const parsed = LookupSpellApiSchema.safeParse(parameters)

  if (!parsed.success) {
    return {
      complete: false,
      values: parameters,
      errors: zodToFormErrors(parsed.error),
    }
  }

  const { spell_name } = parsed.data
  const searchTerm = spell_name.toLowerCase().trim()

  // Find exact match first
  let spell = spells.find((s) => s.name.toLowerCase() === searchTerm)

  // If no exact match, try partial match
  if (!spell) {
    const matches = spells.filter((s) => s.name.toLowerCase().includes(searchTerm))

    if (matches.length === 0) {
      return {
        complete: false,
        values: parameters,
        errors: {
          spell_name: `No spell found matching "${spell_name}". Try a different name or partial name.`,
        },
      }
    }

    if (matches.length === 1) {
      spell = matches[0]
    } else {
      // Multiple matches - return list of options
      const matchNames = matches.map((s) => s.name).join(", ")
      return {
        complete: false,
        values: parameters,
        errors: {
          spell_name: `Multiple spells match "${spell_name}": ${matchNames}. Please be more specific.`,
        },
      }
    }
  }

  // This should never happen due to logic above, but TypeScript needs the check
  if (!spell) {
    return {
      complete: false,
      values: parameters,
      errors: { spell_name: `Spell not found: ${spell_name}` },
    }
  }

  // Return full spell details
  return {
    complete: true,
    result: spell,
  }
}
