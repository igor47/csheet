import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const characterStatusToolName = "character_status" as const

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
 * Returns the full computed character state as structured data
 */
export async function executeCharacterStatus(
  _db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  _parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<ComputedCharacter>> {
  // Return the full computed character as structured data
  return {
    complete: true,
    result: char,
  }
}
