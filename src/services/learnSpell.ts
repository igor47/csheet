import { create as createSpellLearned } from "@src/db/char_spells_learned"
import { spells } from "@src/lib/dnd/spells"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LearnSpellApiSchema = z.object({
  spell_id: z
    .string()
    .describe(
      "The ID of the spell to add to the wizard's spellbook (e.g., 'fireball', 'shield'). Must be a wizard spell and not a cantrip."
    ),
  note: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe(
      "Optional note about how the spell was learned (e.g., 'Copied from scroll', 'Learned at level 5')"
    ),
})

type LearnSpellData = Partial<z.infer<typeof LearnSpellApiSchema>>

export type LearnSpellResult = ServiceResult<object>

/**
 * Add a spell to a wizard's spellbook
 * Wizards can copy spells from scrolls, other spellbooks, etc.
 */
export async function learnSpell(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<LearnSpellResult> {
  const errors: Record<string, string> = {}
  const values = data as LearnSpellData
  const isCheck = data.is_check === "true"
  const allowHighLevel = data.allowHighLevel === "true"

  // Find wizard spellcasting info
  const wizardSI = char.spells.find((s) => s.class === "wizard")
  if (!wizardSI) {
    errors.class = `${char.name} is not a wizard`
    return { complete: false, errors, values: data }
  }

  // Validate spell
  if (values.spell_id) {
    const spell = spells.find((s) => s.id === values.spell_id)
    if (!spell) {
      errors.spell_id = `Spell with ID ${values.spell_id} not found`
    } else {
      // Check if spell is on wizard list
      if (!spell.classes.includes("wizard")) {
        errors.spell_id = `${spell.name} is not a wizard spell`
      }
      // Cantrips cannot be added to spellbook
      else if (spell.level === 0) {
        errors.spell_id = `Cantrips are not written in spellbooks`
      }
      // Check if spell is already in spellbook
      else if (wizardSI.knownSpells?.includes(spell.id)) {
        errors.spell_id = `${spell.name} is already in your spellbook`
      }
      // Check spell level
      else if (spell.level > wizardSI.maxSpellLevel && !allowHighLevel) {
        errors.spell_id = `${spell.name} is level ${spell.level}, higher than your maximum spell level ${wizardSI.maxSpellLevel}`
      }
      // Check unnecessary allowHighLevel flag
      else if (allowHighLevel && spell.level <= wizardSI.maxSpellLevel) {
        errors.allowHighLevel = `You don't need to allow high-level spells - ${spell.name} is within your maximum spell level`
      }
    }
  } else {
    if (!isCheck) {
      errors.spell_id = "Select a spell to add to your spellbook"
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and persist
  const result = LearnSpellApiSchema.safeParse({
    spell_id: values.spell_id,
    note: values.note || null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  await createSpellLearned(db, {
    character_id: char.id,
    spell_id: result.data.spell_id,
    note: result.data.note,
  })

  return { complete: true, result: {} }
}

// Vercel AI SDK tool definition
export const learnSpellToolName = "learn_spell" as const
export const learnSpellTool = tool({
  name: learnSpellToolName,
  description: `Add a spell to a wizard's spellbook. Requires spell_id - use lookup_spell first to get it. Used when a wizard learns a new spell by copying it from a scroll, another spellbook, or as part of leveling up. Only wizards can use this tool.`,
  inputSchema: LearnSpellApiSchema,
})

/**
 * Execute the learn_spell tool from AI assistant
 * Converts AI parameters to service format and calls learnSpell
 */
export async function executeLearnSpell(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    spell_id: parameters.spell_id?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return learnSpell(db, char, data)
}

/**
 * Format approval message for learn_spell tool calls
 */
export function formatLearnSpellApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { spell_id, note } = parameters

  const spell = spells.find((s) => s.id === spell_id)
  const spellName = spell?.name || spell_id

  let message = `Add ${spellName} to spellbook`

  if (note) {
    message += `\n${note}`
  }

  return message
}
