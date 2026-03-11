import { type Beast, getBeasts } from "@src/lib/dnd/beasts"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const CharacterBeastsApiSchema = z.object({})

export const characterBeastsToolName = "character_beasts" as const

export const characterBeastsTool = tool({
  name: characterBeastsToolName,
  description: `Browse all beasts available for this character's Wild Shape based on their current level limits.

Returns all beasts from the catalog that meet CR/fly/swim restrictions, organized into:
- availableToLearn: Beasts the character can add to their known forms
- alreadyKnown: Beasts already in the character's known/seen forms
- restricted: Beasts above current limits (with reasons)

Each beast includes: id, name, CR, size, AC, HP, speeds.

Use lookup_beast with a beast name to get the full stat block (abilities, attacks, traits).
Use add_beast to add a beast to the character's known forms.`,
  inputSchema: CharacterBeastsApiSchema,
})

interface BeastSummary {
  id: string
  name: string
  cr: number
  crFormatted: string // "1/4", "1/2", "1"
  size: string
  ac: number
  hp: number
  speed: { walk?: number; swim?: number; fly?: number; climb?: number; burrow?: number }
}

interface CharacterBeastsResult {
  limits: {
    maxCR: number
    maxCRFormatted: string
    canFly: boolean
    canSwim: boolean
  }
  availableToLearn: BeastSummary[]
  alreadyKnown: BeastSummary[]
  restricted: Array<BeastSummary & { reason: string }>
}

/**
 * Format CR as a readable string (fractions for values < 1)
 */
function formatCR(cr: number): string {
  if (cr === 0.125) return "1/8"
  if (cr === 0.25) return "1/4"
  if (cr === 0.5) return "1/2"
  return cr.toString()
}

/**
 * Convert a Beast to a BeastSummary for the API response
 */
function toBeastSummary(beast: Beast): BeastSummary {
  return {
    id: beast.id,
    name: beast.name,
    cr: beast.cr,
    crFormatted: formatCR(beast.cr),
    size: beast.size,
    ac: beast.ac,
    hp: beast.hitPoints,
    speed: beast.speed,
  }
}

/**
 * Browse all beasts available for the character's Wild Shape
 * Filters the catalog by CR/fly/swim limits and shows known vs available
 */
export async function executeCharacterBeasts(
  _db: SQL,
  char: ComputedCharacter,
  _parameters: Record<string, unknown>,
  _isCheck?: boolean
): Promise<ServiceResult<CharacterBeastsResult>> {
  // Check if character has Wild Shape
  if (!char.wildShape) {
    return {
      complete: false,
      values: {},
      errors: {
        _form: `${char.name} does not have the Wild Shape trait`,
      },
    }
  }

  const { limits, beasts: knownBeastIds } = char.wildShape
  const knownSet = new Set(knownBeastIds)

  const availableToLearn: BeastSummary[] = []
  const alreadyKnown: BeastSummary[] = []
  const restricted: Array<BeastSummary & { reason: string }> = []

  // Get all beasts from the catalog
  const allBeasts = getBeasts(char.ruleset)

  for (const beast of allBeasts) {
    const summary = toBeastSummary(beast)

    // Check CR limit
    if (beast.cr > limits.maxCR) {
      restricted.push({
        ...summary,
        reason: `CR ${formatCR(beast.cr)} exceeds limit of ${formatCR(limits.maxCR)}`,
      })
      continue
    }

    // Check fly restriction
    if (beast.speed.fly && !limits.canFly) {
      restricted.push({
        ...summary,
        reason: "Flying not allowed yet",
      })
      continue
    }

    // Check swim restriction
    if (beast.speed.swim && !limits.canSwim) {
      restricted.push({
        ...summary,
        reason: "Swimming not allowed yet",
      })
      continue
    }

    // Beast is within limits - check if already known
    if (knownSet.has(beast.id)) {
      alreadyKnown.push(summary)
    } else {
      availableToLearn.push(summary)
    }
  }

  // Sort by CR (highest first), then name
  const sortByCrThenName = (a: BeastSummary, b: BeastSummary) => {
    if (b.cr !== a.cr) return b.cr - a.cr
    return a.name.localeCompare(b.name)
  }

  availableToLearn.sort(sortByCrThenName)
  alreadyKnown.sort(sortByCrThenName)
  restricted.sort((a, b) => a.name.localeCompare(b.name))

  return {
    complete: true,
    result: {
      limits: {
        maxCR: limits.maxCR,
        maxCRFormatted: formatCR(limits.maxCR),
        canFly: limits.canFly,
        canSwim: limits.canSwim,
      },
      availableToLearn,
      alreadyKnown,
      restricted,
    },
  }
}
