import { create as createItemEffectDb } from "@src/db/item_effects"
import { ItemEffectAppliesSchema, ItemEffectOpSchema, ItemEffectTargetSchema } from "@src/lib/dnd"
import { parsedToForm, zodToFormErrors } from "@src/lib/formErrors"
import { BooleanFormFieldSchema, NumberFormFieldSchema, UnsetEnumSchema } from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"

// Base schema for creating an item effect
const BaseItemEffectSchema = z.object({
  item_id: z.string(),
  target: ItemEffectTargetSchema,
  op: ItemEffectOpSchema,
  value: NumberFormFieldSchema.int()
    .refine((val) => val !== 0, { message: "Value cannot be 0" })
    .nullable()
    .default(null),
  applies: ItemEffectAppliesSchema.or(z.literal("").transform(() => null)),
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export const CreateItemEffectApiSchema = BaseItemEffectSchema
const CheckSchema = BaseItemEffectSchema.extend(z.object({
  target: UnsetEnumSchema(ItemEffectTargetSchema),
  op: UnsetEnumSchema(ItemEffectOpSchema),
}).shape).partial()

export type CreateItemEffectData = z.infer<typeof CreateItemEffectApiSchema>

export type CreateItemEffectResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors?: Record<string, string> }

/**
 * Creates a new item effect
 */
export async function createItemEffect(
  db: SQL,
  data: Record<string, string>
): Promise<CreateItemEffectResult> {
  const errors: Record<string, string> = {}

  // Partial validation for check mode
  const partial = CheckSchema.safeParse(data)
  if (!partial.success) {
    console.log("Partial validation failed:", partial.error)
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
    return { complete: false, values: parsedToForm(values), errors }
  }

  // Full Zod validation
  const result = CreateItemEffectApiSchema.safeParse(data)

  if (!result.success) {
    return { complete: false, values: parsedToForm(values), errors: zodToFormErrors(result.error) }
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

    return { complete: true }
  } catch (error) {
    console.error("Error creating item effect:", error)
    return {
      complete: false,
      values: data,
      errors: { general: "Failed to create item effect. Please try again." },
    }
  }
}
