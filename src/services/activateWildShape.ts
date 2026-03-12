import {
  create as createWildShapeUse,
  endOngoingTransformation,
} from "@src/db/char_wild_shape_uses"
import { getBeastById } from "@src/lib/dnd/beasts"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const ActivateWildShapeApiSchema = z.object({
  beast_id: z.string().min(1, "Beast is required"),
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export interface ActivateWildShapeSummary {
  beastId: string
  beastName: string
  useId: string
  usesRemaining: number
}

export type ActivateWildShapeResult = ServiceResult<ActivateWildShapeSummary>

/**
 * Activate wild shape, transforming into a beast form.
 *
 * Validation:
 * 1. Character has wild shape ability
 * 2. Beast exists in known/seen beasts
 * 3. Beast CR within limits
 * 4. Flight restriction check
 * 5. Swim restriction check
 * 6. Uses available
 *
 * Note: If there's an ongoing transformation, it will be auto-ended (matches D&D 5e rules).
 */
export async function activateWildShape(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<ActivateWildShapeResult> {
  // Partial parse for live validation
  const checkD = ActivateWildShapeApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}

  // Validation 1: Character has wild shape ability
  if (!char.wildShape) {
    errors._form = "This character cannot use Wild Shape"
    return { complete: false, errors, values: data }
  }

  const { limits, usesAvailable, beasts, maxUses, unrecoveredCount } = char.wildShape

  // Validation 2: Beast exists in known/seen beasts
  const beastId = checkD.data.beast_id
  if (!beastId) {
    if (!checkD.data.is_check) {
      errors.beast_id = "Beast is required"
    }
    return { complete: false, errors, values: data }
  }

  if (!beasts.includes(beastId)) {
    errors.beast_id = "Beast not found in known/seen beasts"
    return { complete: false, errors, values: data }
  }

  // Get beast data
  const beast = getBeastById(char.ruleset, beastId)
  if (!beast) {
    errors.beast_id = "Beast data not found"
    return { complete: false, errors, values: data }
  }

  // Validation 3: Beast CR within limits
  if (beast.cr > limits.maxCR) {
    errors.beast_id = `Beast CR (${beast.cr}) exceeds your limit (${limits.maxCR})`
    return { complete: false, errors, values: data }
  }

  // Validation 4: Flight restriction
  if (beast.speed.fly && !limits.canFly) {
    errors.beast_id = "You cannot transform into beasts with a flying speed yet"
    return { complete: false, errors, values: data }
  }

  // Validation 5: Swim restriction
  if (beast.speed.swim && !limits.canSwim) {
    errors.beast_id = "You cannot transform into beasts with a swimming speed yet"
    return { complete: false, errors, values: data }
  }

  // Validation 6: Uses available
  if (usesAvailable <= 0) {
    errors._form = "No Wild Shape uses available"
    return { complete: false, errors, values: data }
  }

  // If this is just a validation check, return here
  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Full parse
  const result = ActivateWildShapeApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // Execute the transformation

  // Auto-end any ongoing transformation
  await endOngoingTransformation(db, char.id)

  // Create new wild shape use with beast's max HP
  const use = await createWildShapeUse(
    db,
    {
      character_id: char.id,
      beast_id: result.data.beast_id,
      note: result.data.note,
    },
    beast.hitPoints
  )

  // Calculate remaining uses after this transformation
  const usesRemaining = Math.max(0, maxUses - (unrecoveredCount + 1))

  return {
    complete: true,
    result: {
      beastId: beast.id,
      beastName: beast.name,
      useId: use.id,
      usesRemaining,
    },
  }
}

// Vercel AI SDK tool definition
export const activateWildShapeToolName = "activate_wild_shape" as const

export const activateWildShapeTool = tool({
  name: activateWildShapeToolName,
  description: `Transform into a beast form using Wild Shape.

Requirements:
- Druid with Wild Shape ability
- Beast must be in known/seen forms (use add_beast first)
- Beast CR must be within limits (check character_status wildShape.limits)
- Flight/swim restrictions apply based on druid level
- Must have uses available

If already transformed, current transformation ends automatically.
Returns the beast's full stat block including HP, AC, abilities, and attacks.`,
  inputSchema: ActivateWildShapeApiSchema.omit({ is_check: true }),
})

/**
 * Execute the activate_wild_shape tool from AI assistant
 * Converts AI parameters to service format and calls activateWildShape
 */
export async function executeActivateWildShape(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
): Promise<ServiceResult<ActivateWildShapeSummary>> {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    beast_id: parameters.beast_id?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return activateWildShape(db, char, data)
}

/**
 * Format approval message for activate_wild_shape tool calls
 */
export function formatActivateWildShapeApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  char: ComputedCharacter
): string {
  const { beast_id } = parameters
  const beast = getBeastById(char.ruleset, beast_id)
  const beastName = beast?.name ?? beast_id
  return `Transform into ${beastName}`
}
