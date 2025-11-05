import { create as createChargeDb, getCurrentCharges } from "@src/db/item_charges"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import type { EquippedComputedItem } from "./computeCharacterItems"

export const ManageChargeApiSchema = z.object({
  item_id: z.string(),
  action: z.enum(["use", "add"]),
  amount: NumberField(
    z.number().int({ message: "Must be a whole number" }).min(1, { message: "Must be at least 1" })
  ),
  note: OptionalString(),
  override: Checkbox().optional().default(false),
  is_check: Checkbox().optional().default(false),
})

export type ManageChargeData = z.infer<typeof ManageChargeApiSchema>

export type ManageChargeResult = ServiceResult<{ newCharges: number }>

/**
 * Manage item charges (use or add)
 */
export async function manageCharge(
  db: SQL,
  char: ComputedCharacter,
  item: EquippedComputedItem,
  data: Record<string, string>
): Promise<ManageChargeResult> {
  const checkD = ManageChargeApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const currentCharges = item.currentCharges

  // Verify character owns the item
  if (item.character_id !== char.id) {
    errors.item_id = "Character does not have this item"
  }

  // Check if item is equipped (unless override is checked)
  if (!checkD.data.override && checkD.data.action === "use") {
    const isEquipped = item.worn || item.wielded
    if (!isEquipped) {
      const chargeType = item.chargeLabel === "ammunition" ? "ammunition" : "charges"
      errors.override = `Item must be equipped to use ${chargeType} (check override to bypass)`
    }
  }

  // Validate amount
  if (data.amount) {
    const amount = parseInt(data.amount, 10)
    if (Number.isNaN(amount) || amount < 1) {
      errors.amount = "Amount must be a positive number"
    } else {
      // Check if enough charges for "use" action
      if (checkD.data.action === "use") {
        if (amount > currentCharges) {
          errors.amount = `Not enough charges (current: ${currentCharges})`
        }
      }
    }
  } else if (!checkD.data.is_check) {
    errors.amount = "Amount is required"
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = ManageChargeApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually manage charges

  const delta = result.data.action === "use" ? -result.data.amount : result.data.amount

  await createChargeDb(db, {
    item_id: result.data.item_id,
    delta,
    note: result.data.note || null,
  })

  // Get updated charge count
  const newCharges = await getCurrentCharges(db, result.data.item_id)

  return {
    complete: true,
    result: { newCharges },
  }
}

// Vercel AI SDK tool definition
export const manageChargeToolName = "manage_item_charge" as const
export const manageChargeTool = tool({
  name: manageChargeToolName,
  description: `Manage charges on a charged item (wands, staffs, ammunition, etc.). Use action="use" to consume charges or action="add" to restore charges. The item must have enough charges available when using. Many magical items regain charges at dawn or after a rest.`,
  inputSchema: ManageChargeApiSchema.omit({ override: true, is_check: true }),
})

/**
 * Execute the manage_item_charge tool from AI assistant
 */
export async function executeManageCharge(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Find the item in character's inventory
  const itemId = parameters.item_id?.toString() || ""
  const item = char.equippedItems.find((i) => i.id === itemId)

  if (!item) {
    return {
      complete: false as const,
      values: parameters,
      errors: { item_id: "Item not found in character's inventory" },
    }
  }

  const data: Record<string, string> = {
    item_id: itemId,
    action: parameters.action?.toString() || "",
    amount: parameters.amount?.toString() || "1",
    note: parameters.note?.toString() || "",
    override: "false", // LLM never overrides equipment check
    is_check: isCheck ? "true" : "false",
  }

  return manageCharge(db, char, item, data)
}

/**
 * Format approval message for manage_item_charge tool calls
 */
export function formatManageChargeApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { item_id, action, amount = 1, note } = parameters

  const verb = action === "use" ? "Use" : "Restore"
  let message = `${verb} ${amount} charge${amount > 1 ? "s" : ""} ${action === "use" ? "from" : "to"} ${item_id}`

  if (note) {
    message += `\n${note}`
  }

  return message
}
