import type { SQL } from "bun";
import { getCurrentLearnedSpells } from "@src/db/char_spells_learned";
import { getCurrentlyPrepared as getPreparedSpells } from "@src/db/char_spells_prepared";
import { Classes, maxCantripsKnown, maxSpellsKnown, getSlotsFor, getWarlockPactAt, type ClassNameType, type AbilityType, type ClassDef } from "@src/lib/dnd";
import { spells, type Spell } from "@src/lib/dnd/spells";
import type { CharacterClass, AbilityScore } from "@src/services/computeCharacter";

export interface SpellInfoForClass {
  class: ClassNameType;
  level: number;

  // Spellcasting stats (merged from SpellcastingStats)
  ability: AbilityType;
  spellAttackBonus: number;
  spellSaveDC: number;
  spellcastingType: "known" | "prepared" | "none";
  maxSpellLevel: number;  // Highest spell level this class can cast

  // Cantrips (both known and prepared casters have these)
  cantrips: string[];  // Spell IDs
  maxCantrips: number;

  // For "known" casters (Bard, Sorcerer, Warlock, Ranger, EK, AT)
  knownSpells: string[];
  maxSpellsKnown: number;

  // For "prepared" casters (Cleric, Druid, Paladin, Wizard)
  preparedSpells: string[];
  maxSpellsPrepared: number;

  // Wizard special case: has both spellbook (known) AND prepared
  spellbookSpells: string[];  // Only for wizards
}

/**
 * Compute spell information for a single class
 */
async function computeSpellsForClass(
  charClass: CharacterClass,
  abilityScores: Record<AbilityType, AbilityScore>,
  proficiencyBonus: number,
  allLearnedSpells: Spell[],
  allPreparedSpells: Spell[]
): Promise<SpellInfoForClass | null> {
  const classDef = Classes[charClass.class];

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
  const spellcastingType = classDef.spellcasting.spellcastingType;

  // Calculate spell attack bonus and save DC
  const spellAttackBonus = proficiencyBonus + abilityModifier;
  const spellSaveDC = 8 + proficiencyBonus + abilityModifier;

  // Calculate max spell level this class can cast
  const maxSpellLevel = getMaxSpellLevel(classDef, charClass.level);

  // Filter learned spells to those available to this class
  const classLearnedSpells = allLearnedSpells.filter(
    ls => ls.classes.includes(charClass.class));

  // Separate cantrips from leveled spells
  const cantrips = classLearnedSpells.filter(
    ls => ls.level === 0)
  const knownSpells = classLearnedSpells.filter(
    ls => ls.level > 0);

  // Calculate maximums
  const maxCantrips = maxCantripsKnown(charClass.class, charClass.level);

  const result: SpellInfoForClass = {
    class: charClass.class,
    level: charClass.level,
    ability,
    spellAttackBonus,
    spellSaveDC,
    spellcastingType,
    maxSpellLevel,
    cantrips: cantrips.map(s => s.id),
    maxCantrips,

    knownSpells: [],
    maxSpellsKnown: 0,
    preparedSpells: [],
    maxSpellsPrepared: 0,
    spellbookSpells: [],
  };

  // Handle based on spellcasting type
  if (spellcastingType === "known") {
    result.knownSpells = knownSpells.map(s => s.id);
    result.maxSpellsKnown = maxSpellsKnown(charClass.class, charClass.level) || 0;

  // For prepared casters
  } else if (spellcastingType === "prepared") {
    result.preparedSpells = allPreparedSpells.filter(
      s => s.classes.includes(charClass.class)).map(s => s.id);

    result.maxSpellsPrepared = Math.max(1, abilityModifier + charClass.level);

    // Wizard special case: has spellbook
    if (charClass.class === "wizard") {
      result.spellbookSpells = knownSpells.map(s => s.id);
    }
  }

  return result;
}

/**
 * Compute spell information for a character based on their classes and levels
 */
export async function computeSpells(
  db: SQL,
  characterId: string,
  classes: CharacterClass[],
  abilityScores: Record<AbilityType, AbilityScore>,
  proficiencyBonus: number
): Promise<SpellInfoForClass[]> {
  // Fetch all spells once for efficiency
  const learnedSpellIds = await getCurrentLearnedSpells(db, characterId);
  const allLearnedSpellObjs = learnedSpellIds
    .map(spellId => spells.find(s => s.id === spellId))
    .filter(Boolean) as Spell[];

  const allPreparedSpells = await getPreparedSpells(db, characterId);
  const allPreparedSpellObjs = allPreparedSpells
    .map(ps => spells.find(s => s.id === ps.spell_id))
    .filter(Boolean) as Spell[];

  // Compute spell info for each class
  const results: SpellInfoForClass[] = [];

  for (const charClass of classes) {
    const classSpellInfo = await computeSpellsForClass(
      charClass,
      abilityScores,
      proficiencyBonus,
      allLearnedSpellObjs,
      allPreparedSpellObjs
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
export function getMaxSpellLevel(classDef: ClassDef, classLevel: number): number {
  if (!classDef.spellcasting.enabled) {
    return 0;
  }

  const kind = classDef.spellcasting.kind;

  // For pact magic (warlock), use pact magic table
  if (kind === "pact") {
    const pactRow = getWarlockPactAt(classLevel);
    return pactRow.slotLevel;
  }

  // For other casters, get slots and find highest level with slots > 0
  const slots = getSlotsFor(kind, classLevel);

  // Check from level 9 down to 1
  for (let level = 9; level >= 1; level--) {
    if (slots[level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9]) {
      return level;
    }
  }

  return 0;
}
