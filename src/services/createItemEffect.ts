import { create as createItemEffectDb } from "@src/db/item_effects"
import { ItemEffectAppliesSchema, ItemEffectOpSchema, ItemEffectTargetSchema } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, EnumField, NumberField } from "@src/lib/formSchemas"
import { logger } from "@src/lib/logger"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

// Base schema for creating an item effect
const BaseItemEffectSchema = z.object({
  item_id: z.string(),
  target: ItemEffectTargetSchema,
  op: ItemEffectOpSchema,
  value: NumberField(
    z
      .number()
      .int({ message: "Must be a whole number" })
      .refine((val) => val !== 0, { message: "Value cannot be 0" })
      .nullable()
      .default(null)
  ),
  applies: EnumField(ItemEffectAppliesSchema.nullable().default(null)),
  is_check: Checkbox().optional().default(false),
})

export const CreateItemEffectApiSchema = BaseItemEffectSchema
const CheckSchema = BaseItemEffectSchema.extend(
  z.object({
    target: EnumField(ItemEffectTargetSchema.nullable()),
    op: EnumField(ItemEffectOpSchema.nullable()),
  }).shape
).partial()

export type CreateItemEffectData = z.infer<typeof CreateItemEffectApiSchema>

export type CreateItemEffectResult = ServiceResult<object>

/**
 * Creates a new item effect
 */
export async function createItemEffect(
  db: SQL,
  _char: ComputedCharacter,
  data: Record<string, string>
): Promise<CreateItemEffectResult> {
  const errors: Record<string, string> = {}

  // Partial validation for check mode
  const partial = CheckSchema.safeParse(data)
  if (!partial.success) {
    logger.error("Partial validation failed:", partial.error)
    return {
      complete: false,
      values: data,
      errors: zodToFormErrors(partial.error),
    }
  }

  const values = partial.data
  const isCheck = values.is_check

  // Soft validation for check mode
  if (!values.target && !isCheck) {
    errors.target = "Target is required"
  }

  if (!values.op && !isCheck) {
    errors.op = "Operation is required"
  }

  // Note: applies can be null (meaning "always"), so we don't validate it as required

  // Validate value is required for add/set operations
  if (values.op === "add" || values.op === "set") {
    if (values.value === undefined || values.value === null) {
      if (!isCheck) {
        errors.value = `Value is required for ${values.op} operation`
      }
    }
  }

  // Early return if validation errors or check mode
  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Full Zod validation
  const result = CreateItemEffectApiSchema.safeParse(data)

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Create the item effect
  try {
    await createItemEffectDb(db, {
      item_id: result.data.item_id,
      target: result.data.target,
      op: result.data.op,
      value: result.data.value,
      applies: result.data.applies,
    })

    return { complete: true, result: {} }
  } catch (error) {
    logger.error("Error creating item effect:", error as Error)
    return {
      complete: false,
      values: data,
      errors: { general: "Failed to create item effect. Please try again." },
    }
  }
}

// ============================================================================
// Tool Definition
// ============================================================================

export const createItemEffectToolName = "create_item_effect" as const

const CreateItemEffectToolSchema = z.object({
  item_id: z.string().describe("The ID of the item to add the effect to"),
  target: ItemEffectTargetSchema.describe(
    "What the effect targets (skill, ability, ac, speed, attack, damage, initiative, or passive perception)"
  ),
  op: ItemEffectOpSchema.describe(
    "The operation: 'add' or 'set' for numeric changes, 'advantage', 'disadvantage', 'proficiency', or 'expertise' for special effects"
  ),
  value: z
    .number()
    .int({ message: "Must be a whole number" })
    .refine((val) => val !== 0, { message: "Value cannot be 0" })
    .nullable()
    .optional()
    .describe(
      "Numeric value for 'add' or 'set' operations (required for these ops, null/omit for others)"
    ),
  applies: z
    .enum(["worn", "wielded"])
    .nullable()
    .optional()
    .describe(
      "When the effect applies: 'worn' for armor/clothing, 'wielded' for weapons, null/omit for always active"
    ),
})

/**
 * Vercel AI SDK tool definition for creating item effects
 * This tool requires approval before execution
 */
export const createItemEffectTool = tool({
  name: createItemEffectToolName,
  description: [
    "Add a magical or special effect to an item.",
    "Effects can modify skills, abilities, AC, speed, attack rolls, damage, initiative, or passive perception.",
    "Use 'add' to add a bonus, 'set' to set a specific value, or use advantage/disadvantage/proficiency/expertise for special effects.",
    "Specify 'applies' as 'worn' or 'wielded' to make the effect conditional, or omit for always-active effects.",
  ].join(" "),
  inputSchema: CreateItemEffectToolSchema,
})

/**
 * Execute the create_item_effect tool from AI assistant
 * Converts AI parameters to service format and calls createItemEffect
 */
export async function executeCreateItemEffect(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  // Convert parameters to the format expected by createItemEffect service
  const data: Record<string, string> = {}

  for (const [key, value] of Object.entries(parameters)) {
    if (value !== null && value !== undefined) {
      data[key] = value.toString()
    }
  }

  // Add is_check flag
  data.is_check = isCheck ? "true" : "false"

  // Call the existing createItemEffect service and return its result directly
  return createItemEffect(db, char, data)
}

/**
 * Format approval message for create_item_effect tool calls
 */
export function formatCreateItemEffectApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { target, op, value, applies } = parameters

  let message = `Add effect to item: ${op} `

  if (value !== null && value !== undefined) {
    message += `${value > 0 ? "+" : ""}${value} `
  }

  message += `to ${target}`

  if (applies) {
    message += ` when ${applies}`
  }

  return message
}
