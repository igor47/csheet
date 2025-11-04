import { getCurrentCharges } from "@src/db/item_charges"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { EquippedComputedItem } from "./computeCharacterItems"
import { restoreCharge } from "./restoreCharge"
import { useCharge } from "./useCharge"

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

export type ManageChargeResult =
  | { complete: true; newCharges: number }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Manage item charges (use or add)
 */
export async function manageCharge(
  db: SQL,
  item: EquippedComputedItem,
  data: Record<string, string>
): Promise<ManageChargeResult> {
  const checkD = ManageChargeApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const currentCharges = item.currentCharges

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

  if (result.data.action === "use") {
    await useCharge(db, result.data.item_id, result.data.amount, result.data.note || undefined)
  } else {
    await restoreCharge(db, result.data.item_id, result.data.amount, result.data.note || undefined)
  }

  // Get updated charge count
  const newCharges = await getCurrentCharges(db, result.data.item_id)

  return {
    complete: true,
    newCharges,
  }
}
