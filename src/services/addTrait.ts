import { create as createTrait, TraitSourceSchema } from "@src/db/char_traits"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { SQL } from "bun"
import { z } from "zod"

export const AddTraitApiSchema = z.object({
  character_id: z.string(),
  name: z.string().min(1, "Trait name is required"),
  description: z.string().min(1, "Trait description is required"),
  source: TraitSourceSchema,
  source_detail: z.string().nullable().optional().default(null),
  level: z.number().int().nullable().optional().default(null),
  note: z.string().nullable().optional().default(null),
})

type AddTraitData = Partial<z.infer<typeof AddTraitApiSchema>>

export type AddTraitResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Add a trait to a character
 * Can be called with isCheck for validation or without for persistence
 */
export async function addTrait(
  db: SQL,
  data: Record<string, string>
): Promise<AddTraitResult> {
  const errors: Record<string, string> = {}
  const values = data as AddTraitData
  const isCheck = data.is_check === "true"

  // Soft validation for is_check
  if (!values.character_id && !isCheck) {
    errors.character_id = "Character ID is required"
  }

  if (!values.name) {
    if (!isCheck) {
      errors.name = "Trait name is required"
    }
  } else if (values.name.trim().length === 0) {
    errors.name = "Trait name is required"
  }

  if (!values.description) {
    if (!isCheck) {
      errors.description = "Trait description is required"
    }
  } else if (values.description.trim().length === 0) {
    errors.description = "Trait description is required"
  }

  if (!values.source && !isCheck) {
    errors.source = "Trait source is required"
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Full validation with Zod
  const result = AddTraitApiSchema.safeParse({
    ...values,
    level: values.level ? Number(values.level) : null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Persist the trait
  await createTrait(db, result.data)

  return { complete: true }
}
