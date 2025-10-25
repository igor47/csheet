import { create as createChargeDb, getCurrentCharges } from "@src/db/item_charges"
import type { SQL } from "bun"

/**
 * Use one or more charges from an item
 */
export async function useCharge(db: SQL, itemId: string, amount: number = 1, note?: string) {
  if (amount <= 0) {
    throw new Error("Amount must be positive")
  }

  // Check if item has enough charges
  const currentCharges = await getCurrentCharges(db, itemId)
  if (currentCharges < amount) {
    throw new Error(`Item only has ${currentCharges} charges remaining`)
  }

  // Record charge usage as negative delta
  return await createChargeDb(db, {
    item_id: itemId,
    delta: -amount,
    note: note || null,
  })
}
