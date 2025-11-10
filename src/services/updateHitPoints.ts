import { create as createCharHPDb } from "@src/db/char_hp"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateHitPointsApiSchema = z.object({
  action: z.enum(["restore", "lose"]),
  amount: NumberField(
    z
      .number({
        error: (iss) => (iss.value === null ? "Amount is required" : "Must be a valid number"),
      })
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must be at least 1" })
  ),
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

// Vercel AI SDK tool definition
export const updateHitPointsToolName = "update_hit_points" as const
export const updateHitPointsTool = tool({
  name: updateHitPointsToolName,
  description: `Update the character's hit points. Used when the character takes damage or receives healing.

Specify the action ("restore" for healing, "lose" for damage) and the amount of hit points to change.
The note field should describe what caused the HP change.

Examples:
- Character takes 10 damage from a goblin attack → action: "lose", amount: 10, note: "Goblin attack"
- Character drinks a healing potion restoring 8 HP → action: "restore", amount: 8, note: "Potion of healing"
- Character receives healing spell for 15 HP → action: "restore", amount: 15, note: "Cure wounds spell"

The system will prevent healing above max HP or reducing below 0 HP.`,
  inputSchema: UpdateHitPointsApiSchema.omit({ is_check: true }),
})

export type UpdateHitPointsResult = ServiceResult<{ newHP: number }>

/**
 * Update hit points by creating a new HP change record
 */
export async function updateHitPoints(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateHitPointsResult> {
  const checkD = UpdateHitPointsApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const values = checkD.data
  const errors: Record<string, string> = {}
  const currentHP = char.currentHP
  const maxHitPoints = char.maxHitPoints

  // Validate amount
  if (values.amount) {
    // Check bounds
    if (checkD.data.action === "restore") {
      const newHP = currentHP + values.amount
      if (newHP > maxHitPoints) {
        errors.amount = `Cannot restore more than ${maxHitPoints - currentHP} HP (would exceed max)`
      }
    } else {
      const newHP = currentHP - values.amount
      if (newHP < 0) {
        errors.amount = `Cannot lose more than ${currentHP} HP (would go below 0)`
      }
    }
  } else if (!values.is_check) {
    errors.amount = "Amount is required"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateHitPointsApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually update hit points

  // Convert action to delta
  const delta = result.data.action === "restore" ? result.data.amount : -result.data.amount

  // Create HP change record
  await createCharHPDb(db, {
    character_id: char.id,
    delta,
    note: result.data.note || null,
  })

  return {
    complete: true,
    result: { newHP: currentHP + delta },
  }
}

/**
 * Execute the update_hit_points tool from AI assistant
 * Converts AI parameters to service format and calls updateHitPoints
 */
export async function executeUpdateHitPoints(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    action: parameters.action?.toString() || "",
    amount: parameters.amount?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return updateHitPoints(db, char, data)
}

/**
 * Format approval message for update_hit_points tool calls
 */
export function formatUpdateHitPointsApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { action, amount, note } = parameters

  const verb = action === "restore" ? "Restore" : "Take"
  const suffix = action === "restore" ? "hit points" : "damage"

  let message = `${verb} ${amount} ${suffix}`
  if (note) {
    message += ` with note '${note}'`
  }

  return message
}
