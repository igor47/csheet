import { create as createCharItemDb, getCurrentInventory } from "@src/db/char_items"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const EquipItemApiSchema = z.object({
  character_id: z.string(),
  item_id: z.string().describe("The ID of the item to equip/unequip"),
  worn: Checkbox().describe("Whether the item is worn (armor, clothing, accessories)"),
  wielded: Checkbox().describe("Whether the item is wielded (weapons, shields held in hand)"),
  note: OptionalString().describe("Optional note about the equipment change"),
})

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

// Vercel AI SDK tool definition
export const equipItemToolName = "equip_item" as const
export const equipItemTool = tool({
  name: equipItemToolName,
  description: `Equip or unequip an item. Set worn=true for armor/clothing, wielded=true for weapons/shields. Both can be true (e.g., wearing magical armor).`,
  inputSchema: EquipItemApiSchema.omit({ character_id: true }),
})

/**
 * Execute the equip_item tool from AI assistant
 */
export async function executeEquipItem(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  _isCheck?: boolean
): Promise<ToolExecutorResult> {
  try {
    await equipItem(
      db,
      char.id,
      parameters.item_id,
      parameters.worn === true || parameters.worn === "true",
      parameters.wielded === true || parameters.wielded === "true",
      parameters.note
    )

    return {
      status: "success",
    }
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to equip item",
    }
  }
}

/**
 * Format approval message for equip_item tool calls
 */
export function formatEquipItemApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { item_id, worn, wielded, note } = parameters

  const states: string[] = []
  if (worn) states.push("worn")
  if (wielded) states.push("wielded")

  const action =
    states.length > 0 ? `Equip ${item_id} (${states.join(", ")})` : `Unequip ${item_id}`

  let message = action

  if (note) {
    message += `\n${note}`
  }

  return message
}
