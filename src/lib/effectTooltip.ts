import type { ItemEffectInfo } from "@src/services/computeCharacter"

/**
 * Get tooltip text for an attribute affected by item effects
 * @param target The attribute name (e.g., "strength", "ac", "speed")
 * @param affectedAttributes Map of affected attributes from ComputedCharacter
 * @returns Tooltip text or null if attribute is not affected
 */
export function getEffectTooltip(
  target: string,
  affectedAttributes: Record<string, ItemEffectInfo[]>
): string | null {
  const effects = affectedAttributes[target]
  if (!effects || effects.length === 0) {
    return null
  }

  const lines = ["Modified by:"]
  for (const effect of effects) {
    lines.push(`• ${effect.itemName}: ${effect.effectDescription}`)
  }

  return lines.join("\n")
}

/**
 * Check if an attribute is affected by any item effects
 * @param target The attribute name
 * @param affectedAttributes Map of affected attributes from ComputedCharacter
 * @returns true if the attribute has active effects
 */
export function hasEffect(
  target: string,
  affectedAttributes: Record<string, ItemEffectInfo[]>
): boolean {
  const effects = affectedAttributes[target]
  return effects !== undefined && effects.length > 0
}
