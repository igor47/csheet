import { create } from "@src/db/char_items"
import type { SQL } from "bun"

export interface ItemStateChange {
  worn?: boolean
  wielded?: boolean
  dropped?: boolean
}

/**
 * Change the state of an item for a character
 * Creates a new char_items row with the updated state (append-only event log)
 */
export async function changeItemState(
  db: SQL,
  characterId: string,
  itemId: string,
  stateChange: ItemStateChange
): Promise<void> {
  // Get current state
  const currentState = await db`
    SELECT worn, wielded
    FROM char_items
    WHERE character_id = ${characterId}
      AND item_id = ${itemId}
      AND dropped_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `

  const current = currentState[0] || { worn: false, wielded: false }

  // Apply state change
  const newWorn = stateChange.worn !== undefined ? stateChange.worn : current.worn
  const newWielded = stateChange.wielded !== undefined ? stateChange.wielded : current.wielded
  const droppedAt = stateChange.dropped ? new Date() : null

  // Create new char_items row
  await create(db, {
    character_id: characterId,
    item_id: itemId,
    worn: newWorn,
    wielded: newWielded,
    dropped_at: droppedAt,
    note: null,
  })
}
