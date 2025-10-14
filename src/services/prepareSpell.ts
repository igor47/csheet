import { create as createSpellPrepared } from "@src/db/char_spells_prepared"
import { ClassNames, ClassNamesSchema } from "@src/lib/dnd"
import { spells } from "@src/lib/dnd/spells"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const PrepareSpellApiSchema = z.object({
  class: ClassNamesSchema,
  spell_type: z.enum(["cantrip", "spell"]),
  spell_id: z.string(),
  current_spell_id: z.string().optional(),
  note: z.string().nullable().optional().default(null),
})

type PrepareSpellData = Partial<z.infer<typeof PrepareSpellApiSchema>>

export type PrepareSpellResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Prepare a spell in a slot (or replace an existing spell)
 * Uses event-sourcing to track all prepare/unprepare actions
 */
export async function prepareSpell(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<PrepareSpellResult> {
  const errors: Record<string, string> = {}
  const values = data as PrepareSpellData
  const isCheck = data.is_check === "true"

  // Validate class
  if (!values.class) {
    if (isCheck) {
      errors.class = "A class is required"
      return { complete: false, errors, values: {} }
    }
  } else {
    if (!ClassNames.includes(values.class)) {
      errors.class = `Invalid class ${values.class}`
      if (isCheck) {
        return { complete: false, errors, values: data }
      }
    }
  }

  // Find spell info for this class
  const si = values.class ? char.spells.find((s) => s.class === values.class) : null
  if (values.class && !si) {
    errors.class = `${char.name} does not have class ${values.class}`
    if (isCheck) {
      return { complete: false, errors, values: data }
    }
  }

  // Validate type
  const isCantrip = values.spell_type === "cantrip"
  if (values.spell_type && values.spell_type !== "cantrip" && values.spell_type !== "spell") {
    errors.type = `Invalid type ${values.spell_type}`
    if (isCheck) {
      return { complete: false, errors, values: data }
    }
  }

  // Validate spell
  if (values.spell_id) {
    const spell = spells.find((s) => s.id === values.spell_id)
    if (!spell) {
      errors.spell_id = `Spell with ID ${values.spell_id} not found`
    } else if (si) {
      // Check if spell belongs to class
      if (!spell.classes.includes(si.class)) {
        errors.spell_id = `Cannot prepare ${spell.name} as a ${si.class}`
      }
      // Check spell level matches type
      else if (isCantrip && spell.level !== 0) {
        errors.spell_id = `${spell.name} is not a cantrip`
      } else if (!isCantrip && spell.level === 0) {
        errors.spell_id = `${spell.name} is a cantrip, not a leveled spell`
      }
      // Check spell level doesn't exceed max
      else if (!isCantrip && spell.level > si.maxSpellLevel) {
        errors.spell_id = `${spell.name} is level ${spell.level}, higher than character max ${si.maxSpellLevel}`
      }
      // Wizard-specific: leveled spells must be in spellbook (cantrips don't need to be)
      else if (si.knownSpells !== null && !isCantrip && !si.knownSpells.includes(spell.id)) {
        errors.spell_id = `${spell.name} is not in your spellbook`
      }
      // Check if trying to prepare same spell that's already there
      else if (values.current_spell_id === values.spell_id) {
        errors.spell_id = `${spell.name} is already prepared in this slot`
      }
      // Check if spell is already prepared in ANY class (across all spellcasting classes)
      else {
        for (const spellInfo of char.spells) {
          const slots = isCantrip ? spellInfo.cantripSlots : spellInfo.preparedSpells
          const alreadyPrepared = slots.some(
            (slot) => slot.spell_id === spell.id && slot.spell_id !== values.current_spell_id
          )
          if (alreadyPrepared) {
            errors.spell_id = `${spell.name} is already prepared as a ${spellInfo.class} ${isCantrip ? "cantrip" : "spell"}`
            break
          }
        }
      }
    }
  } else {
    if (!isCheck) {
      errors.spell_id = "Select a spell to prepare"
    }
  }

  // Validate current_spell_id if provided
  if (values.current_spell_id) {
    const currentSpell = spells.find((s) => s.id === values.current_spell_id)
    if (!currentSpell) {
      errors.current_spell_id = `Current spell with ID ${values.current_spell_id} not found`
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // If we got here, let's actually validate and persist the data
  const result = PrepareSpellApiSchema.safeParse({
    ...values,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  const newSpell = spells.find((sp) => sp.id === result.data.spell_id)!

  await db.begin(async (tx) => {
    // If replacing, unprepare old spell first
    if (result.data.current_spell_id) {
      await createSpellPrepared(tx, {
        character_id: char.id,
        class: result.data.class,
        spell_id: result.data.current_spell_id,
        action: "unprepare",
        always_prepared: false,
        note: `Replaced with ${newSpell.name}`,
      })
    }

    // Prepare new spell
    await createSpellPrepared(tx, {
      character_id: char.id,
      class: result.data.class,
      spell_id: result.data.spell_id,
      action: "prepare",
      always_prepared: false,
      note: result.data.note,
    })
  })

  return { complete: true }
}
