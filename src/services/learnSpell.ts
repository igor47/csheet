import { z } from "zod";
import type { SQL } from "bun";
import { create as createSpellLearned } from "@src/db/char_spells_learned";
import { Classes, ClassNames, ClassNamesSchema, type ClassDef } from "@src/lib/dnd";
import { spells } from "@src/lib/dnd/spells";
import type { ComputedCharacter } from "./computeCharacter";
import { zodToFormErrors } from "@src/lib/formErrors";

export const LearnSpellApiSchema = z.object({
  class: ClassNamesSchema,
  forget_spell_id: z.string().optional(),
  spell_id: z.string(),
  allowForgetting: z.boolean(),
  allowExtraSpells: z.boolean(),
  allowHighLevel: z.boolean(),
  note: z.string().nullable().optional().default(null),
  is_check: z.boolean().optional().default(false)
});

type LearnSpellData = Partial<z.infer<typeof LearnSpellApiSchema>>

export type LearnSpellResult =
  | { complete: true }
  | { complete: false, values: Record<string, string>, errors: Record<string, string> }

/**
 * Learn a new spell (primarily for wizards copying spells to spellbook)
 * Can also be used for "spells known" casters when leveling up
 */
export async function learnSpell(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>,
): Promise<LearnSpellResult> {
  const errors: Record<string, string> = {}

  const values = data as LearnSpellData
  const isCheck = values.is_check || false

  let classDef: ClassDef | null = null
  if (!values.class) {
    if (isCheck) {
      errors.class = "A class is required"
      return { complete: false, errors, values: {}}
    }
  } else {
    if (!ClassNames.includes(values.class)) {
      errors.class = `Invalid class ${values.class}`
      if (isCheck) {
        return { complete: false, errors, values: data }
      }
    }
    classDef = Classes[values.class]
  }

  const si = classDef ? char.spells.find(s => s.class == classDef.name) : null
  if (classDef && !si) {
    errors.class = `${char.name} does not have class ${classDef.name}`
    if (isCheck) {
      return { complete: false, errors, values: data }
    }
  }

  if (si) {
    if (si.spellcastingType === "none") {
      errors.class = `${si.class} is not a spellcasting class`
      if (isCheck) {
        return { complete: false, errors, values: data }
      }
    }

    if (si.spellcastingType === "prepared" && si.class !== "wizard") {
      errors.class = `${si.class} is a prepared caster, and doesn't learn individual spells`;
      if (isCheck) {
        return { complete: false, errors, values: data }
      }
    }
  }

  if (values.spell_id) {
    const spell = spells.find(s => s.id === values.spell_id);
    if (!spell) {
      errors.spell_id = `Spell with ID ${values.spell_id} not found`;
    } else if (si) {
      if (!spell.classes.includes(si.class)) {
        errors.spell_id = `Cannot learn ${spell.name} as a ${si.class}`

      } else if (spell.level > si.maxSpellLevel && !values.allowHighLevel) {
        errors.spell_id = `${spell.name} is level ${spell.level}, higher than character max ${si.maxSpellLevel}`

      } else {
        const currentList = spell.level === 0 ? si.cantrips : si.knownSpells
        const maxSpells = spell.level === 0 ? si.maxCantrips : si.maxSpellsKnown
        const maxedOut = currentList.length >= maxSpells;

        if (currentList.includes(spell.name)) {
          errors.spell_id = `${spell.name} is already known`
        } else if (maxedOut) {
          if (values.forget_spell_id) {
            if (si.class === "wizard") {
              errors.forget_spell_id = "Wizards do not forget spells"
            } else if (!values.allowForgetting) {
              errors.forget_spell_id = "You are not allowed to forget spells"
            }
          } else if (values.allowExtraSpells) {
            // nothing to say here
          } else {
            errors.spell_id = `You already know the maximum number of ${ spell.level === 0 ? 'cantrips' : 'spells' }`
          }
        } else if (values.forget_spell_id) {
          errors.forget_spell_id = `You don't need to forget any spells to learn a new one`
        }
      }
    }
  } else {
    if (!isCheck) {
      errors.spell_id = "Select a spell to learn"
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // if we got here, lets actually validate and persist the data
  const result = LearnSpellApiSchema.safeParse(values)

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  const newSpell = spells.find(sp => sp.id === result.data.spell_id)!

  db.begin(async (tx) => {
    if (result.data.forget_spell_id) {
      await createSpellLearned(tx, {
        character_id: char.id,
        spell_id: result.data.forget_spell_id,
        action: "forget",
        note: `Replaced with ${newSpell.name}`,
      });
    }

    await createSpellLearned(tx, {
      character_id: char.id,
      spell_id: result.data.spell_id,
      action: "learn",
      note: result.data.note
    });
  })

  return { complete: true }
}
