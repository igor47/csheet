import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { SpellSlotsType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateSpellSlotsApiSchema = z.object({
  character_id: z.string(),
  action: z.enum(["use", "restore"]),
  slot_level: z.number().int().min(1).max(9),
  note: z.string().nullable().optional(),
})

export type UpdateSpellSlotsApi = z.infer<typeof UpdateSpellSlotsApiSchema>

export type UpdateSpellSlotsResult =
  | { complete: true }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update spell slots by creating appropriate records
 * For use: creates use record for one slot
 * For restore: creates restore record for one slot
 */
export async function updateSpellSlots(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateSpellSlotsResult> {
  const errors: Record<string, string> = {}
  const isCheck = data.is_check === "true"
  const allSlots = char.spellSlots
  const availableSlots = char.availableSpellSlots

  // Validate action
  if (!data.action) {
    if (!isCheck) {
      errors.action = "Action is required"
    }
  } else if (data.action !== "use" && data.action !== "restore") {
    errors.action = "Invalid action"
  }

  // Validate use action
  if (data.action === "use") {
    // Check if any slots are available
    let hasAvailableSlots = false
    if (availableSlots) {
      for (let level = 1; level <= 9; level++) {
        const available = availableSlots.filter((lvl) => lvl === level).length
        if (available > 0) {
          hasAvailableSlots = true
          break
        }
      }
    }

    if (!hasAvailableSlots) {
      errors.action = "No spell slots available to use"
    }

    // Validate slot_level
    if (data.slot_level) {
      const slotLevel = parseInt(data.slot_level, 10)
      if (Number.isNaN(slotLevel) || slotLevel < 1 || slotLevel > 9) {
        errors.slot_level = "Invalid slot level"
      } else {
        const available = availableSlots.filter((lvl) => lvl === slotLevel).length
        if (available <= 0) {
          errors.slot_level = `No Level ${slotLevel} slots available`
        }
      }
    } else if (!isCheck) {
      errors.slot_level = "Slot level is required"
    }
  }

  // Validate restore action
  if (data.action === "restore") {
    // Check if any slots are used
    let hasUsedSlots = false
    if (allSlots && availableSlots) {
      for (let level = 1; level <= 9; level++) {
        const total = allSlots[level as keyof SpellSlotsType] || 0
        const available = availableSlots[level as keyof SpellSlotsType] || 0
        if (available < total) {
          hasUsedSlots = true
          break
        }
      }
    }

    if (!hasUsedSlots) {
      errors.action = "No spell slots to restore"
    }

    // Validate slot_level
    if (data.slot_level) {
      const slotLevel = parseInt(data.slot_level, 10)
      if (Number.isNaN(slotLevel) || slotLevel < 1 || slotLevel > 9) {
        errors.slot_level = "Invalid slot level"
      } else {
        const total = allSlots?.[slotLevel as keyof SpellSlotsType] || 0
        const available = availableSlots?.[slotLevel as keyof SpellSlotsType] || 0
        if (available >= total) {
          errors.slot_level = `All Level ${slotLevel} slots are already available`
        }
      }
    } else if (!isCheck) {
      errors.slot_level = "Slot level is required"
    }
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // If we got here, let's actually validate and persist the data
  const result = UpdateSpellSlotsApiSchema.safeParse({
    character_id: char.id,
    action: data.action,
    slot_level: parseInt(data.slot_level!, 10),
    note: data.note ? data.note : null,
  })

  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  if (result.data.action === "use") {
    await createSpellSlotDb(db, {
      character_id: result.data.character_id,
      slot_level: result.data.slot_level,
      action: "use",
      note: result.data.note || null,
    })
  } else if (result.data.action === "restore") {
    await createSpellSlotDb(db, {
      character_id: result.data.character_id,
      slot_level: result.data.slot_level,
      action: "restore",
      note: result.data.note || null,
    })
  }

  return { complete: true }
}
