import { create as createCharItemDb } from "@src/db/char_items"
import type { SQL } from "bun"

/**
 * Character acquires an item
 */
export async function acquireItem(db: SQL, characterId: string, itemId: string, note?: string) {
  return await createCharItemDb(db, {
    character_id: characterId,
    item_id: itemId,
    worn: false,
    wielded: false,
    dropped_at: null,
    note: note || null,
  })
}
