import { create as createChargeDb } from "@src/db/item_charges"
import type { SQL } from "bun"

/**
 * Restore one or more charges to an item
 */
export async function restoreCharge(db: SQL, itemId: string, amount: number = 1, note?: string) {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  // Record charge restoration as positive delta
  return await createChargeDb(db, {
    item_id: itemId,
    delta: amount,
    note: note || null,
  })
}
