import type { SizeType } from "@src/lib/dnd"
import { srd51Beasts } from "./beasts/srd51"
import { srd52Beasts } from "./beasts/srd52"
import type { RulesetId } from "./rulesets"
import type { DamageEntry, Dice } from "./spells"

// Re-export types from spells for convenience
export type { DamageEntry, Dice }

export interface BeastSpeed {
  walk?: number
  swim?: number
  fly?: number
  climb?: number
  burrow?: number
}

export interface BeastAbilities {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface BeastAttack {
  name: string // "Bite"
  attackType: "melee" | "ranged"
  attackBonus: number // +5
  reach?: number // 5 (ft) for melee
  range?: {
    // for ranged attacks
    normal: number // 25 ft normal range
    long: number // 50 ft long range (disadvantage)
  }
  damage: DamageEntry // reuse from spells.ts
  description?: string // extra effects: "target has Prone condition"
}

export interface BeastTrait {
  name: string // "Keen Smell"
  description: string // "Advantage on Perception checks using smell"
}

export interface Beast {
  id: string // "srd51_brown_bear"
  name: string // "Brown Bear"
  size: SizeType // "large"
  cr: number // 1 (decimals for fractions: 0.125, 0.25, 0.5)
  xp: number // 200
  ac: number // 11
  acType?: string // "natural armor"
  hitPoints: number // 34 (just the static number)
  speed: BeastSpeed
  abilities: BeastAbilities
  skills?: Record<string, number> // {"perception": 3}
  senses: string // "passive Perception 13"
  traits?: BeastTrait[] // Keen Smell, Pack Tactics, etc.
  actions: BeastAttack[]
  source: "srd51" | "srd52"
}

export function getBeasts(ruleset: RulesetId): Beast[] {
  return ruleset === "srd52" ? srd52Beasts : srd51Beasts
}

export function getBeastById(ruleset: RulesetId, id: string): Beast | undefined {
  return getBeasts(ruleset).find((b) => b.id === id)
}

export function getBeastsFilteredByCR(
  ruleset: RulesetId,
  maxCR: number,
  options?: { canSwim?: boolean; canFly?: boolean }
): Beast[] {
  return getBeasts(ruleset).filter((b) => {
    if (b.cr > maxCR) return false
    if (options?.canSwim === false && b.speed.swim) return false
    if (options?.canFly === false && b.speed.fly) return false
    return true
  })
}
