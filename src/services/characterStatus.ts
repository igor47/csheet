import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const characterStatusToolName = "character_status" as const

interface SpellSlotSummary {
  total: number
  used: number
  available: number
}

type SpellSlotsSummary = Record<string, SpellSlotSummary>

export type CharacterStatusResult = Omit<ComputedCharacter, "traits"> & {
  spellSlotsSummary: SpellSlotsSummary
}

/**
 * Vercel AI SDK tool definition for character status lookup
 * This is a read-only informational tool that returns current character state
 */
export const characterStatusTool = tool({
  name: characterStatusToolName,
  description:
    "Get the current character status including all computed stats, resources, and abilities. Use this whenever you need to reference ability scores, skills, combat stats (HP/AC/Initiative), resources (coins, spell slots, hit dice), equipment, or spellcasting information.",
  inputSchema: z.object({}),
})

/**
 * Execute character status lookup
 * Returns the computed character state without traits (use character_traits tool for traits)
 */
export async function executeCharacterStatus(
  _db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  _parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<CharacterStatusResult>> {
  // Compute spell slots summary for easier LLM consumption
  const spellSlotsSummary: SpellSlotsSummary = {}

  for (let level = 1; level <= 9; level++) {
    const total = char.spellSlots.filter((slot) => slot === level).length
    const available = char.availableSpellSlots.filter((slot) => slot === level).length

    if (total > 0) {
      spellSlotsSummary[`level${level}`] = {
        total,
        used: total - available,
        available,
      }
    }
  }

  // Return the full computed character as structured data, excluding traits
  const { traits: _traits, ...charWithoutTraits } = char
  return {
    complete: true,
    result: {
      ...charWithoutTraits,
      spellSlotsSummary,
    },
  }
}
