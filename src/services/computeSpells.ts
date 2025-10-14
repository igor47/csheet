import type { SQL } from "bun";
import { getCurrentLearnedSpells } from "@src/db/char_spells_learned";
import { getCurrentlyPrepared as getPreparedSpells, type CharSpellPrepared } from "@src/db/char_spells_prepared";
import { getRuleset, type ClassNameType, type AbilityType, type ClassDef, type SpellChangeEventType } from "@src/lib/dnd";
import { spells, type Spell } from "@src/lib/dnd/spells";
import type { CharacterClass, AbilityScore } from "@src/services/computeCharacter";

export interface PreparedSpellSlot {
  spell_id: string | null;  // null = empty slot
  alwaysPrepared: boolean;  // true = cannot be changed (e.g., domain spells)
}

export interface SpellInfoForClass {
  class: ClassNameType;
  level: number;

  // Spellcasting stats
  ability: AbilityType;
  spellAttackBonus: number;
  spellSaveDC: number;
  changePrepared: SpellChangeEventType;
  maxSpellLevel: number;  // Highest spell level this class can cast

  // Cantrip slots (all casters)
  cantripSlots: PreparedSpellSlot[];

  // Wizard only: spellbook from char_spells_learned
  knownSpells: string[] | null;

  // Prepared/known spell slots for leveled spells
  preparedSpells: PreparedSpellSlot[];
}

/**
 * Compute spell information for a single class
 */
async function computeSpellsForClass(
  ruleset: any,
  charClass: CharacterClass,
  abilityScores: Record<AbilityType, AbilityScore>,
  proficiencyBonus: number,
  wizardSpellbookSpells: Spell[],
  allPreparedRecords: CharSpellPrepared[]
): Promise<SpellInfoForClass | null> {
  const classDef = ruleset.Classes[charClass.class];

  // Skip non-spellcasting classes
  if (!classDef.spellcasting.enabled) {
    return null;
  }

  // Check if spellcasting is subclass-specific
  if (classDef.spellcasting.subclasses && classDef.spellcasting.subclasses.length > 0) {
    if (!charClass.subclass || !classDef.spellcasting.subclasses.includes(charClass.subclass)) {
      return null;
    }
  }

  const ability = classDef.spellcasting.ability;
  const abilityModifier = abilityScores[ability].modifier;
  const changePrepared = classDef.spellcasting.changePrepared;

  // Calculate spell attack bonus and save DC
  const spellAttackBonus = proficiencyBonus + abilityModifier;
  const spellSaveDC = 8 + proficiencyBonus + abilityModifier;

  // Calculate max spell level this class can cast
  const maxSpellLevel = getMaxSpellLevel(ruleset, classDef, charClass.level);

  // Calculate maximums
  const maxCantrips = ruleset.maxCantripsKnown(charClass.class, charClass.level);

  // Filter prepared records for this class
  const classPreparedRecords = allPreparedRecords.filter(r => r.class === charClass.class);

  // Separate cantrip and leveled spell records
  const cantripRecords = classPreparedRecords.filter(r => {
    const spell = spells.find(s => s.id === r.spell_id);
    return spell && spell.level === 0;
  });

  const leveledSpellRecords = classPreparedRecords.filter(r => {
    const spell = spells.find(s => s.id === r.spell_id);
    return spell && spell.level > 0;
  });

  // Create cantrip slots (all classes)
  const cantripSlots = createPreparedSlots(cantripRecords, maxCantrips);

  // Wizard: uses spellbook (char_spells_learned) for all spells
  let knownSpells: string[] | null = null;
  if (charClass.class === "wizard") {
    const classSpells = wizardSpellbookSpells.filter(s => s.classes.includes(charClass.class));
    knownSpells = classSpells.map(s => s.id); // Includes both cantrips and leveled spells
  }

  const maxPrepared = ruleset.maxSpellsPrepared(charClass.class, charClass.level) || 0;
  const preparedSlots = createPreparedSlots(leveledSpellRecords, maxPrepared);

  return {
    class: charClass.class,
    level: charClass.level,
    ability,
    spellAttackBonus,
    spellSaveDC,
    changePrepared,
    maxSpellLevel,
    cantripSlots,
    knownSpells,
    preparedSpells: preparedSlots,
  };
}

/**
 * Create prepared spell slots from a list of prepared spell records
 * Always-prepared spells are placed first, then other spells, then empty slots
 */
function createPreparedSlots(
  preparedRecords: CharSpellPrepared[],
  totalSlots: number
): PreparedSpellSlot[] {
  const slots: PreparedSpellSlot[] = [];

  // always-preapred spells don't count against total slots
  const alwaysPrepared = preparedRecords.filter(r => r.always_prepared);
  const actualMax = totalSlots + alwaysPrepared.length;

  // Sort so always-prepared spells come first
  const sorted = [...preparedRecords].sort((a, b) => {
    if (a.always_prepared && !b.always_prepared) return -1;
    if (!a.always_prepared && b.always_prepared) return 1;
    return 0;
  });

  // Fill slots with prepared spells
  for (const record of sorted) {
    slots.push({
      spell_id: record.spell_id,
      alwaysPrepared: record.always_prepared,
    });
  }

  // Fill remaining slots with empty slots
  while (slots.length < actualMax) {
    slots.push({
      spell_id: null,
      alwaysPrepared: false,
    });
  }

  return slots;
}

/**
 * Compute spell information for a character based on their classes and levels
 */
export async function computeSpells(
  db: SQL,
  ruleset: any,
  characterId: string,
  classes: CharacterClass[],
  abilityScores: Record<AbilityType, AbilityScore>,
  proficiencyBonus: number
): Promise<SpellInfoForClass[]> {
  // Fetch wizard spellbook (char_spells_learned)
  const learnedSpellIds = await getCurrentLearnedSpells(db, characterId);
  const wizardSpellbookSpells = learnedSpellIds
    .map(spellId => spells.find(s => s.id === spellId))
    .filter(Boolean) as Spell[];

  // Fetch all prepared spell records (char_spells_prepared)
  const allPreparedRecords = await getPreparedSpells(db, characterId);

  // Compute spell info for each class
  const results: SpellInfoForClass[] = [];

  for (const charClass of classes) {
    const classSpellInfo = await computeSpellsForClass(
      ruleset,
      charClass,
      abilityScores,
      proficiencyBonus,
      wizardSpellbookSpells,
      allPreparedRecords
    );

    if (classSpellInfo) {
      results.push(classSpellInfo);
    }
  }

  return results;
}

/**
 * Get the highest spell level a character can cast based on their class and level
 * Uses the slot progression tables from dnd.ts
 */
export function getMaxSpellLevel(ruleset: any, classDef: ClassDef, classLevel: number): number {
  if (!classDef.spellcasting.enabled) {
    return 0;
  }

  // For other casters, get slots and find highest level with slots > 0
  const slots = ruleset.getSlotsFor(classDef.spellcasting.kind, classLevel);
  return Math.max(...slots)
}
