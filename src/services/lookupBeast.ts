import { type Beast, getBeasts } from "@src/lib/dnd/beasts"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LookupBeastApiSchema = z.object({
  beast_name: z
    .string()
    .describe(
      "The name or partial name of the beast to look up (e.g., 'brown bear', 'wolf', 'giant eagle'). Case-insensitive, supports partial matches."
    ),
})

export const lookupBeastToolName = "lookup_beast" as const

/**
 * Vercel AI SDK tool definition for beast lookup
 * This is a read-only informational tool that doesn't modify character state
 */
export const lookupBeastTool = tool({
  name: lookupBeastToolName,
  description:
    "Look up a beast by name to get its ID and stat block. Use this FIRST whenever a beast is mentioned by name, before using see_beast. Returns the beast's ID, CR, HP, AC, speed, abilities, attacks, and traits.",
  inputSchema: LookupBeastApiSchema,
})

/**
 * Execute beast lookup
 * Searches the beast catalog and returns matching beast details
 */
export async function executeLookupBeast(
  _db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<Beast>> {
  const parsed = LookupBeastApiSchema.safeParse(parameters)

  if (!parsed.success) {
    return {
      complete: false,
      values: parameters,
      errors: zodToFormErrors(parsed.error),
    }
  }

  const { beast_name } = parsed.data
  const searchTerm = beast_name.toLowerCase().trim()

  const beasts = getBeasts(char.ruleset)

  // Find exact match first
  let beast = beasts.find((b) => b.name.toLowerCase() === searchTerm)

  // If no exact match, try partial match
  if (!beast) {
    const matches = beasts.filter((b) => b.name.toLowerCase().includes(searchTerm))

    if (matches.length === 0) {
      return {
        complete: false,
        values: parameters,
        errors: {
          beast_name: `No beast found matching "${beast_name}". Try a different name or partial name.`,
        },
      }
    }

    if (matches.length === 1) {
      beast = matches[0]
    } else {
      // Multiple matches - return list of options
      const matchNames = matches.map((b) => b.name).join(", ")
      return {
        complete: false,
        values: parameters,
        errors: {
          beast_name: `Multiple beasts match "${beast_name}": ${matchNames}. Please be more specific.`,
        },
      }
    }
  }

  // This should never happen due to logic above, but TypeScript needs the check
  if (!beast) {
    return {
      complete: false,
      values: parameters,
      errors: { beast_name: `Beast not found: ${beast_name}` },
    }
  }

  // Return full beast details
  return {
    complete: true,
    result: beast,
  }
}
