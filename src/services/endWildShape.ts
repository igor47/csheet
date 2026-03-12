import { endTransformation } from "@src/db/char_wild_shape_uses"
import { getBeastById } from "@src/lib/dnd/beasts"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const EndWildShapeApiSchema = z.object({
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export interface EndWildShapeSummary {
  useId: string
  beastId: string
  beastName: string
  duration: string // Human-readable duration
}

export type EndWildShapeResult = ServiceResult<EndWildShapeSummary>

/**
 * Format duration between two dates in a human-readable format.
 */
function formatDuration(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) {
    return "less than a minute"
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"}`
  }

  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60

  if (mins === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`
  }
  return `${hours} hour${hours === 1 ? "" : "s"} ${mins} minute${mins === 1 ? "" : "s"}`
}

/**
 * End an ongoing wild shape transformation.
 *
 * Validation:
 * 1. Character has wild shape ability
 * 2. Character has an ongoing transformation
 */
export async function endWildShape(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<EndWildShapeResult> {
  // Partial parse for live validation
  const checkD = EndWildShapeApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}

  // Validation 1: Character has wild shape ability
  if (!char.wildShape) {
    errors._form = "This character cannot use Wild Shape"
    return { complete: false, errors, values: data }
  }

  // Validation 2: Character has an ongoing transformation
  const { ongoingTransformation } = char.wildShape
  if (!ongoingTransformation) {
    errors._form = "No ongoing transformation to end"
    return { complete: false, errors, values: data }
  }

  // If this is just a validation check, return here
  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Full parse
  const result = EndWildShapeApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // Execute the end transformation

  // End the transformation
  await endTransformation(db, ongoingTransformation.id)

  // Get beast name for the summary
  const beast = getBeastById(char.ruleset, ongoingTransformation.beastId)
  const beastName = beast?.name || "Unknown Beast"

  // Calculate duration
  const duration = formatDuration(ongoingTransformation.startedAt, new Date())

  return {
    complete: true,
    result: {
      useId: ongoingTransformation.id,
      beastId: ongoingTransformation.beastId,
      beastName,
      duration,
    },
  }
}

// Vercel AI SDK tool definition
export const endWildShapeToolName = "end_wild_shape" as const

export const endWildShapeTool = tool({
  name: endWildShapeToolName,
  description: `End the current Wild Shape transformation and return to normal form.

A druid can end Wild Shape at any time. Common reasons:
- Beast HP dropped to 0 (transformation ends automatically)
- Need to cast a spell (most spells can't be cast in beast form)
- Need to speak or manipulate objects
- Combat has ended

Returns the duration of the transformation.`,
  inputSchema: EndWildShapeApiSchema.omit({ is_check: true }),
})

/**
 * Execute the end_wild_shape tool from AI assistant
 * Converts AI parameters to service format and calls endWildShape
 */
export async function executeEndWildShape(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
): Promise<ServiceResult<EndWildShapeSummary>> {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return endWildShape(db, char, data)
}

/**
 * Format approval message for end_wild_shape tool calls
 */
export function formatEndWildShapeApproval(
  _parameters: Record<string, unknown>,
  _char: ComputedCharacter
): string {
  return "End Wild Shape transformation"
}
