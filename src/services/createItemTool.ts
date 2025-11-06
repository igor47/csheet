import { tool } from "ai"
import type { SQL } from "bun"
import type { ComputedCharacter } from "./computeCharacter"
import { BaseItemSchema, createItem, ItemTypeSchemas } from "./createItem"

export const createItemToolName = "create_item" as const
const InputSchema = BaseItemSchema.omit({
  is_check: true,
  template: true,
  prev_template: true,
}).and(ItemTypeSchemas)

/**
 * Vercel AI SDK tool definition for item creation
 * This tool requires approval before execution
 */
export const createItemTool = tool({
  name: createItemToolName,
  description: [
    "Create a new item and add it to the character's inventory.",
    "The item will be added to inventory but not equipped.",
    "You can create weapons, armor, shields, or misc items. For weapons, you must specify damage dice.",
    "For armor, you must specify armor_class and armor_type. For shields, you must specify armor_modifier.",
    "For common items, you can use lookup_item_template tool first to get item details from the SRD, then pass those details here.",
  ].join(" "),
  inputSchema: InputSchema,
})

/**
 * Execute the create_item tool from AI assistant
 * Converts AI parameters to service format and calls createItem
 */
export async function executeCreateItem(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert all parameters to string format for the service
  const data: Record<string, string> = {}

  // Convert each parameter to string, handling all the possible fields
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== null && value !== undefined) {
      data[key] = value.toString()
    }
  }

  // Add is_check flag
  data.is_check = isCheck ? "true" : "false"

  // Call the existing createItem service and return its result directly
  return createItem(db, char.user_id, data)
}

/**
 * Format approval message for create_item tool calls
 */
export function formatCreateItemApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { name, category, description } = parameters
  let message = `Create ${category}: ${name}`

  // Add category-specific details
  if (category === "weapon") {
    const weaponDetails = []
    if (parameters.weapon_type) {
      weaponDetails.push(parameters.weapon_type)
    }
    if (parameters.martial) {
      weaponDetails.push("martial")
    }
    if (parameters.finesse) {
      weaponDetails.push("finesse")
    }
    if (parameters.two_handed) {
      weaponDetails.push("two-handed")
    }

    // Add damage info
    if (parameters.damage_num_dice_0 && parameters.damage_die_value_0) {
      const damage = `${parameters.damage_num_dice_0}d${parameters.damage_die_value_0}`
      const damageType = parameters.damage_type_0 || ""
      weaponDetails.push(`${damage} ${damageType}`)
    }

    if (weaponDetails.length > 0) {
      message += ` (${weaponDetails.join(", ")})`
    }
  } else if (category === "armor") {
    const armorDetails = []
    if (parameters.armor_type) {
      armorDetails.push(parameters.armor_type)
    }
    if (parameters.armor_class) {
      armorDetails.push(`AC ${parameters.armor_class}`)
    }
    if (parameters.stealth_disadvantage) {
      armorDetails.push("stealth disadvantage")
    }
    if (armorDetails.length > 0) {
      message += ` (${armorDetails.join(", ")})`
    }
  } else if (category === "shield") {
    if (parameters.armor_modifier) {
      message += ` (+${parameters.armor_modifier} AC)`
    }
  }

  if (description) {
    message += `\n${description}`
  }

  return message
}
