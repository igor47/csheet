import type { CharTrait } from "@src/db/char_traits"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const characterTraitsToolName = "character_traits" as const

/**
 * Vercel AI SDK tool definition for character traits lookup
 * This is a read-only informational tool that returns the character's traits
 */
export const characterTraitsTool = tool({
  name: characterTraitsToolName,
  description:
    "Get the character's traits (racial traits, class features, feats, etc.). Use this when you need to reference specific abilities or features the character has.",
  inputSchema: z.object({}),
})

/**
 * Execute character traits lookup
 * Returns the character's traits as structured data
 */
export async function executeCharacterTraits(
  _db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  _parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<{traits: CharTrait[]}>> {
  const traits = char.traits
  return {
    complete: true,
    result: {traits}
  }
}
