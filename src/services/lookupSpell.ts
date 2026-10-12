import { RULESET_LABELS } from "@src/lib/dnd/rulesets"
import { getSpells, type Spell } from "@src/lib/dnd/spells"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { normalizeSpellName } from "@src/lib/srd/spells"
import type { ToolInput, ToolSpec } from "@src/lib/toolSpec"
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
export const lookupSpellTool = {
  description:
    "Look up a spell by name to get its ID and details. ALWAYS use this FIRST whenever a spell is mentioned by name, before using prepare_spell, cast_spell, or learn_spell. Returns the spell's ID, description, components, casting time, range, duration, damage, and other mechanical details.",
  inputSchema: LookupSpellApiSchema,
} satisfies ToolSpec

/**
 * Execute spell lookup
 * Searches the spell catalog and returns matching spell details
 */
export async function executeLookupSpell(
  _db: SQL,
  char: ComputedCharacter,
  parameters: ToolInput<typeof lookupSpellTool>,
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
  // normalized, since 5.2 names use curly apostrophes ("Hunter’s Mark") and 5.1 names straight ones
  const searchTerm = normalizeSpellName(spell_name.trim())
  // only the character's ruleset: the other edition's version of a spell has different numbers
  const spells = getSpells(char.ruleset)

  // Find exact match first
  let spell = spells.find((s) => normalizeSpellName(s.name) === searchTerm)

  // If no exact match, try partial match
  if (!spell) {
    const matches = spells.filter((s) => normalizeSpellName(s.name).includes(searchTerm))

    if (matches.length === 0) {
      const rulesetName = RULESET_LABELS[char.ruleset]
      const otherRuleset = char.ruleset === SRD52_ID ? SRD51_ID : SRD52_ID
      const elsewhere = getSpells(otherRuleset).filter((s) =>
        normalizeSpellName(s.name).includes(searchTerm)
      )
      const message =
        elsewhere.length > 0
          ? `${elsewhere.map((s) => s.name).join(", ")} ${elsewhere.length === 1 ? "is" : "are"} in ${RULESET_LABELS[otherRuleset]} but not in ${rulesetName}, which this character uses.`
          : `No spell found matching "${spell_name}" in ${rulesetName}. Try a different name or partial name.`
      return { complete: false, values: parameters, errors: { spell_name: message } }
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
