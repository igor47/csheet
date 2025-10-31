import { deleteById as deleteItemEffectDb, findById } from "@src/db/item_effects"
import { logger } from "@src/lib/logger"
import type { SQL } from "bun"

/**
 * Deletes an item effect after verifying it belongs to the specified item
 */
export async function deleteItemEffect(
  db: SQL,
  itemId: string,
  effectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the effect exists and belongs to this item
    const effect = await findById(db, effectId)

    if (!effect) {
      return { success: false, error: "Effect not found" }
    }

    if (effect.item_id !== itemId) {
      return { success: false, error: "Effect does not belong to this item" }
    }

    // Delete the effect
    await deleteItemEffectDb(db, effectId)

    return { success: true }
  } catch (error) {
    logger.error("Error deleting item effect:", error as Error)
    return { success: false, error: "Failed to delete effect. Please try again." }
  }
}
