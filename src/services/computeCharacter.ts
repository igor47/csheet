import { currentByCharacterId as getCurrentAbilities } from "@src/db/char_abilities"
import { getCurrentSeenBeasts } from "@src/db/char_beasts_seen"
import { type CurrentCoins, currentByCharacterId as getCurrentCoins } from "@src/db/char_coins"
import { findSinceLastUp as findDeathSaveEvents } from "@src/db/char_death_saves"
import { findByCharacterId as findHitDiceChanges } from "@src/db/char_hit_dice"
import { getHpDelta } from "@src/db/char_hp"
import { findByCharacterId as getAllLevels, getCurrentLevels } from "@src/db/char_levels"
import {
  type CurrentProficiency,
  findByCharacterId as findProficiencyChanges,
} from "@src/db/char_proficiencies"
import { currentByCharacterId as getCurrentSkills } from "@src/db/char_skills"
import { findByCharacterId as findSpellSlotChanges } from "@src/db/char_spell_slots"
import { type CharTrait, findByCharacterId as findTraits } from "@src/db/char_traits"
import { findUnrecovered as findUnrecoveredWildShapeUses } from "@src/db/char_wild_shape_uses"
import { type CharacterAvatar, findByCharacterId as findAvatars } from "@src/db/character_avatars"
import { type Character, findById } from "@src/db/characters"
import type { ItemDamage } from "@src/db/item_damage"
import {
  Abilities,
  type AbilityType,
  type ClassNameType,
  getRuleset,
  type HitDieType,
  type ItemEffectTarget,
  type ProficiencyLevel,
  type SizeType,
  SkillAbilities,
  Skills,
  type SkillType,
  type SpellLevelType,
  type SpellSlotsType,
} from "@src/lib/dnd"
import { type Beast, getBeastById } from "@src/lib/dnd/beasts"
import { computeHitPoints, type DeathSaves } from "@src/lib/dnd/deathSaves"
import {
  currentProficiencies,
  formatProficiencyName,
  identifyWeapon,
  isMonkWeapon,
  isProficientWithWeapon,
  requiredArmorProficiency,
} from "@src/lib/dnd/proficiencies"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import {
  getKnownFormsLimit,
  getWildShapeCRLimit,
  getWildShapeUses,
  type WildShapeLimits,
} from "@src/lib/dnd/wildShape"
import {
  computeCharacterItems,
  type EquippedComputedItem,
  type ItemEffect,
} from "@src/services/computeCharacterItems"
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

export interface WeaponAttack {
  itemId: string
  name: string
  wielded: boolean
  /** The standard weapon the item is, e.g. "longsword"; null for custom weapons */
  baseWeapon: string | null
  proficient: boolean
  ability: "strength" | "dexterity"
  /** Total bonus to hit: ability modifier, proficiency bonus if proficient, and item effects */
  attackBonus: number
  /** How the attack bonus adds up, e.g. ["STR +3", "proficiency +2", "Ring of Aim +1"] */
  attackBonusParts: string[]
  /** Damage with the ability modifier and item effects added, e.g. "1d8 +3 slashing" */
  damage: string[]
  /** How each damage adds up, e.g. "1d8 + 3 STR + 1 bonus slashing" */
  damageBreakdown: string[]
}

export interface ItemEffectInfo {
  itemName: string
  effectDescription: string
}

export interface CharacterAvatarWithUrl extends CharacterAvatar {
  uploadUrl: string
}

export interface OngoingTransformation {
  id: string
  beastId: string
  startedAt: Date
  currentBeastHp: number
}

export interface WildShapeInfo {
  limits: WildShapeLimits
  maxUses: number
  usesAvailable: number
  unrecoveredCount: number
  knownForms: number | null // null for SRD 5.1 (unlimited), 4/6/8 for SRD 5.2
  beasts: string[]
  ongoingTransformation: OngoingTransformation | null
  currentBeast: Beast | null // Full beast data when transformed
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
  currentHP: number // never below 0
  deathSaves: DeathSaves | null // Populated at 0 HP: dying, stable or dead
  hitDice: HitDieType[]
  availableHitDice: HitDieType[]
  spellSlots: SpellSlotsType
  availableSpellSlots: SpellSlotsType
  pactMagicSlots: SpellSlotsType | null
  spells: SpellInfoForClass[]
  traits: CharTrait[]
  proficiencies: CurrentProficiency[]
  coins: CurrentCoins | null
  equippedItems: EquippedComputedItem[]
  weaponAttacks: WeaponAttack[]
  /** Penalties for wearing armor or wielding a shield the character isn't proficient with */
  armorWarnings: string[]
  /** Caveats on the armor class: an untrained shield that adds nothing, untrained armor */
  armorClassNotes: string[]
  affectedAttributes: Record<string, ItemEffectInfo[]>
  avatars: CharacterAvatarWithUrl[]
  wildShape: WildShapeInfo | null // Populated if character can use Wild Shape
}
// Calculate modifier and saving throw for each ability
const calculateModifier = (score: number) => Math.floor((score - 10) / 2)

function computeAbilityScore(
  score: number,
  proficient: boolean,
  proficiencyBonus: number
): AbilityScore {
  const modifier = calculateModifier(score)
  return {
    score,
    modifier,
    savingThrow: modifier + (proficient ? proficiencyBonus : 0),
    proficient,
  }
}

function computeSkillModifier(
  skill: SkillType,
  proficiency: ProficiencyLevel,
  proficiencyBonus: number,
  abilityScores: ComputedCharacter["abilityScores"]
): number {
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

const fmtBonus = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
const fmtTerm = (n: number) => (n >= 0 ? `+ ${n}` : `- ${-n}`)

// Items whose "attack" and "damage" effects also count for weapon attacks: things worn on the
// body, like a ring or bracers. A wand's or staff's +attack is for spell attacks, and potions,
// scrolls, and gear aren't held while attacking, so their effects don't count
const WEAPON_BOOSTING_CATEGORIES = ["jewelry", "clothing", "armor"]

const PHYSICAL_DAMAGE: string[] = ["bludgeoning", "piercing", "slashing"]

/**
 * The attack bonus and damage of a weapon
 * Melee weapons use STR, ranged weapons DEX, and finesse weapons (and a monk's Martial Arts
 * weapons) the better of the two
 * Item effects on "attack" and "damage" count when they're active and come from this weapon or
 * from a worn item (a ring, say), so one weapon's bonus doesn't leak to another
 * The ability modifier and damage effects add to the weapon's main damage (and its two-handed
 * version), not to extra damage like a flame tongue's fire
 */
function computeWeaponAttack(
  item: EquippedComputedItem,
  ruleset: RulesetId,
  isMonk: boolean,
  weaponProficiencies: string[],
  abilityScores: Record<AbilityType, AbilityScore>,
  proficiencyBonus: number,
  activeEffects: { effect: ItemEffect; item: EquippedComputedItem }[]
): WeaponAttack {
  const weapon = identifyWeapon(ruleset, item)
  const effects = activeEffects.filter(
    (e) => e.item.id === item.id || WEAPON_BOOSTING_CATEGORIES.includes(e.item.category)
  )

  const proficient =
    isProficientWithWeapon(weaponProficiencies, weapon, item.name) ||
    effects.some((e) => e.effect.target === "attack" && e.effect.op === "proficiency")

  const str = abilityScores.strength.modifier
  const dex = abilityScores.dexterity.modifier
  let ability: WeaponAttack["ability"] = weapon.ranged ? "dexterity" : "strength"
  if (weapon.finesse || item.finesse || (isMonk && isMonkWeapon(ruleset, weapon))) {
    ability = dex > str ? "dexterity" : "strength"
  }
  const abilityMod = ability === "dexterity" ? dex : str
  const abilityAbbr = ability.slice(0, 3).toUpperCase()

  const attackBonusParts = [`${abilityAbbr} ${fmtBonus(abilityMod)}`]
  let attackBonus = abilityMod
  if (proficient) {
    attackBonus += proficiencyBonus
    attackBonusParts.push(`proficiency ${fmtBonus(proficiencyBonus)}`)
  }

  const damageEffects: { name: string; value: number }[] = []
  for (const { effect, item: source } of effects) {
    if (effect.op !== "add" || effect.value === null) continue
    if (effect.target === "attack") {
      attackBonus += effect.value
      attackBonusParts.push(`${source.name} ${fmtBonus(effect.value)}`)
    } else if (effect.target === "damage") {
      damageEffects.push({ name: source.name, value: effect.value })
    }
  }

  // the main damage is the first one-handed damage; versatile damage is its two-handed version
  // the main damage is the weapon's own physical damage (not a rider like a flame tongue's fire),
  // one-handed if it has that; versatile damage of the same type is its two-handed version
  const physical = (d: ItemDamage) => PHYSICAL_DAMAGE.includes(d.type)
  const primary =
    item.damage.find((d) => !d.versatile && physical(d)) ??
    item.damage.find((d) => !d.versatile) ??
    item.damage.find(physical) ??
    item.damage[0]
  const damage: string[] = []
  const damageBreakdown: string[] = []
  for (const d of item.damage) {
    const dice = `${d.dice.length}d${d.dice[0]}`
    const terms: { value: number; label: string }[] = []
    if (d === primary || (d.versatile && d.type === primary?.type)) {
      terms.push({ value: abilityMod, label: abilityAbbr })
      for (const e of damageEffects) terms.push({ value: e.value, label: `from ${e.name}` })
    }
    if (d.flat_bonus) terms.push({ value: d.flat_bonus, label: "bonus" })

    const total = terms.reduce((sum, t) => sum + t.value, 0)
    const twoHanded = d.versatile ? " (2-handed)" : ""
    damage.push(`${dice}${total !== 0 ? ` ${fmtBonus(total)}` : ""} ${d.type}${twoHanded}`)
    damageBreakdown.push(
      `${dice}${terms
        .filter((t) => t.value !== 0)
        .map((t) => ` ${fmtTerm(t.value)} ${t.label}`)
        .join("")} ${d.type}${twoHanded}`
    )
  }

  return {
    itemId: item.id,
    name: item.name,
    wielded: item.wielded,
    baseWeapon: weapon.baseWeapon,
    proficient,
    ability,
    attackBonus,
    attackBonusParts,
    damage,
    damageBreakdown,
  }
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
  const currentCoins = await getCurrentCoins(db, characterId)
  const hpDelta = await getHpDelta(db, characterId)
  const deathSaveEvents = await findDeathSaveEvents(db, characterId)
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

  const ruleset = getRuleset(character.ruleset)
  const species = ruleset.species.find((r) => r.name === character.species)!

  // Get equipped items (includes isActive field on effects)
  const equippedItems = await computeCharacterItems(db, characterId)

  // Collect active effects using the precomputed isActive field
  const activeEffects: { effect: ItemEffect; item: EquippedComputedItem }[] = []
  const affectedAttributes: Record<string, ItemEffectInfo[]> = {}

  for (const item of equippedItems) {
    for (const effect of item.effects) {
      if (effect.isActive) {
        activeEffects.push({ effect, item })

        // Build affectedAttributes map for UI highlighting
        const target = effect.target
        if (!affectedAttributes[target]) {
          affectedAttributes[target] = []
        }

        // Create human-readable effect description
        let effectDescription = ""
        if (effect.op === "add" && effect.value !== null) {
          effectDescription = `${effect.value >= 0 ? "+" : ""}${effect.value}`
        } else if (effect.op === "set" && effect.value !== null) {
          effectDescription = `Set to ${effect.value}`
        } else if (effect.op === "proficiency") {
          effectDescription = "Grant proficiency"
        } else if (effect.op === "expertise") {
          effectDescription = "Grant expertise"
        } else if (effect.op === "advantage") {
          effectDescription = "Grant advantage"
        } else if (effect.op === "disadvantage") {
          effectDescription = "Grant disadvantage"
        }

        affectedAttributes[target].push({
          itemName: item.name,
          effectDescription,
        })
      }
    }
  }

  // apply item effects that modify ability scores before computing final scores
  for (const { effect } of activeEffects) {
    if ((Abilities as readonly ItemEffectTarget[]).includes(effect.target)) {
      const ability = effect.target as AbilityType
      const currentScore = currentAbilityScores[ability]
      if (!currentScore) continue
      if (effect.op === "add" && effect.value !== null) {
        currentScore.score += effect.value
      } else if (effect.op === "set" && effect.value !== null) {
        currentScore.score = effect.value
      } else if (effect.op === "proficiency") {
        currentScore.proficient = true
      }
    }
  }

  const abilityScores = Object.fromEntries(
    Abilities.map((ability) => [
      ability,
      computeAbilityScore(
        currentAbilityScores[ability]?.score,
        currentAbilityScores[ability]?.proficient,
        proficiencyBonus
      ),
    ])
  ) as Record<AbilityType, AbilityScore>

  // if an item effect modifies skill proficiency bonus, apply it now
  for (const { effect } of activeEffects) {
    if ((Skills as readonly ItemEffectTarget[]).includes(effect.target)) {
      const currentSkill = currentSkills[effect.target as SkillType]
      let newProficiency: ProficiencyLevel = currentSkill?.proficiency || "none"
      if (effect.op === "proficiency" && currentSkill?.proficiency !== "expert") {
        newProficiency = "proficient"
      } else if (effect.op === "expertise") {
        newProficiency = "expert"
      }

      if (currentSkill) {
        currentSkill.proficiency = newProficiency
      } else {
        currentSkills[effect.target as SkillType] = { proficiency: newProficiency }
      }
    }
  }

  // compute skill modifiers from proficiency and ability scores
  const skills: Record<SkillType, SkillScore> = {} as Record<SkillType, SkillScore>
  for (const skill of Skills) {
    const proficiency = currentSkills[skill]?.proficiency || "none"
    skills[skill] = {
      modifier: computeSkillModifier(skill, proficiency, proficiencyBonus, abilityScores),
      proficiency,
      ability: SkillAbilities[skill],
    }
  }

  // modify skills based on item effects
  for (const { effect } of activeEffects) {
    if ((Skills as readonly ItemEffectTarget[]).includes(effect.target)) {
      const currentSkill = skills[effect.target as SkillType]
      if (effect.op === "add" && effect.value !== null) {
        currentSkill.modifier += effect.value
      } else if (effect.op === "set" && effect.value !== null) {
        currentSkill.modifier = Math.max(effect.value, currentSkill.modifier)
      }
    }
  }

  // Compute hit points and hit dice
  let maxHitPoints = 0
  const hitDice: HitDieType[] = []

  const allLevels = await getAllLevels(db, characterId)

  // Weapon, armor, tool, and language proficiencies, from their history
  const proficiencies = currentProficiencies(await findProficiencyChanges(db, characterId))
  const armorProficiencies = new Set(
    proficiencies.filter((p) => p.kind === "armor").map((p) => p.name)
  )
  for (const level of allLevels) {
    const classDef = ruleset.classes[level.class]
    hitDice.push(classDef.hitDie)
    maxHitPoints += level.hit_die_roll
  }

  // Add CON modifier per total level
  const conModifier = abilityScores.constitution.modifier
  maxHitPoints += conModifier * totalLevel

  // Compute current HP, never below 0, and whether the character is down
  const { currentHP, deathSaves } = computeHitPoints(deathSaveEvents, maxHitPoints + hpDelta)

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
  let initiative = abilityScores.dexterity.modifier

  // Armor Class calculation
  let armorClass = 10 + abilityScores.dexterity.modifier // Base unarmored AC

  // Check for worn armor
  const wornArmor = equippedItems.find((item) => item.category === "armor" && item.worn)
  if (wornArmor && wornArmor.armor_class !== null) {
    // Start with armor's base AC
    armorClass = wornArmor.armor_class

    // Add DEX modifier if armor allows it
    if (wornArmor.armor_class_dex) {
      const dexMod = abilityScores.dexterity.modifier
      if (wornArmor.armor_class_dex_max !== null) {
        // Cap DEX bonus at max
        armorClass += Math.min(dexMod, wornArmor.armor_class_dex_max)
      } else {
        // Full DEX bonus
        armorClass += dexMod
      }
    }
  }

  // Check for wielded shield
  const wieldedShield = equippedItems.find((item) => item.category === "shield" && item.wielded)
  // SRD 5.2: a shield only adds AC with shield training; SRD 5.1 counts it, with the
  // untrained-armor penalties
  const shieldUntrained =
    !!wieldedShield && SRD52_ID === character.ruleset && !armorProficiencies.has("shields")
  const armorClassNotes: string[] = []
  if (wieldedShield && shieldUntrained) {
    armorClassNotes.push(`${wieldedShield.name} adds no AC without shield training`)
  } else if (wieldedShield && wieldedShield.armor_modifier !== null) {
    armorClass += wieldedShield.armor_modifier
  }

  // Passive Perception is 10 + Perception skill modifier
  let passivePerception = 10 + skills.perception.modifier

  // Speed (from species, but can be modified by items)
  let speed = species.speed

  // Compute spell slots
  let spellSlots: SpellSlotsType = []
  let pactMagicSlots: SpellSlotsType = []

  // Calculate caster levels for multiclassing
  let fullCasterLevel = 0
  let halfCasterLevel = 0
  let thirdCasterLevel = 0

  for (const charClass of classes) {
    const classDef = ruleset.classes[charClass.class]
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
      pactMagicSlots = ruleset.getSlotsFor("pact", charClass.level)
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
      spellSlots = ruleset.getSlotsFor("full", fullCasterLevel)
    } else if (halfCasterLevel > 0) {
      spellSlots = ruleset.getSlotsFor("half", halfCasterLevel)
    } else if (thirdCasterLevel > 0) {
      spellSlots = ruleset.getSlotsFor("third", thirdCasterLevel)
    }
  } else if (casterTypeCount > 1) {
    // Multiclassing - use effective caster level with highest tier progression
    const effectiveCasterLevel =
      fullCasterLevel + Math.floor(halfCasterLevel / 2) + Math.floor(thirdCasterLevel / 3)

    if (fullCasterLevel > 0) {
      spellSlots = ruleset.getSlotsFor("full", effectiveCasterLevel)
    } else if (halfCasterLevel > 0) {
      spellSlots = ruleset.getSlotsFor("half", effectiveCasterLevel)
    } else if (thirdCasterLevel > 0) {
      spellSlots = ruleset.getSlotsFor("third", effectiveCasterLevel)
    }
  }

  // Compute available spell slots by applying uses and restores
  let availableSpellSlots: SpellSlotsType = []
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
  const spells = await computeSpells(
    db,
    ruleset,
    characterId,
    classes,
    abilityScores,
    proficiencyBonus
  )

  // Fetch all traits for this character
  const traits = await findTraits(db, characterId)

  // Check if character has Wild Shape and compute wildShape info if so
  let wildShape: WildShapeInfo | null = null
  const druidClass = classes.find((c) => c.class === "druid")
  if (druidClass) {
    const seenBeasts = await getCurrentSeenBeasts(db, characterId)
    const unrecoveredUses = await findUnrecoveredWildShapeUses(db, characterId)
    const unrecoveredCount = unrecoveredUses.length
    const ongoing = unrecoveredUses.find((u) => u.ended_at === null)
    const maxUses = getWildShapeUses(character.ruleset, druidClass.level)

    // SRD 5.2: limited known forms (knownForms = 4/6/8)
    // SRD 5.1: unlimited seen beasts (knownForms = null)
    const knownForms = character.ruleset === SRD52_ID ? getKnownFormsLimit(druidClass.level) : null

    // Fetch beast data if there's an ongoing transformation
    let currentBeast: Beast | null = null
    if (ongoing) {
      currentBeast = getBeastById(character.ruleset, ongoing.beast_id) ?? null
    }

    wildShape = {
      limits: getWildShapeCRLimit({
        druidLevel: druidClass.level,
        subclass: druidClass.subclass,
        ruleset: character.ruleset,
      }),
      maxUses,
      usesAvailable: Math.max(0, maxUses - unrecoveredCount),
      unrecoveredCount,
      knownForms,
      beasts: seenBeasts,
      ongoingTransformation: ongoing
        ? {
            id: ongoing.id,
            beastId: ongoing.beast_id,
            startedAt: ongoing.created_at,
            currentBeastHp: ongoing.beast_hp ?? currentBeast?.hitPoints ?? 0,
          }
        : null,
      currentBeast,
    }
  }

  /// IGOR: FIX
  for (const { effect, item } of activeEffects) {
    // an untrained shield gives no AC in SRD 5.2, magic included
    if (effect.target === "ac" && shieldUntrained && item.id === wieldedShield?.id) continue
    if (effect.target === "ac" && effect.value !== null) {
      // Armor class effect
      if (effect.op === "add") {
        armorClass += effect.value
      } else if (effect.op === "set") {
        armorClass = effect.value
      }
    } else if (effect.target === "speed" && effect.value !== null) {
      // Speed effect
      if (effect.op === "add") {
        speed += effect.value
      } else if (effect.op === "set") {
        speed = effect.value
      }
    } else if (effect.target === "initiative" && effect.value !== null) {
      // Initiative effect
      if (effect.op === "add") {
        initiative += effect.value
      } else if (effect.op === "set") {
        initiative = effect.value
      }
    } else if (effect.target === "passive perception" && effect.value !== null) {
      // Passive perception effect
      if (effect.op === "add") {
        passivePerception += effect.value
      } else if (effect.op === "set") {
        passivePerception = effect.value
      }
    }
  }

  const weaponProficiencies = proficiencies.filter((p) => p.kind === "weapon").map((p) => p.name)
  const weaponAttacks = equippedItems
    .filter((item) => item.category === "weapon")
    .map((item) =>
      computeWeaponAttack(
        item,
        character.ruleset,
        classes.some((c) => c.class === "monk"),
        weaponProficiencies,
        abilityScores,
        proficiencyBonus,
        activeEffects
      )
    )

  const armorWarnings: string[] = []
  for (const item of [wornArmor, wieldedShield]) {
    const required = item && requiredArmorProficiency(item)
    if (!item || !required || armorProficiencies.has(required)) continue
    const what = `${item.name} (${formatProficiencyName(required)})`
    if (item === wieldedShield && shieldUntrained) {
      armorWarnings.push(`No training with ${what}: it adds no AC.`)
    } else {
      const warning = `Not proficient with ${what}: disadvantage on Strength and Dexterity checks, saves, and attacks, and no spellcasting.`
      armorWarnings.push(warning)
      // the AC still counts it, but say so where the AC is shown too
      armorClassNotes.push(warning)
    }
  }

  // Get all avatars with upload URLs
  const avatars = await findAvatars(db, characterId)
  const avatarsWithUrls: CharacterAvatarWithUrl[] = avatars.map((avatar) => ({
    ...avatar,
    uploadUrl: `/uploads/${avatar.upload_id}`,
  }))

  const char = {
    ...character,
    classes,
    totalLevel,
    size: species.size,
    speed,
    proficiencyBonus,
    abilityScores,
    skills,
    armorClass,
    initiative,
    passivePerception,
    maxHitPoints,
    currentHP,
    deathSaves,
    hitDice,
    availableHitDice,
    spellSlots,
    availableSpellSlots,
    pactMagicSlots,
    spells,
    traits,
    proficiencies,
    coins: currentCoins,
    equippedItems,
    weaponAttacks,
    armorWarnings,
    armorClassNotes,
    affectedAttributes,
    avatars: avatarsWithUrls,
    wildShape,
  }

  return char
}
