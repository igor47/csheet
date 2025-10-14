import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { SlotsBySpellLevel } from "@src/lib/dnd"
import type { SQL } from "bun"
import { z } from "zod"

export const UpdateSpellSlotsApiSchema = z.object({
  character_id: z.string(),
  action: z.enum(["use", "restore"]),
  slot_level: z.number().int().min(1).max(9).nullable().optional(),
  note: z.string().nullable().optional(),
})

export type UpdateSpellSlotsApi = z.infer<typeof UpdateSpellSlotsApiSchema>

/**
 * Prepare form values for live validation (/check endpoint)
 * Mutates values to be helpful
 * Returns soft validation hints
 */
export function prepareUpdateSpellSlotsForm(
  values: Record<string, string>,
  allSlots: SlotsBySpellLevel | null,
  availableSlots: SlotsBySpellLevel | null
): { values: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const preparedValues = { ...values }

  // Default action
  if (!preparedValues.action) {
    // Default to restore if any slots are used, otherwise use
    let hasUsedSlots = false
    if (allSlots && availableSlots) {
      for (let level = 1; level <= 9; level++) {
        const total = allSlots[level as keyof SlotsBySpellLevel] || 0
        const available = availableSlots[level as keyof SlotsBySpellLevel] || 0
        if (available < total) {
          hasUsedSlots = true
          break
        }
      }
    }
    preparedValues.action = hasUsedSlots ? "restore" : "use"
  }

  // Validate action
  if (preparedValues.action !== "use" && preparedValues.action !== "restore") {
    errors.action = "Action must be 'use' or 'restore'"
    return { values: preparedValues, errors }
  }

  // Validate use action
  if (preparedValues.action === "use") {
    // Check if any slots are available
    let hasAvailableSlots = false
    if (availableSlots) {
      for (let level = 1; level <= 9; level++) {
        const available = availableSlots[level as keyof SlotsBySpellLevel] || 0
        if (available > 0) {
          hasAvailableSlots = true
          break
        }
      }
    }

    if (!hasAvailableSlots) {
      errors.action = "No spell slots available to use"
      return { values: preparedValues, errors }
    }

    // Validate slot_level
    if (preparedValues.slot_level) {
      const slotLevel = parseInt(preparedValues.slot_level, 10)
      if (Number.isNaN(slotLevel) || slotLevel < 1 || slotLevel > 9) {
        errors.slot_level = "Invalid slot level"
      } else {
        const available = availableSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
        if (available <= 0) {
          errors.slot_level = `No Level ${slotLevel} slots available`
        }
      }
    }
  }

  // Validate restore action
  if (preparedValues.action === "restore") {
    // Check if any slots are used
    let hasUsedSlots = false
    if (allSlots && availableSlots) {
      for (let level = 1; level <= 9; level++) {
        const total = allSlots[level as keyof SlotsBySpellLevel] || 0
        const available = availableSlots[level as keyof SlotsBySpellLevel] || 0
        if (available < total) {
          hasUsedSlots = true
          break
        }
      }
    }

    if (!hasUsedSlots) {
      errors.action = "No spell slots to restore"
      return { values: preparedValues, errors }
    }

    // Validate slot_level
    if (preparedValues.slot_level) {
      const slotLevel = parseInt(preparedValues.slot_level, 10)
      if (Number.isNaN(slotLevel) || slotLevel < 1 || slotLevel > 9) {
        errors.slot_level = "Invalid slot level"
      } else {
        const total = allSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
        const available = availableSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
        if (available >= total) {
          errors.slot_level = `All Level ${slotLevel} slots are already available`
        }
      }
    }
  }

  return { values: preparedValues, errors }
}

/**
 * Strict validation for form submission (POST endpoint)
 * Does NOT mutate values - validates as-is
 * Returns hard errors
 */
export function validateUpdateSpellSlots(
  values: Record<string, string>,
  allSlots: SlotsBySpellLevel | null,
  availableSlots: SlotsBySpellLevel | null
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate action
  if (!values.action) {
    errors.action = "Action is required"
    return { valid: false, errors }
  }

  if (values.action !== "use" && values.action !== "restore") {
    errors.action = "Invalid action"
    return { valid: false, errors }
  }

  // Validate use
  if (values.action === "use") {
    if (!values.slot_level) {
      errors.slot_level = "Slot level is required"
      return { valid: false, errors }
    }

    const slotLevel = parseInt(values.slot_level, 10)
    if (Number.isNaN(slotLevel) || slotLevel < 1 || slotLevel > 9) {
      errors.slot_level = "Invalid slot level"
      return { valid: false, errors }
    }

    const available = availableSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
    if (available <= 0) {
      errors.slot_level = `No Level ${slotLevel} slots available`
      return { valid: false, errors }
    }
  }

  // Validate restore
  if (values.action === "restore") {
    if (!values.slot_level) {
      errors.slot_level = "Slot level is required"
      return { valid: false, errors }
    }

    const slotLevel = parseInt(values.slot_level, 10)
    if (Number.isNaN(slotLevel) || slotLevel < 1 || slotLevel > 9) {
      errors.slot_level = "Invalid slot level"
      return { valid: false, errors }
    }

    const total = allSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
    const available = availableSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
    if (available >= total) {
      errors.slot_level = `All Level ${slotLevel} slots are already available`
      return { valid: false, errors }
    }
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors }
}

/**
 * Update spell slots by creating appropriate records
 * For use: creates use record for one slot
 * For restore: creates restore record for one slot
 */
export async function updateSpellSlots(
  db: SQL,
  data: UpdateSpellSlotsApi,
  _allSlots: SlotsBySpellLevel | null,
  _availableSlots: SlotsBySpellLevel | null
): Promise<void> {
  if (data.action === "use") {
    // Use: create use record for one slot
    if (!data.slot_level) {
      throw new Error("Slot level is required for using")
    }

    await createSpellSlotDb(db, {
      character_id: data.character_id,
      slot_level: data.slot_level,
      action: "use",
      note: data.note || null,
    })
  } else if (data.action === "restore") {
    // Restore: create restore record for one slot
    if (!data.slot_level) {
      throw new Error("Slot level is required for restoring")
    }

    await createSpellSlotDb(db, {
      character_id: data.character_id,
      slot_level: data.slot_level,
      action: "restore",
      note: data.note || null,
    })
  }
}
