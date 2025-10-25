import { create as createCharItemDb, getCurrentInventory } from "@src/db/char_items"
import type { SQL } from "bun"

/**
 * Character drops an item
 */
export async function dropItem(db: SQL, characterId: string, itemId: string, note?: string) {
  // Verify the character currently has the item
  const inventory = await getCurrentInventory(db, characterId)
  const hasItem = inventory.find((ci) => ci.item_id === itemId)

  if (!hasItem) {
    throw new Error("Character does not have this item")
  }

  // Create a new char_items entry with dropped_at set
  return await createCharItemDb(db, {
    character_id: characterId,
    item_id: itemId,
    worn: false,
    wielded: false,
    dropped_at: new Date(),
    note: note || null,
  })
}
