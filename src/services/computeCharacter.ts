import type { SQL } from "bun";
import { findById, type Character } from "@src/db/characters";
import { findByCharacterId } from "@src/db/char_levels";
import { currentByCharacterId as getCurrentAbilities } from "@src/db/char_abilities";
import { currentByCharacterId as getCurrentSkills } from "@src/db/char_skills";
import { Races, Skills, SkillAbilities, type SizeType, type AbilityType, type SkillType, type ProficiencyLevel } from "@src/lib/dnd";

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
}

export async function computeCharacter(db: SQL, characterId: string): Promise<ComputedCharacter | null> {
  const character = await findById(db, characterId);
  if (!character) return null;

  const levels = await findByCharacterId(db, characterId);
  const currentAbilityScores = await getCurrentAbilities(db, characterId);
  const currentSkills = await getCurrentSkills(db, characterId);

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

  // Calculate modifier and saving throw for each ability
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

  const computeAbilityScore = (ability: AbilityType, score: number, proficient: boolean): AbilityScore => {
    const modifier = calculateModifier(score);
    return {
      score,
      modifier,
      savingThrow: modifier + (proficient ? proficiencyBonus : 0),
      proficient,
    };
  };

  const abilityScores: Record<AbilityType, AbilityScore> = {
    strength: computeAbilityScore('strength', currentAbilityScores.strength.score, currentAbilityScores.strength.proficient),
    dexterity: computeAbilityScore('dexterity', currentAbilityScores.dexterity.score, currentAbilityScores.dexterity.proficient),
    constitution: computeAbilityScore('constitution', currentAbilityScores.constitution.score, currentAbilityScores.constitution.proficient),
    intelligence: computeAbilityScore('intelligence', currentAbilityScores.intelligence.score, currentAbilityScores.intelligence.proficient),
    wisdom: computeAbilityScore('wisdom', currentAbilityScores.wisdom.score, currentAbilityScores.wisdom.proficient),
    charisma: computeAbilityScore('charisma', currentAbilityScores.charisma.score, currentAbilityScores.charisma.proficient),
  };

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
  };
}
