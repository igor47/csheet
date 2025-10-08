import { z } from "zod";
import type { SQL } from "bun";
import { create as createSpellLearned, getCurrentLearnedSpells } from "@src/db/char_spells_learned";
import { Classes, maxSpellsKnown, type ClassNameType } from "@src/lib/dnd";
import { spells } from "@src/lib/dnd/spells";
import { getMaxSpellLevel } from "@src/services/computeSpells";

export const LearnSpellApiSchema = z.object({
  character_id: z.string(),
  spell_id: z.string(),
  forget_spell_id: z.string().optional(),
  note: z.string().nullable().optional(),
});

export type LearnSpellApi = z.infer<typeof LearnSpellApiSchema>;

export const ForgetSpellApiSchema = z.object({
  character_id: z.string(),
  spell_id: z.string(),
  note: z.string().nullable().optional(),
});

export type ForgetSpellApi = z.infer<typeof ForgetSpellApiSchema>;

/**
 * Learn a new spell (primarily for wizards copying spells to spellbook)
 * Can also be used for "spells known" casters when leveling up
 *
 * @param validationClass - The class to validate spell learning against (e.g., "wizard", "sorcerer")
 */
export async function learnSpell(
  db: SQL,
  data: LearnSpellApi,
  validationClass: ClassNameType,
  classLevel: number
): Promise<void> {
  const spell = spells.find(s => s.id === data.spell_id);
  if (!spell) {
    throw new Error(`Spell with ID ${data.spell_id} not found`);
  }

  // Validate that the class can learn this spell
  const classDef = Classes[validationClass];
  if (!classDef) {
    throw new Error(`Invalid class: ${validationClass}`);
  }

  if (!classDef.spellcasting.enabled) {
    throw new Error(`${validationClass} is not a spellcasting class`);
  }

  // Check if spell is available to this class
  if (!spell.classes.includes(validationClass)) {
    throw new Error(`${spell.name} is not available to ${validationClass}`);
  }

  // Check if already learned
  const currentLearnedSpells = await getCurrentLearnedSpells(db, data.character_id);
  if (currentLearnedSpells.includes(data.spell_id)) {
    throw new Error(`You already know ${spell.name}`);
  }

  // Check if spell level is appropriate for character
  const maxSpellLevel = getMaxSpellLevel(classDef, classLevel);
  if (spell.level > maxSpellLevel) {
    throw new Error(
      `${spell.name} is level ${spell.level}, but you can only learn spells up to level ${maxSpellLevel} with your current ${validationClass} level (${classLevel})`
    );
  }

  // Cantrips (level 0) can always be learned if within cantrip limit (validated elsewhere)
  // For leveled spells, validate based on spellcasting type
  if (spell.level > 0) {
    const spellcastingType = classDef.spellcasting.spellcastingType;

    // For "prepared" casters (except wizards), they don't "learn" spells - they prepare from full list
    // So this function is primarily for:
    // 1. Wizards adding spells to spellbook
    // 2. "Known" casters learning spells when leveling up
    if (spellcastingType === "prepared" && validationClass !== "wizard") {
      throw new Error(
        `${validationClass} is a prepared caster and doesn't learn individual spells. They can prepare any spell from their class list.`
      );
    }

    // Check if at max spells known (for "known" casters)
    if (spellcastingType === "known") {
      const maxSpells = maxSpellsKnown(validationClass, classLevel);
      if (maxSpells !== null) {
        const isAtMax = currentLearnedSpells.length >= maxSpells;

        // Validate forget_spell_id logic
        if (isAtMax && !data.forget_spell_id) {
          throw new Error(`You are at maximum spells known (${maxSpells}). You must select a spell to forget in order to learn a new one.`);
        }
        if (!isAtMax && data.forget_spell_id) {
          throw new Error("Cannot forget a spell when not at maximum spells known.");
        }
      }
    }

    // Wizards can always learn more spells, so forget_spell_id is an error
    if (validationClass === "wizard" && data.forget_spell_id) {
      throw new Error("Wizards don't need to forget spells to learn new ones.");
    }
  }

  // If replacing, forget the old spell first
  if (data.forget_spell_id) {
    const oldSpell = spells.find(s => s.id === data.forget_spell_id);
    const newSpell = spells.find(s => s.id === data.spell_id);

    if (!oldSpell) {
      throw new Error(`Spell to forget with ID ${data.forget_spell_id} not found`);
    }

    // Verify the old spell is actually known
    if (!currentLearnedSpells.includes(data.forget_spell_id)) {
      throw new Error(`You don't know ${oldSpell.name}, so you can't forget it`);
    }

    await createSpellLearned(db, {
      character_id: data.character_id,
      spell_id: data.forget_spell_id,
      action: "forget",
      note: `Replaced with ${newSpell?.name}${data.note ? `: ${data.note}` : ''}`,
    });
  }

  // Learn the new spell
  const forgetNote = data.forget_spell_id
    ? `Replaced ${spells.find(s => s.id === data.forget_spell_id)?.name}`
    : null;
  const finalNote = data.note || forgetNote;

  await createSpellLearned(db, {
    character_id: data.character_id,
    spell_id: data.spell_id,
    action: "learn",
    note: finalNote,
  });
}

/**
 * Validate whether a character can learn a specific spell
 * Returns validation errors, or null if valid
 *
 * @param validationClass - The class to validate spell learning against (e.g., "wizard", "sorcerer")
 */
export async function validateLearnSpell(
  db: SQL,
  data: LearnSpellApi,
  validationClass: ClassNameType,
  classLevel: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const spell = spells.find(s => s.id === data.spell_id);
    if (!spell) {
      return { valid: false, error: `Spell not found` };
    }

    const classDef = Classes[validationClass];
    if (!classDef) {
      return { valid: false, error: `Invalid class` };
    }

    if (!classDef.spellcasting.enabled) {
      return { valid: false, error: `Not a spellcasting class` };
    }

    if (!spell.classes.includes(validationClass)) {
      return { valid: false, error: `${spell.name} is not available to ${validationClass}` };
    }

    const currentLearnedSpells = await getCurrentLearnedSpells(db, data.character_id);
    if (currentLearnedSpells.includes(data.spell_id)) {
      return { valid: false, error: `Already known` };
    }

    const maxSpellLevel = getMaxSpellLevel(classDef, classLevel);
    if (spell.level > maxSpellLevel) {
      return { valid: false, error: `Spell level too high (max: ${maxSpellLevel})` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Forget a spell (for spell replacement when leveling up)
 */
export async function forgetSpell(
  db: SQL,
  data: ForgetSpellApi
): Promise<void> {
  const spell = spells.find(s => s.id === data.spell_id);
  if (!spell) {
    throw new Error(`Spell with ID ${data.spell_id} not found`);
  }

  // Check if the spell is currently learned
  const currentLearnedSpells = await getCurrentLearnedSpells(db, data.character_id);
  if (!currentLearnedSpells.includes(data.spell_id)) {
    throw new Error(`You don't know ${spell.name}, so you can't forget it`);
  }

  // Create the forget action record
  await createSpellLearned(db, {
    character_id: data.character_id,
    spell_id: data.spell_id,
    action: "forget",
    note: data.note || null,
  });
}
