import type { SQL } from "bun";
import { findById, type Character } from "@src/db/characters";
import { findByCharacterId } from "@src/db/char_levels";
import { currentByCharacterId as getCurrentAbilities } from "@src/db/char_abilities";
import { Races, Classes, type SizeType, type AbilityType } from "@src/lib/dnd";

export interface CharacterClass {
  class: string;
  level: number;
  subclass: string | null;
}

export interface AbilityScore {
  score: number;
  modifier: number;
  savingThrow: number;
  proficient: boolean;
}

export interface ComputedCharacter extends Character {
  classes: CharacterClass[];
  totalLevel: number;
  size: SizeType;
  speed: number;
  proficiencyBonus: number;
  abilityScores: Record<AbilityType, AbilityScore>;
  armorClass: number;
  initiative: number;
}

export async function computeCharacter(db: SQL, characterId: string): Promise<ComputedCharacter | null> {
  const character = await findById(db, characterId);
  if (!character) return null;

  const levels = await findByCharacterId(db, characterId);
  const currentAbilityScores = await getCurrentAbilities(db, characterId);

  // Sum levels by class
  const classMap = new Map<string, { level: number; subclass: string | null }>();

  for (const level of levels) {
    const existing = classMap.get(level.class);
    if (existing) {
      existing.level += level.level;
      // Keep the most recent subclass (non-null)
      if (level.subclass) {
        existing.subclass = level.subclass;
      }
    } else {
      classMap.set(level.class, {
        level: level.level,
        subclass: level.subclass,
      });
    }
  }

  const classes: CharacterClass[] = Array.from(classMap.entries()).map(([className, data]) => ({
    class: className,
    level: data.level,
    subclass: data.subclass,
  }));

  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);
  const proficiencyBonus = Math.floor((totalLevel - 1) / 4) + 2;

  const race = Races.find(r => r.name === character.race)!;
  const subrace = race.subraces?.find(sr => sr.name === character.subrace);

  // Get all saving throw proficiencies from all classes
  const savingThrowProficiencies = new Set<AbilityType>();
  for (const charClass of classes) {
    const classDef = Classes.find(c => c.name === charClass.class);
    if (classDef) {
      classDef.savingThrows.forEach(st => savingThrowProficiencies.add(st));
    }
  }

  // Calculate modifier and saving throw for each ability
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

  const computeAbilityScore = (ability: AbilityType, score: number): AbilityScore => {
    const proficient = savingThrowProficiencies.has(ability);
    const modifier = calculateModifier(score);
    return {
      score,
      modifier,
      savingThrow: modifier + (proficient ? proficiencyBonus : 0),
      proficient,
    };
  };

  const abilityScores: Record<AbilityType, AbilityScore> = {
    strength: computeAbilityScore('strength', currentAbilityScores.strength),
    dexterity: computeAbilityScore('dexterity', currentAbilityScores.dexterity),
    constitution: computeAbilityScore('constitution', currentAbilityScores.constitution),
    intelligence: computeAbilityScore('intelligence', currentAbilityScores.intelligence),
    wisdom: computeAbilityScore('wisdom', currentAbilityScores.wisdom),
    charisma: computeAbilityScore('charisma', currentAbilityScores.charisma),
  };

  // Initiative is DEX modifier
  const initiative = abilityScores.dexterity.modifier;

  // Armor Class (unarmored: 10 + DEX modifier)
  const armorClass = 10 + abilityScores.dexterity.modifier;

  return {
    ...character,
    classes,
    totalLevel,
    size: race.size,
    speed: race.speed,
    proficiencyBonus,
    abilityScores,
    armorClass,
    initiative,
  };
}
