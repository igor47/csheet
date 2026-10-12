import { endTransformation, updateBeastHp } from "@src/db/char_wild_shape_uses"
import type { DeathSaves } from "@src/lib/dnd/deathSaves"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, coerceBoolean, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { ToolInput, ToolSpec } from "@src/lib/toolSpec"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { damageCharacter, healCharacter, withLockedCharacter } from "./hitPointChanges"

export const UpdateHitPointsApiSchema = z.object({
  action: z.enum(["restore", "lose"]),
  amount: NumberField(
    z
      .number({
        error: (iss) => (iss.input == null ? "Amount is required" : "Must be a valid number"),
      })
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must be at least 1" })
  ),
  note: OptionalString(),
  critical: Checkbox()
    .optional()
    .default(false)
    .describe(
      "Whether the damage came from a critical hit. Only matters at 0 HP, where a critical hit causes two death save failures instead of one"
    ),
  is_check: Checkbox().optional().default(false),
})

// Vercel AI SDK tool definition
export const updateHitPointsToolName = "update_hit_points" as const
export const updateHitPointsTool = {
  description: `Update the character's hit points. Used when the character takes damage or receives healing.

Specify the action ("restore" for healing, "lose" for damage) and the amount of hit points to change.
The note field should describe what caused the HP change.

Examples:
- Character takes 10 damage from a goblin attack → action: "lose", amount: 10, note: "Goblin attack"
- Character drinks a healing potion restoring 8 HP → action: "restore", amount: 8, note: "Potion of healing"
- Character receives healing spell for 15 HP → action: "restore", amount: 15, note: "Cure wounds spell"

The system prevents healing above max HP. HP stops at 0, where the character starts dying and making death saves (record those with record_death_save). Damage taken at 0 HP is a death save failure (two if critical is true), and damage that leaves at least the HP maximum remaining after reaching 0 kills the character outright: the result says so. Healing a dying or stable character brings them back; a dead character can't regain HP until restore_to_life is used.`,
  inputSchema: UpdateHitPointsApiSchema.omit({ is_check: true }),
} satisfies ToolSpec

export interface UpdateHitPointsSuccess {
  newHP: number
  newBeastHp?: number
  transformationEnded?: boolean
  overflowDamage?: number
  beastName?: string
  // Set when the character ends up at 0 HP: whether they're dying, stable or dead
  deathSaves?: DeathSaves
  instantDeath?: boolean
}

export type UpdateHitPointsResult = ServiceResult<UpdateHitPointsSuccess>

/**
 * Update hit points by creating a new HP change record
 * Checks only validate; changes run against the character as it is inside the transaction
 */
export async function updateHitPoints(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateHitPointsResult> {
  if (coerceBoolean(data.is_check)) return applyHitPointsUpdate(db, char, data)
  return withLockedCharacter(db, char, (tx, fresh) => applyHitPointsUpdate(tx, fresh, data))
}

async function applyHitPointsUpdate(
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

  // Check if character is transformed
  const isTransformed = !!char.wildShape?.currentBeast && !!char.wildShape?.ongoingTransformation
  const beast = char.wildShape?.currentBeast
  const ongoing = char.wildShape?.ongoingTransformation
  const currentBeastHp = ongoing?.currentBeastHp ?? 0
  const maxBeastHp = beast?.hitPoints ?? 0

  const isDead = char.deathSaves?.status === "dead"

  // Validate amount
  if (isDead && values.action) {
    errors.amount =
      values.action === "restore"
        ? `${char.name} is dead and can't regain hit points until restored to life`
        : `${char.name} is dead`
  } else if (values.amount) {
    // Check bounds - different logic when transformed
    if (isTransformed) {
      if (checkD.data.action === "restore") {
        // Healing goes to beast HP, capped at beast's max
        if (currentBeastHp >= maxBeastHp) {
          errors.amount = `${beast!.name} is already at full HP (${maxBeastHp})`
        }
      }
      // For damage (lose), we allow any amount - overflow goes to character
    } else {
      // Normal validation when not transformed
      if (checkD.data.action === "restore") {
        const newHP = currentHP + values.amount
        if (newHP > maxHitPoints) {
          errors.amount = `Cannot restore more than ${maxHitPoints - currentHP} HP (would exceed max)`
        }
      }
      // Damage is never too much: HP stops at 0, and the rest can kill outright
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
  const { action, amount, critical } = result.data
  const note = result.data.note || null

  // Handle wild shape transformation
  if (isTransformed && action === "lose") {
    // Beast HP reduced but not to 0: the character's own HP is untouched
    if (amount < currentBeastHp) {
      const newBeastHp = currentBeastHp - amount
      await updateBeastHp(db, ongoing!.id, newBeastHp)
      return { complete: true, result: { newHP: currentHP, newBeastHp } }
    }

    // Beast HP reaches 0, end transformation
    await updateBeastHp(db, ongoing!.id, 0)
    await endTransformation(db, ongoing!.id)

    // Damage beyond the beast's HP carries over to the character
    const rawOverflow = amount - currentBeastHp
    if (rawOverflow > 0) {
      const damage = await damageCharacter(db, char, rawOverflow, {
        critical,
        note: `Wild Shape overflow: ${note || "damage"}`,
      })
      return {
        complete: true,
        result: {
          newHP: currentHP - damage.hpLost,
          transformationEnded: true,
          overflowDamage: damage.hpLost,
          beastName: beast!.name,
          ...(damage.deathSaves && { deathSaves: damage.deathSaves }),
          ...(damage.instantDeath && { instantDeath: true }),
        },
      }
    }

    return {
      complete: true,
      result: { newHP: currentHP, transformationEnded: true, beastName: beast!.name },
    }
  }

  if (isTransformed && action === "restore") {
    // Healing while transformed goes to beast HP
    const newBeastHp = Math.min(currentBeastHp + amount, maxBeastHp)
    await updateBeastHp(db, ongoing!.id, newBeastHp)
    return { complete: true, result: { newHP: currentHP, newBeastHp } }
  }

  // Not transformed - normal HP update
  if (action === "lose") {
    const damage = await damageCharacter(db, char, amount, { critical, note })
    return {
      complete: true,
      result: {
        newHP: currentHP - damage.hpLost,
        ...(damage.deathSaves && { deathSaves: damage.deathSaves }),
        ...(damage.instantDeath && { instantDeath: true }),
      },
    }
  }

  // Healing; at 0 HP this brings the character back up, resetting their death saves
  const newHP = await healCharacter(db, char, amount, note)
  return { complete: true, result: { newHP } }
}

/**
 * Execute the update_hit_points tool from AI assistant
 * Converts AI parameters to service format and calls updateHitPoints
 */
export async function executeUpdateHitPoints(
  db: SQL,
  char: ComputedCharacter,
  parameters: ToolInput<typeof updateHitPointsTool>,
  isCheck?: boolean
) {
  // Convert parameters to string format for service
  const data: Record<string, string> = {
    action: parameters.action?.toString() || "",
    amount: parameters.amount?.toString() || "",
    note: parameters.note?.toString() || "",
    critical: parameters.critical ? "true" : "false",
    is_check: isCheck ? "true" : "false",
  }

  return updateHitPoints(db, char, data)
}

/**
 * Format approval message for update_hit_points tool calls
 */
export function formatUpdateHitPointsApproval(
  parameters: ToolInput<typeof updateHitPointsTool>,
  char: ComputedCharacter
): string {
  const { action, amount, note, critical } = parameters

  const verb = action === "restore" ? "Restore" : "Take"
  const suffix =
    action === "restore" ? "hit points" : critical ? "damage from a critical hit" : "damage"

  let message = `${verb} ${amount} ${suffix}`
  if (note) {
    message += ` with note '${note}'`
  }

  // what damage does to the character's own HP; a Wild Shape beast takes it first
  if (action === "lose" && amount && !char.wildShape?.ongoingTransformation) {
    if (amount - char.currentHP >= char.maxHitPoints) {
      message += " (kills outright: massive damage)"
    } else if (char.currentHP === 0) {
      message += critical ? " (two death save failures)" : " (a death save failure)"
    } else if (amount >= char.currentHP) {
      message += " (drops to 0 HP)"
    }
  }

  return message
}
