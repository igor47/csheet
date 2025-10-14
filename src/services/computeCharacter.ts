import { currentByCharacterId as getCurrentAbilities } from "@src/db/char_abilities"
import { findByCharacterId as findHitDiceChanges } from "@src/db/char_hit_dice"
import { getHpDelta } from "@src/db/char_hp"
import { findByCharacterId as getAllLevels, getCurrentLevels } from "@src/db/char_levels"
import { currentByCharacterId as getCurrentSkills } from "@src/db/char_skills"
import { findByCharacterId as findSpellSlotChanges } from "@src/db/char_spell_slots"
import { type Character, findById } from "@src/db/characters"
import {
  Abilities,
  type AbilityType,
  Classes,
  type ClassNameType,
  getSlotsFor,
  type HitDieType,
  type ProficiencyLevel,
  Races,
  type SizeType,
  SkillAbilities,
  Skills,
  type SkillType,
  type SpellLevelType,
  type SpellSlotsType,
} from "@src/lib/dnd"
import { computeSpells, type SpellInfoForClass } from "@src/services/computeSpells"
import type { SQL } from "bun"

export interface CharacterClass {
  class: ClassNameType
  level: number
  subclass: string | null
}

export interface AbilityScore {
  score: number
  modifier: number
  savingThrow: number
  proficient: boolean
}

export interface SkillScore {
  modifier: number
  proficiency: ProficiencyLevel
  ability: AbilityType
}

export interface ComputedCharacter extends Character {
  classes: CharacterClass[]
  totalLevel: number
  size: SizeType
  speed: number
  proficiencyBonus: number
  abilityScores: Record<AbilityType, AbilityScore>
  skills: Record<SkillType, SkillScore>
  armorClass: number
  initiative: number
  passivePerception: number
  maxHitPoints: number
  currentHP: number
  hitDice: HitDieType[]
  availableHitDice: HitDieType[]
  spellSlots: SpellSlotsType | null
  availableSpellSlots: SpellSlotsType | null
  pactMagicSlots: SpellSlotsType | null
  spells: SpellInfoForClass[]
}

export async function computeCharacter(
  db: SQL,
  characterId: string
): Promise<ComputedCharacter | null> {
  const character = await findById(db, characterId)
  if (!character) return null

  const levels = await getCurrentLevels(db, characterId)
  const currentAbilityScores = await getCurrentAbilities(db, characterId)
  const currentSkills = await getCurrentSkills(db, characterId)
  const hpDelta = await getHpDelta(db, characterId)
  const hitDiceChanges = await findHitDiceChanges(db, characterId)
  const spellSlotChanges = await findSpellSlotChanges(db, characterId)

  // Get class information from current levels
  const classes: CharacterClass[] = levels.map((level) => ({
    class: level.class,
    level: level.level,
    subclass: level.subclass,
  }))

  const totalLevel = classes.reduce((sum, c) => sum + c.level, 0)
  const proficiencyBonus = Math.floor((totalLevel - 1) / 4) + 2

  const race = Races.find((r) => r.name === character.race)!

  // Calculate modifier and saving throw for each ability
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2)

  const computeAbilityScore = (score: number, proficient: boolean): AbilityScore => {
    const modifier = calculateModifier(score)
    return {
      score,
      modifier,
      savingThrow: modifier + (proficient ? proficiencyBonus : 0),
      proficient,
    }
  }

  const abilityScores = Object.fromEntries(
    Abilities.map((ability) => [
      ability,
      computeAbilityScore(
        currentAbilityScores[ability]!.score,
        currentAbilityScores[ability]!.proficient
      ),
    ])
  ) as Record<AbilityType, AbilityScore>

  // Compute skill modifiers
  const computeSkillModifier = (skill: SkillType, proficiency: ProficiencyLevel): number => {
    const ability = SkillAbilities[skill]
    const abilityModifier = abilityScores[ability].modifier

    switch (proficiency) {
      case "none":
        return abilityModifier
      case "half":
        return abilityModifier + Math.floor(proficiencyBonus / 2)
      case "proficient":
        return abilityModifier + proficiencyBonus
      case "expert":
        return abilityModifier + proficiencyBonus * 2
    }
  }

  const skills: Record<SkillType, SkillScore> = {} as Record<SkillType, SkillScore>
  for (const skill of Skills) {
    const proficiency = currentSkills[skill]?.proficiency || "none"
    const ability = SkillAbilities[skill]
    skills[skill] = {
      modifier: computeSkillModifier(skill, proficiency),
      proficiency,
      ability,
    }
  }

  // Compute hit points and hit dice
  let maxHitPoints = 0
  const hitDice: HitDieType[] = []

  const allLevels = await getAllLevels(db, characterId)
  for (const level of allLevels) {
    const classDef = Classes[level.class]
    hitDice.push(classDef.hitDie)
    maxHitPoints += level.hit_die_roll
  }

  // Add CON modifier per total level
  const conModifier = abilityScores.constitution.modifier
  maxHitPoints += conModifier * totalLevel

  // Compute current HP
  const currentHP = maxHitPoints + hpDelta

  // Compute available hit dice by applying uses and restores
  const availableHitDice = [...hitDice]
  for (const change of hitDiceChanges) {
    if (change.action === "use") {
      // Remove one die of this type
      const index = availableHitDice.indexOf(change.die_value as HitDieType)
      if (index !== -1) {
        availableHitDice.splice(index, 1)
      }
    } else if (change.action === "restore") {
      // Add one die of this type
      availableHitDice.push(change.die_value as HitDieType)
    }
  }

  // Initiative is DEX modifier
  const initiative = abilityScores.dexterity.modifier

  // Armor Class (unarmored: 10 + DEX modifier)
  const armorClass = 10 + abilityScores.dexterity.modifier

  // Passive Perception is 10 + Perception skill modifier
  const passivePerception = 10 + skills.perception.modifier

  // Compute spell slots
  let spellSlots: SpellSlotsType | null = null
  let pactMagicSlots: SpellSlotsType | null = null

  // Calculate caster levels for multiclassing
  let fullCasterLevel = 0
  let halfCasterLevel = 0
  let thirdCasterLevel = 0

  for (const charClass of classes) {
    const classDef = Classes[charClass.class]
    if (!classDef.spellcasting.enabled) continue

    const spellcasting = classDef.spellcasting

    // Check if spellcasting is subclass-specific
    if (spellcasting.subclasses && spellcasting.subclasses.length > 0) {
      // Only count if character has the right subclass
      if (!charClass.subclass || !spellcasting.subclasses.includes(charClass.subclass)) {
        continue
      }
    }

    // Add to appropriate caster level
    if (spellcasting.kind === "pact") {
      // Warlock pact magic is separate
      pactMagicSlots = getSlotsFor("pact", charClass.level)
    } else if (spellcasting.kind === "full") {
      fullCasterLevel += charClass.level
    } else if (spellcasting.kind === "half") {
      halfCasterLevel += charClass.level
    } else if (spellcasting.kind === "third") {
      thirdCasterLevel += charClass.level
    }
  }

  // Determine spell slots
  // For single-class casters, use actual class level
  // For multiclassing, use effective caster level with highest tier progression
  const casterTypeCount =
    (fullCasterLevel > 0 ? 1 : 0) + (halfCasterLevel > 0 ? 1 : 0) + (thirdCasterLevel > 0 ? 1 : 0)

  if (casterTypeCount === 1) {
    // Single caster type - use actual class level
    if (fullCasterLevel > 0) {
      spellSlots = getSlotsFor("full", fullCasterLevel)
    } else if (halfCasterLevel > 0) {
      spellSlots = getSlotsFor("half", halfCasterLevel)
    } else if (thirdCasterLevel > 0) {
      spellSlots = getSlotsFor("third", thirdCasterLevel)
    }
  } else if (casterTypeCount > 1) {
    // Multiclassing - use effective caster level with highest tier progression
    const effectiveCasterLevel =
      fullCasterLevel + Math.floor(halfCasterLevel / 2) + Math.floor(thirdCasterLevel / 3)

    if (fullCasterLevel > 0) {
      spellSlots = getSlotsFor("full", effectiveCasterLevel)
    } else if (halfCasterLevel > 0) {
      spellSlots = getSlotsFor("half", effectiveCasterLevel)
    } else if (thirdCasterLevel > 0) {
      spellSlots = getSlotsFor("third", effectiveCasterLevel)
    }
  }

  // Compute available spell slots by applying uses and restores
  let availableSpellSlots: SpellSlotsType | null = null
  if (spellSlots) {
    // Start with a copy of base spell slots
    availableSpellSlots = [...spellSlots]

    // Apply each spell slot change
    for (const change of spellSlotChanges) {
      const level = change.slot_level as SpellLevelType

      // use a slot if available
      if (change.action === "use") {
        const idx = availableSpellSlots.indexOf(level)
        if (idx !== -1) {
          availableSpellSlots.splice(idx, 1)
        }

        // restore a slot, up to the max for that level
      } else if (change.action === "restore") {
        const maxSlots = spellSlots.filter((s) => s === level).length
        const currentCount = availableSpellSlots.filter((s) => s === level).length
        if (currentCount < maxSlots) availableSpellSlots.push(level)
      }
    }
  }

  // Compute spell information (includes spellcasting stats per class)
  const spells = await computeSpells(db, characterId, classes, abilityScores, proficiencyBonus)

  const char = {
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
    passivePerception,
    maxHitPoints,
    currentHP,
    hitDice,
    availableHitDice,
    spellSlots,
    availableSpellSlots,
    pactMagicSlots,
    spells,
  }

  return char
}
