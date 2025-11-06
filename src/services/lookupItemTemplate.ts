import type { TemplateItem } from "@src/lib/dnd"
import { getAllItemTemplates, type RulesetId } from "@src/lib/dnd/itemTemplates"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LookupItemTemplateApiSchema = z.object({
  template_name: z
    .string()
    .describe(
      "The name or partial name of the item template to look up (e.g., 'longsword', 'chain mail', 'shield'). Case-insensitive, supports partial matches."
    ),
  category: z
    .enum(["weapon", "armor", "shield"])
    .optional()
    .describe("Optional category filter to narrow search results (weapon, armor, or shield)"),
})

export const lookupItemTemplateToolName = "lookup_item_template" as const

/**
 * Vercel AI SDK tool definition for item template lookup
 * This is a read-only informational tool that doesn't modify character state
 */
export const lookupItemTemplateTool = tool({
  name: lookupItemTemplateToolName,
  description:
    "Look up common items by name to get their details from the D&D SRD. Use this to discover available items and their properties before creating items. Returns an array of all matching templates (supports substring search). Each template includes full details like damage, armor class, properties, and other mechanical information. The template details can then be passed to the create_item tool.",
  inputSchema: LookupItemTemplateApiSchema,
})

/**
 * Execute item template lookup
 * Searches the item template catalog and returns matching template details
 */
export async function executeLookupItemTemplate(
  _db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ServiceResult<{ matching_items: TemplateItem[] }>> {
  const parsed = LookupItemTemplateApiSchema.safeParse(parameters)

  if (!parsed.success) {
    return {
      complete: false,
      values: parameters,
      errors: zodToFormErrors(parsed.error),
    }
  }

  const { template_name, category } = parsed.data
  const searchTerm = template_name.toLowerCase().trim()

  // Get templates for character's ruleset
  const ruleset = (char.ruleset || "srd51") as RulesetId
  let templates = getAllItemTemplates(ruleset)

  // Filter by category if provided
  if (category) {
    templates = templates.filter((t) => t.category === category)
  }

  // Search using substring match
  const matches = templates.filter((t) => t.name.toLowerCase().includes(searchTerm))

  if (matches.length === 0) {
    const categoryMsg = category ? ` in category "${category}"` : ""
    return {
      complete: false,
      values: parameters,
      errors: {
        template_name: `No item template found matching "${template_name}"${categoryMsg}. Try a different name or partial name.`,
      },
    }
  }

  // Return all matching templates
  return {
    complete: true,
    result: { matching_items: matches },
  }
}
