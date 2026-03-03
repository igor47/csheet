import { create as createBeastSeen, isBeastSeen, replaceBeast } from "@src/db/char_beasts_seen"
import { getBeastById } from "@src/lib/dnd/beasts"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const PrepBeastApiSchema = z.object({
  beast_id: z
    .string()
    .describe(
      "The ID of the beast to add to the druid's known forms (e.g., 'srd52_brown_bear', 'srd52_wolf'). Use lookup_beast first to get the ID."
    ),
  replace_beast_id: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe(
      "Optional: When at the known forms limit, specify a beast ID to replace. The old beast will be removed and the new one added."
    ),
  note: z
    .string()
    .nullable()
    .optional()
    .default(null)
    .describe("Optional note about the beast form (e.g., 'Learned during long rest in forest')"),
})

type PrepBeastData = Partial<z.infer<typeof PrepBeastApiSchema>>

export type PrepBeastResult = ServiceResult<object>

/**
 * Add a beast to a druid's known forms list (SRD 5.2 only)
 * Unlike SRD 5.1's "seen beasts", SRD 5.2 has limits on known forms
 * and requires beasts to meet CR/fly/swim limits when added
 */
export async function prepBeast(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<PrepBeastResult> {
  const errors: Record<string, string> = {}
  const values = data as PrepBeastData
  const isCheck = data.is_check === "true"

  // Check if character has Wild Shape
  if (!char.wildShape) {
    errors._form = `${char.name} does not have the Wild Shape trait`
    return { complete: false, errors, values: data }
  }

  // SRD 5.2 only - SRD 5.1 uses seeBeast
  if (char.ruleset !== SRD52_ID) {
    errors._form = `Known Forms is only available for SRD 5.2 characters. SRD 5.1 characters should use Seen Beasts.`
    return { complete: false, errors, values: data }
  }

  const { limits, knownForms, beasts } = char.wildShape
  const currentCount = beasts.length

  // Validate beast
  if (values.beast_id) {
    const beast = getBeastById(char.ruleset, values.beast_id)
    if (!beast) {
      errors.beast_id = `Beast with ID ${values.beast_id} not found`
    } else {
      // Check if beast is already known
      const alreadyKnown = await isBeastSeen(db, char.id, values.beast_id)
      if (alreadyKnown) {
        errors.beast_id = `${beast.name} is already a known form`
      }

      // Enforce CR limit
      if (beast.cr > limits.maxCR) {
        errors.beast_id = `${beast.name} (CR ${beast.cr}) exceeds your maximum CR of ${limits.maxCR}`
      }

      // Enforce fly restriction
      if (beast.speed.fly && !limits.canFly) {
        errors.beast_id = `${beast.name} has a fly speed but you cannot transform into flying creatures yet`
      }

      // Enforce swim restriction
      if (beast.speed.swim && !limits.canSwim) {
        errors.beast_id = `${beast.name} has a swim speed but you cannot transform into swimming creatures yet`
      }
    }
  } else {
    if (!isCheck) {
      errors.beast_id = "Select a beast form to learn"
    }
  }

  // Check known forms limit
  if (knownForms !== null && currentCount >= knownForms && !values.replace_beast_id) {
    if (!isCheck && !errors.beast_id) {
      if (knownForms === 0) {
        errors._form = "You cannot learn beast forms until you gain the Wild Shape trait at level 2"
      } else {
        errors._form = `You have reached your limit of ${knownForms} known forms. Select a beast to replace.`
      }
    }
  }

  // Validate replace_beast_id if provided
  if (values.replace_beast_id) {
    const replaceExists = beasts.includes(values.replace_beast_id)
    if (!replaceExists) {
      errors.replace_beast_id = `The beast you want to replace is not in your known forms`
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and persist
  const result = PrepBeastApiSchema.safeParse({
    beast_id: values.beast_id,
    replace_beast_id: values.replace_beast_id || null,
    note: values.note || null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // If replacing, soft-delete the old beast by setting replaced_at
  if (result.data.replace_beast_id) {
    await replaceBeast(db, char.id, result.data.replace_beast_id, result.data.beast_id)
  }

  // Add the new beast
  await createBeastSeen(db, {
    character_id: char.id,
    beast_id: result.data.beast_id,
    note: result.data.note,
  })

  return { complete: true, result: {} }
}

// Vercel AI SDK tool definition
export const prepBeastToolName = "prep_beast" as const
export const prepBeastTool = tool({
  name: prepBeastToolName,
  description: `Add a beast to a druid's known forms (SRD 5.2 only). Requires beast_id - use lookup_beast first to get it. Only druids with the Wild Shape trait can use this tool. The beast must meet CR and movement type restrictions based on druid level. When at the known forms limit, use replace_beast_id to swap out an existing form.`,
  inputSchema: PrepBeastApiSchema,
})

/**
 * Execute the prep_beast tool from AI assistant
 * Converts AI parameters to service format and calls prepBeast
 */
export async function executePrepBeast(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    beast_id: parameters.beast_id?.toString() || "",
    replace_beast_id: parameters.replace_beast_id?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return prepBeast(db, char, data)
}

/**
 * Format approval message for prep_beast tool calls
 */
export function formatPrepBeastApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  char?: ComputedCharacter
): string {
  const { beast_id, replace_beast_id, note } = parameters

  // Try to get beast names from IDs
  let beastName = beast_id
  let replaceName = replace_beast_id
  if (char) {
    const beast = getBeastById(char.ruleset, beast_id)
    if (beast) {
      beastName = beast.name
    }
    if (replace_beast_id) {
      const replaceBeast = getBeastById(char.ruleset, replace_beast_id)
      if (replaceBeast) {
        replaceName = replaceBeast.name
      }
    }
  }

  let message = `Learn ${beastName} as a known form`

  if (replace_beast_id) {
    message += `, replacing ${replaceName}`
  }

  if (note) {
    message += ` with note '${note}'`
  }

  return message
}
