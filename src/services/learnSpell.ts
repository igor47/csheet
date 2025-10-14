import { create as createSpellLearned } from "@src/db/char_spells_learned"
import { spells } from "@src/lib/dnd/spells"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LearnSpellApiSchema = z.object({
  spell_id: z.string(),
  note: z.string().nullable().optional().default(null),
})

type LearnSpellData = Partial<z.infer<typeof LearnSpellApiSchema>>

export type LearnSpellResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

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
    action: "learn",
    note: result.data.note,
  })

  return { complete: true }
}
