/**
 * Wild Shape CR Limits based on SRD 5.2
 *
 * Note: CR limits apply to *transforming*, not to *recording* seen beasts.
 * A low-level druid can record a Giant Eagle but can't transform into one
 * until they reach the appropriate level.
 */

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
 * Check if a beast can be transformed into given current limits
 */
export function canTransformIntoBeast(
  beastCR: number,
  beastHasFly: boolean,
  beastHasSwim: boolean,
  limits: WildShapeLimits
): { allowed: boolean; reason?: string } {
  if (beastCR > limits.maxCR) {
    return {
      allowed: false,
      reason: `CR ${formatCR(beastCR)} exceeds your max CR of ${formatCR(limits.maxCR)}`,
    }
  }
  if (beastHasFly && !limits.canFly) {
    return { allowed: false, reason: "Cannot transform into flying beasts yet" }
  }
  if (beastHasSwim && !limits.canSwim) {
    return { allowed: false, reason: "Cannot transform into swimming beasts yet" }
  }
  return { allowed: true }
}
