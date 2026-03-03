import type { RulesetId } from "./rulesets"
import { SRD52_ID } from "./srd52"

/**
 * Wild Shape CR Limits (same in SRD5.1 and 5.2)
 *
**/

export interface WildShapeLimits {
  maxCR: number
  canFly: boolean
  canSwim: boolean
}

/**
 * Get Wild Shape limitations based on druid level
 *
 * | Druid Level | Max CR | Limitations |
 * |-------------|--------|-------------|
 * | 2-3         | 1/4    | No flying/swimming |
 * | 4-7         | 1/2    | No flying |
 * | 8+          | 1      | No limitations |
 */
export function getWildShapeCRLimit(druidLevel: number): WildShapeLimits {
  if (druidLevel >= 8) {
    return { maxCR: 1, canFly: true, canSwim: true }
  }
  if (druidLevel >= 4) {
    return { maxCR: 0.5, canFly: false, canSwim: true }
  }
  // Levels 2-3 (Wild Shape gained at level 2)
  return { maxCR: 0.25, canFly: false, canSwim: false }
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
 * SRD 5.1: 2 uses at all levels (level 20 is unlimited, represented as -1)
 * SRD 5.2:
 *   - Level 1-3: 2 uses
 *   - Level 4-9: 3 uses
 *   - Level 10+: 4 uses
 */
export function getWildShapeUses(ruleset: RulesetId, druidLevel: number): number {
  if (ruleset === SRD52_ID) {
    if (druidLevel >= 17) return 4
    if (druidLevel >= 6) return 3
    return 2
  }

  // SRD 5.1
  if (druidLevel >= 20) return 99 // unlimited
  return 2
}
