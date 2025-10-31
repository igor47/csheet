import { spells } from "@src/lib/dnd/spells"
import type { ToolExecutorResult } from "@src/tools"
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
    "Look up detailed information about any D&D 5e spell from the spell catalog. Returns the spell's full description, components, casting time, range, duration, damage, and other mechanical details. Use this when players ask about spell mechanics, effects, or availability.",
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
  parameters: Record<string, any>
): Promise<ToolExecutorResult> {
  const parsed = LookupSpellApiSchema.safeParse(parameters)

  if (!parsed.success) {
    return {
      status: "failed",
      error: `Invalid parameters: ${parsed.error.message}`,
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
        status: "failed",
        error: `No spell found matching "${spell_name}". Try a different name or partial name.`,
      }
    }

    if (matches.length === 1) {
      spell = matches[0]
    } else {
      // Multiple matches - return list of options
      const matchNames = matches.map((s) => s.name).join(", ")
      return {
        status: "failed",
        error: `Multiple spells match "${spell_name}": ${matchNames}. Please be more specific.`,
      }
    }
  }

  // This should never happen due to logic above, but TypeScript needs the check
  if (!spell) {
    return {
      status: "failed",
      error: `Spell not found: ${spell_name}`,
    }
  }

  // Return full spell details
  return {
    status: "success",
    data: {
      spell: {
        id: spell.id,
        name: spell.name,
        level: spell.level,
        school: spell.school,
        description: spell.description,
        briefDescription: spell.briefDescription,
        atHigherLevelsText: spell.atHigherLevelsText,
        castingTime: spell.castingTime,
        range: spell.range,
        components: spell.components,
        duration: spell.duration,
        target: spell.target,
        resolution: spell.resolution,
        damage: spell.damage,
        classes: spell.classes,
        ritual: spell.ritual,
      },
    },
  }
}

/**
 * Format approval message for spell lookup
 * Since this is a read-only tool, we return an empty string (no approval needed)
 */
export function formatLookupSpellApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  _parameters: Record<string, any>
): string {
  // Read-only tool doesn't need approval message
  return ""
}
