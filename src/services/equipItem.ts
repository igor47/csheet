import { create as createCharItemDb, getCurrentInventory } from "@src/db/char_items"
import type { SQL } from "bun"

/**
 * Change the worn/wielded state of an item
 */
export async function equipItem(
  db: SQL,
  characterId: string,
  itemId: string,
  worn: boolean,
  wielded: boolean,
  note?: string
) {
  // Verify the character currently has the item
  const inventory = await getCurrentInventory(db, characterId)
  const currentItem = inventory.find((ci) => ci.item_id === itemId)

  if (!currentItem) {
    throw new Error("Character does not have this item")
  }

  // Check if the state is actually changing
  if (currentItem.worn === worn && currentItem.wielded === wielded) {
    throw new Error("Item equipment state is already set to these values")
  }

  // Create a new char_items entry with the new worn/wielded state
  return await createCharItemDb(db, {
    character_id: characterId,
    item_id: itemId,
    worn,
    wielded,
    dropped_at: null,
    note: note || null,
  })
}
