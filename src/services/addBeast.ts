import { getBeastById } from "@src/lib/dnd/beasts"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { prepBeast } from "./prepBeast"
import { seeBeast } from "./seeBeast"

export const AddBeastApiSchema = z.object({
  beast_id: z.string().describe("The beast ID from lookup_beast or character_beasts"),
  replace_beast_id: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("SRD 5.2 only: When at known forms limit, specify a beast to replace"),
  note: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("Optional note about how the beast was encountered/learned"),
})

export const addBeastToolName = "add_beast" as const

export const addBeastTool = tool({
  name: addBeastToolName,
  description: `Add a beast to the druid's known/seen forms for Wild Shape.

Ruleset differences:
- SRD 5.1: Records "seen beasts" with no limit. CR/fly/swim restrictions only apply when transforming.
- SRD 5.2: Learns "known forms" with a limit (4/6/8 based on level). CR/fly/swim restrictions apply when learning. Use replace_beast_id when at the limit.

Use lookup_beast or character_beasts first to get the beast_id.`,
  inputSchema: AddBeastApiSchema,
})

/**
 * Execute the add_beast tool from AI assistant
 * Detects ruleset and calls seeBeast (SRD 5.1) or prepBeast (SRD 5.2)
 */
export async function executeAddBeast(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
): Promise<ServiceResult<object>> {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    beast_id: parameters.beast_id?.toString() || "",
    replace_beast_id: parameters.replace_beast_id?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  // Route to appropriate service based on ruleset
  if (char.ruleset === SRD51_ID) {
    return seeBeast(db, char, data)
  }
  return prepBeast(db, char, data)
}

/**
 * Format approval message for add_beast tool calls
 */
export function formatAddBeastApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  char: ComputedCharacter
): string {
  const { beast_id, replace_beast_id } = parameters

  // Look up beast name from ruleset
  const beast = getBeastById(char.ruleset, beast_id)
  const beastName = beast?.name ?? beast_id

  // SRD 5.1: "seen beasts" (unlimited), SRD 5.2: "known forms" (limited slots)
  const isSrd51 = char.ruleset === "srd51"
  let message = isSrd51
    ? `Record ${beastName} as a seen beast`
    : `Learn ${beastName} as a known form`

  if (replace_beast_id) {
    const replaceBeast = getBeastById(char.ruleset, replace_beast_id)
    const replaceName = replaceBeast?.name ?? replace_beast_id
    message += `, replacing ${replaceName}`
  }

  return message
}
