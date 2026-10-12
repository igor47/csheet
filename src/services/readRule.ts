import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { findSection, readSection, resolvePage, rulesHref } from "@src/lib/srd/sections"
import { getToc } from "@src/lib/srd/toc"
import type { ToolInput, ToolSpec } from "@src/lib/toolSpec"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

/** Longest section text returned, in characters (~4k tokens); longer sections are cut off */
export const MAX_RULE_LENGTH = 16_000

export const ReadRuleApiSchema = z.object({
  section_id: z
    .string()
    .min(1)
    .describe("The id of a section, as returned by search_rules or listed in child_sections."),
})

export const readRuleToolName = "read_rule" as const

export const readRuleTool = {
  description:
    "Read the full text of a rules section from the System Reference Document, by id. Get ids from search_rules. A broad section returns its introduction plus a list of child_sections to read next. When you answer from a section, link it for the player as a markdown link using its url, e.g. [Grappled](url).",
  inputSchema: ReadRuleApiSchema,
} satisfies ToolSpec

export interface ReadRuleResult {
  id: string
  title: string
  location: string
  url: string
  text: string
  truncated: boolean
  child_sections: { id: string; title: string }[]
}

export async function executeReadRule(
  _db: SQL,
  char: ComputedCharacter,
  parameters: ToolInput<typeof readRuleTool>,
  _isCheck?: boolean
): Promise<ServiceResult<ReadRuleResult>> {
  const parsed = ReadRuleApiSchema.safeParse(parameters)
  if (!parsed.success) {
    return { complete: false, values: parameters, errors: zodToFormErrors(parsed.error) }
  }

  const toc = await getToc(char.ruleset)
  const found = findSection(toc, parsed.data.section_id)
  if (!found) {
    return {
      complete: false,
      values: parameters,
      errors: {
        section_id: `No section with id "${parsed.data.section_id}". Use search_rules to find section ids.`,
      },
    }
  }

  const entry = resolvePage(toc, found)
  const { markdown, children } = readSection(toc, entry)
  const truncated = markdown.length > MAX_RULE_LENGTH

  return {
    complete: true,
    result: {
      id: entry.id,
      title: entry.title,
      location: entry.path.join(" > "),
      url: rulesHref(char.ruleset, entry.id),
      text: truncated
        ? `${markdown.slice(0, MAX_RULE_LENGTH)}\n\n[Section truncated; the full text is at the url.]`
        : markdown,
      truncated,
      child_sections: children.map((child) => {
        const page = resolvePage(toc, child)
        return { id: page.id, title: child.title }
      }),
    },
  }
}
