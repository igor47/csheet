import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { searchRules } from "@src/lib/srd/search"
import { rulesHref } from "@src/lib/srd/sections"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const SearchRulesApiSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "Keywords for the rule to find, e.g. 'grappled', 'opportunity attack', 'cover', 'long rest'. Use the game's own terms where you know them."
    ),
})

export const searchRulesToolName = "search_rules" as const

export const searchRulesTool = tool({
  name: searchRulesToolName,
  description:
    "Search the System Reference Document (the official open D&D rules) for the character's ruleset. Use this before answering any rules question instead of relying on memory. Returns the best-matching sections, each with an id, its location in the rules, a short excerpt, and a link. Then call read_rule with the id of the section that answers the question.",
  inputSchema: SearchRulesApiSchema,
})

export interface SearchRulesResult {
  ruleset: string
  results: { id: string; location: string; excerpt: string; url: string }[]
}

export async function executeSearchRules(
  _db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<SearchRulesResult>> {
  const parsed = SearchRulesApiSchema.safeParse(parameters)
  if (!parsed.success) {
    return { complete: false, values: parameters, errors: zodToFormErrors(parsed.error) }
  }

  const matches = await searchRules(char.ruleset, parsed.data.query)
  if (matches.length === 0) {
    return {
      complete: false,
      values: parameters,
      errors: { query: `No rules matched "${parsed.data.query}". Try other keywords.` },
    }
  }

  return {
    complete: true,
    result: {
      ruleset: char.ruleset,
      results: matches.map(({ entry, excerpt }) => ({
        id: entry.id,
        location: entry.path.join(" > "),
        excerpt,
        url: rulesHref(char.ruleset, entry.id),
      })),
    },
  }
}
