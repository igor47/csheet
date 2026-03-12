import { findById, update as updateTrait } from "@src/db/char_traits"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { SQL } from "bun"
import type { ComputedCharacter } from "./computeCharacter"

export type UpdateTraitResult = ServiceResult<object>

/**
 * Update a custom trait on a character
 * Validates that:
 * - Trait exists
 * - Trait belongs to the character
 * - Trait source is "custom" (only custom traits can be edited)
 * - Name and description are provided
 */
export async function updateTraitService(
  db: SQL,
  char: ComputedCharacter,
  traitId: string,
  data: Record<string, string>
): Promise<UpdateTraitResult> {
  const errors: Record<string, string> = {}
  const values = data

  // Find the trait
  const trait = await findById(db, traitId)

  if (!trait) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Trait not found" },
    }
  }

  // Verify trait belongs to character
  if (trait.character_id !== char.id) {
    return {
      complete: false,
      values: data,
      errors: { _form: "Trait not found" },
    }
  }

  // Verify trait is custom
  if (trait.source !== "custom") {
    return {
      complete: false,
      values: data,
      errors: { _form: "Only custom traits can be edited" },
    }
  }

  // Validate name
  if (!values.name || values.name.trim().length === 0) {
    errors.name = "Trait name is required"
  }

  // Validate description
  if (!values.description || values.description.trim().length === 0) {
    errors.description = "Trait description is required"
  }

  if (Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Update the trait
  await updateTrait(db, traitId, {
    name: values.name!.trim(),
    description: values.description!.trim(),
    note: values.note?.trim() || null,
  })

  return { complete: true, result: {} }
}
