import type { SQL } from "bun";
import { findById, type Character } from "@src/db/characters";
import { findByCharacterId } from "@src/db/char_levels";
import { Races, type SizeType } from "@src/lib/dnd";

export interface CharacterClass {
  class: string;
  level: number;
  subclass: string | null;
}

export interface ComputedCharacter extends Character {
  classes: CharacterClass[];
  totalLevel: number;
  size: SizeType;
  speed: number;
  proficiencyBonus: number;
}

export async function computeCharacter(db: SQL, characterId: string): Promise<ComputedCharacter | null> {
  const character = await findById(db, characterId);
  if (!character) return null;

  const levels = await findByCharacterId(db, characterId);

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

  return {
    ...character,
    classes,
    totalLevel,
    size: race.size,
    speed: race.speed,
    proficiencyBonus,
  };
}
