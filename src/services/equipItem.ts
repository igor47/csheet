import { create as createCharItemDb, getCurrentInventory } from "@src/db/char_items"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const EquipItemApiSchema = z.object({
  item_id: z.string().describe("The ID of the item to equip/unequip"),
  worn: Checkbox().describe("Whether the item is worn (armor, clothing, accessories)"),
  wielded: Checkbox().describe("Whether the item is wielded (weapons, shields held in hand)"),
  note: OptionalString().describe("Optional note about the equipment change"),
  is_check: Checkbox().optional().default(false),
})

export type EquipItemResult = ServiceResult<object>

/**
 * Change the worn/wielded state of an item
 */
export async function equipItem(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<EquipItemResult> {
  const checkD = EquipItemApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const isCheck = checkD.data.is_check === true || data.is_check === "true"

  // Validate required fields
  if (!checkD.data.item_id) {
    if (!isCheck) {
      errors.item_id = "Item ID is required"
    }
  }

  const itemId = checkD.data.item_id || ""
  const worn = checkD.data.worn === true || data.worn === "true"
  const wielded = checkD.data.wielded === true || data.wielded === "true"

  // Verify the character currently has the item
  if (itemId) {
    try {
      const inventory = await getCurrentInventory(db, char.id)
      const currentItem = inventory.find((ci) => ci.item_id === itemId)

      if (!currentItem) {
        errors.item_id = "Character does not have this item"
      } else {
        // Check if the state is actually changing
        if (currentItem.worn === worn && currentItem.wielded === wielded) {
          errors.general = "Item equipment state is already set to these values"
        }
      }
    } catch (error) {
      errors.general = error instanceof Error ? error.message : "Failed to check inventory"
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = EquipItemApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually equip the item

  // Create a new char_items entry with the new worn/wielded state
  await createCharItemDb(db, {
    character_id: char.id,
    item_id: result.data.item_id,
    worn: result.data.worn,
    wielded: result.data.wielded,
    dropped_at: null,
    note: result.data.note || null,
  })

  return { complete: true, result: {} }
}

// Vercel AI SDK tool definition
export const equipItemToolName = "equip_item" as const
export const equipItemTool = tool({
  name: equipItemToolName,
  description: `Equip or unequip an item. Set worn=true for armor/clothing, wielded=true for weapons/shields. Both can be true (e.g., wearing magical armor).`,
  inputSchema: EquipItemApiSchema.omit({ is_check: true }),
})

/**
 * Execute the equip_item tool from AI assistant
 */
export async function executeEquipItem(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  const data: Record<string, string> = {
    item_id: parameters.item_id?.toString() || "",
    worn: (parameters.worn === true || parameters.worn === "true").toString(),
    wielded: (parameters.wielded === true || parameters.wielded === "true").toString(),
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return equipItem(db, char, data)
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
    message += ` with note '${note}'`
  }

  return message
}
