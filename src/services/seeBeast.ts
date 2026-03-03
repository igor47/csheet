import { create as createBeastSeen, isBeastSeen } from "@src/db/char_beasts_seen"
import { getBeastById } from "@src/lib/dnd/beasts"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const SeeBeastApiSchema = z.object({
  beast_id: z
    .string()
    .describe(
      "The ID of the beast to add to the druid's seen beasts (e.g., 'srd52_brown_bear', 'srd52_wolf'). Use lookup_beast first to get the ID."
    ),
  note: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe(
      "Optional note about how the beast was encountered (e.g., 'Seen in the forest near Phandalin', 'Encountered during travels')"
    ),
})

type SeeBeastData = Partial<z.infer<typeof SeeBeastApiSchema>>

export type SeeBeastResult = ServiceResult<object>

/**
 * Add a beast to a druid's seen beasts list
 * Druids with Wild Shape can record beasts they've encountered
 * Note: CR limits apply to transforming, not to recording beasts
 */
export async function seeBeast(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<SeeBeastResult> {
  const errors: Record<string, string> = {}
  const values = data as SeeBeastData
  const isCheck = data.is_check === "true"

  // Check if character has Wild Shape
  if (!char.wildShape) {
    errors._form = `${char.name} does not have the Wild Shape trait`
    return { complete: false, errors, values: data }
  }

  // SRD 5.1 only - SRD 5.2 uses prepBeast for known forms
  if (char.ruleset !== SRD51_ID) {
    errors._form = `Recording seen beasts is only available for SRD 5.1 characters. SRD 5.2 characters should use Known Forms.`
    return { complete: false, errors, values: data }
  }

  // Validate beast
  if (values.beast_id) {
    const beast = getBeastById(char.ruleset, values.beast_id)
    if (!beast) {
      errors.beast_id = `Beast with ID ${values.beast_id} not found`
    } else {
      // Check if beast is already seen
      const alreadySeen = await isBeastSeen(db, char.id, values.beast_id)
      if (alreadySeen) {
        errors.beast_id = `${beast.name} has already been recorded as seen`
      }
    }
  } else {
    if (!isCheck) {
      errors.beast_id = "Select a beast to record"
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and persist
  const result = SeeBeastApiSchema.safeParse({
    beast_id: values.beast_id,
    note: values.note || null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  await createBeastSeen(db, {
    character_id: char.id,
    beast_id: result.data.beast_id,
    note: result.data.note,
  })

  return { complete: true, result: {} }
}

// Vercel AI SDK tool definition
export const seeBeastToolName = "see_beast" as const
export const seeBeastTool = tool({
  name: seeBeastToolName,
  description: `Record a beast that a druid has seen for Wild Shape. Requires beast_id - use lookup_beast first to get it. Only druids with the Wild Shape trait can use this tool. Note: CR limits apply to transforming into a beast, not to recording it. A druid can record any beast they've seen regardless of level.`,
  inputSchema: SeeBeastApiSchema,
})

/**
 * Execute the see_beast tool from AI assistant
 * Converts AI parameters to service format and calls seeBeast
 */
export async function executeSeeBeast(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    beast_id: parameters.beast_id?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return seeBeast(db, char, data)
}

/**
 * Format approval message for see_beast tool calls
 */
export function formatSeeBeastApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  char?: ComputedCharacter
): string {
  const { beast_id, note } = parameters

  // Try to get beast name from ID
  let beastName = beast_id
  if (char) {
    const beast = getBeastById(char.ruleset, beast_id)
    if (beast) {
      beastName = beast.name
    }
  }

  let message = `Record ${beastName} as a seen beast`

  if (note) {
    message += ` with note '${note}'`
  }

  return message
}
