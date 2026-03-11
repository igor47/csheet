import type { RulesetId } from "./rulesets"
import { SRD51_ID } from "./srd51"
import { SRD52_ID } from "./srd52"

/**
 * Wild Shape CR Limits
 *
 **/

export interface WildShapeLimits {
  maxCR: number
  canFly: boolean
  canSwim: boolean
}

export interface WildShapeCRLimitOptions {
  druidLevel: number
  subclass?: string | null
  ruleset?: RulesetId
}

/**
 * Get Wild Shape limitations based on druid level and subclass
 *
 * Base (non-Moon) limits:
 * | Druid Level | Max CR | Limitations |
 * |-------------|--------|-------------|
 * | 2-3         | 1/4    | No flying/swimming |
 * | 4-7         | 1/2    | No flying |
 * | 8+          | 1      | No limitations |
 *
 * Circle of the Moon:
 * - SRD 5.1: CR 1 at level 2, CR = level/3 at level 6+
 * - SRD 5.2: CR = level/3 (minimum 1) starting at level 3
 */
export function getWildShapeCRLimit(options: WildShapeCRLimitOptions | number): WildShapeLimits {
  // Support legacy call signature: getWildShapeCRLimit(druidLevel)
  const opts: WildShapeCRLimitOptions =
    typeof options === "number" ? { druidLevel: options } : options

  const { druidLevel, subclass, ruleset } = opts
  const isCircleOfTheMoon = subclass?.toLowerCase() === "circle of the moon"

  if (isCircleOfTheMoon) {
    return getCircleOfTheMoonCRLimit(druidLevel, ruleset ?? SRD51_ID)
  }

  return getBaseCRLimit(druidLevel)
}

/**
 * Base Wild Shape CR limits (non-Moon druids)
 */
function getBaseCRLimit(druidLevel: number): WildShapeLimits {
  if (druidLevel >= 8) {
    return { maxCR: 1, canFly: true, canSwim: true }
  }
  if (druidLevel >= 4) {
    return { maxCR: 0.5, canFly: false, canSwim: true }
  }
  if (druidLevel >= 2) {
    return { maxCR: 0.25, canFly: false, canSwim: false }
  }

  // Level 1 or below - no Wild Shape
  return { maxCR: 0, canFly: false, canSwim: false }
}

/**
 * Circle of the Moon CR limits
 *
 * SRD 5.1:
 * - Level 2: CR 1
 * - Level 6+: CR = druid level / 3 (rounded down)
 *
 * SRD 5.2:
 * - Level 3+: CR = druid level / 3 (rounded down, minimum 1)
 */
function getCircleOfTheMoonCRLimit(druidLevel: number, ruleset: RulesetId): WildShapeLimits {
  const limits = getBaseCRLimit(druidLevel)

  if (ruleset === SRD52_ID) {
    // SRD 5.2: Circle Forms at level 3, CR = level/3
    if (druidLevel >= 3) {
      limits.maxCR = Math.floor(druidLevel / 3)
    }
  } else if (ruleset === SRD51_ID) {
    // SRD 5.1: CR 1 at level 2, CR = level/3 at level 6+
    if (druidLevel >= 6) {
      limits.maxCR = Math.floor(druidLevel / 3)
    } else if (druidLevel >= 2) {
      limits.maxCR = 1
    }
  }

  return limits
}

/**
 * Format CR for display (e.g., 0.25 -> "1/4")
 */
export function formatCR(cr: number): string {
  if (cr === 0.125) return "1/8"
  if (cr === 0.25) return "1/4"
  if (cr === 0.5) return "1/2"
  return cr.toString()
}

/**
 * Get Wild Shape uses based on ruleset and druid level
 *
 * SRD 5.1: 2 uses at all levels (level 20 is unlimited, represented as 99)
 * SRD 5.2:
 *   - Level 2-5: 2 uses
 *   - Level 6-16: 3 uses
 *   - Level 17+: 4 uses
 */
/**
 * Get Known Forms limit for SRD 5.2 Wild Shape
 *
 * | Druid Level | Known Forms |
 * |-------------|-------------|
 * | 2-3         | 4           |
 * | 4-7         | 6           |
 * | 8+          | 8           |
 */
export function getKnownFormsLimit(druidLevel: number): number {
  if (druidLevel >= 8) return 8
  if (druidLevel >= 4) return 6
  if (druidLevel >= 2) return 4
  return 0
}

export function getWildShapeUses(ruleset: RulesetId, druidLevel: number): number {
  if (ruleset === SRD52_ID) {
    if (druidLevel >= 17) return 4
    if (druidLevel >= 6) return 3
    if (druidLevel >= 2) return 2
    return 0
  }

  // SRD 5.1
  if (druidLevel >= 20) return 99 // unlimited
  if (druidLevel >= 2) return 2
  return 0
}
