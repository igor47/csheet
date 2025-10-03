import type { SQL } from "bun";
import { findById, type Character } from "@src/db/characters";
import { getCurrentLevels, findByCharacterId as getAllLevels } from "@src/db/char_levels";
import { currentByCharacterId as getCurrentAbilities } from "@src/db/char_abilities";
import { currentByCharacterId as getCurrentSkills } from "@src/db/char_skills";
import { getHpDelta } from "@src/db/char_hp";
import { findByCharacterId as findHitDiceChanges } from "@src/db/char_hit_dice";
import { Races, Classes, Skills, SkillAbilities, type SizeType, type AbilityType, type SkillType, type ProficiencyLevel, type HitDieType, Abilities } from "@src/lib/dnd";

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

export interface SkillScore {
  modifier: number;
  proficiency: ProficiencyLevel;
  ability: AbilityType;
}

export interface ComputedCharacter extends Character {
  classes: CharacterClass[];
  totalLevel: number;
  size: SizeType;
  speed: number;
  proficiencyBonus: number;
  abilityScores: Record<AbilityType, AbilityScore>;
  skills: Record<SkillType, SkillScore>;
  armorClass: number;
  initiative: number;
  maxHitPoints: number;
  currentHP: number;
  hitDice: HitDieType[];
  availableHitDice: HitDieType[];
}

export async function computeCharacter(db: SQL, characterId: string): Promise<ComputedCharacter | null> {
  const character = await findById(db, characterId);
  if (!character) return null;

  const levels = await getCurrentLevels(db, characterId);
  const currentAbilityScores = await getCurrentAbilities(db, characterId);
  const currentSkills = await getCurrentSkills(db, characterId);
  const hpDelta = await getHpDelta(db, characterId);
  const hitDiceChanges = await findHitDiceChanges(db, characterId);

  // Get class information from current levels
  const classes: CharacterClass[] = levels.map(level => ({
    class: level.class,
    level: level.level,
    subclass: level.subclass,
  }));

  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);
  const proficiencyBonus = Math.floor((totalLevel - 1) / 4) + 2;

  const race = Races.find(r => r.name === character.race)!;

  // Calculate modifier and saving throw for each ability
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

  const computeAbilityScore = (score: number, proficient: boolean): AbilityScore => {
    const modifier = calculateModifier(score);
    return {
      score,
      modifier,
      savingThrow: modifier + (proficient ? proficiencyBonus : 0),
      proficient,
    };
  };

  const abilityScores = Object.fromEntries(Abilities.map(ability => (
    [ability, computeAbilityScore(currentAbilityScores[ability]!.score, currentAbilityScores[ability]!.proficient)]
  ))) as Record<AbilityType, AbilityScore>;

  // Compute skill modifiers
  const computeSkillModifier = (skill: SkillType, proficiency: ProficiencyLevel): number => {
    const ability = SkillAbilities[skill];
    const abilityModifier = abilityScores[ability].modifier;

    switch (proficiency) {
      case 'none':
        return abilityModifier;
      case 'half':
        return abilityModifier + Math.floor(proficiencyBonus / 2);
      case 'proficient':
        return abilityModifier + proficiencyBonus;
      case 'expert':
        return abilityModifier + (proficiencyBonus * 2);
    }
  };

  const skills: Record<SkillType, SkillScore> = {} as Record<SkillType, SkillScore>;
  for (const skill of Skills) {
    const proficiency = currentSkills[skill]?.proficiency || 'none';
    const ability = SkillAbilities[skill];
    skills[skill] = {
      modifier: computeSkillModifier(skill, proficiency),
      proficiency,
      ability,
    };
  }

  // Compute hit points and hit dice
  let maxHitPoints = 0;
  const hitDice: HitDieType[] = [];

  const allLevels = await getAllLevels(db, characterId);
  for (const level of allLevels) {
    const classDef = Classes.find(c => c.name === level.class)!;
    hitDice.push(classDef.hitDie);
    maxHitPoints += level.hit_die_roll;
  }

  // Add CON modifier per total level
  const conModifier = abilityScores.constitution.modifier;
  maxHitPoints += conModifier * totalLevel;

  // Compute current HP
  const currentHP = maxHitPoints + hpDelta;

  // Compute available hit dice by applying uses and restores
  const availableHitDice = [...hitDice];
  for (const change of hitDiceChanges) {
    if (change.action === 'use') {
      // Remove one die of this type
      const index = availableHitDice.indexOf(change.die_value as HitDieType);
      if (index !== -1) {
        availableHitDice.splice(index, 1);
      }
    } else if (change.action === 'restore') {
      // Add one die of this type
      availableHitDice.push(change.die_value as HitDieType);
    }
  }

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
    skills,
    armorClass,
    initiative,
    maxHitPoints,
    currentHP,
    hitDice,
    availableHitDice,
  };
}
