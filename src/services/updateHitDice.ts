import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import type { HitDieType } from "@src/lib/dnd"
import type { SQL } from "bun"
import { z } from "zod"

export const UpdateHitDiceApiSchema = z.object({
  character_id: z.string(),
  action: z.enum(["restore", "spend"]),
  die_value: z
    .number()
    .int()
    .refine((val): val is HitDieType => [6, 8, 10, 12].includes(val))
    .nullable()
    .optional(),
  hp_rolled: z.number().int().min(1).max(12).nullable().optional(),
  note: z.string().nullable().optional(),
})

export type UpdateHitDiceApi = z.infer<typeof UpdateHitDiceApiSchema>

/**
 * Prepare form values for live validation (/check endpoint)
 * Mutates values to be helpful
 * Returns soft validation hints
 */
export function prepareUpdateHitDiceForm(
  values: Record<string, string>,
  allHitDice: HitDieType[],
  availableHitDice: HitDieType[]
): { values: Record<string, string>; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const preparedValues = { ...values }

  // Default action
  if (!preparedValues.action) {
    preparedValues.action = availableHitDice.length < allHitDice.length ? "restore" : "spend"
  }

  // Validate action
  if (preparedValues.action !== "restore" && preparedValues.action !== "spend") {
    errors.action = "Action must be 'restore' or 'spend'"
    return { values: preparedValues, errors }
  }

  // Validate restore action
  if (preparedValues.action === "restore") {
    if (availableHitDice.length >= allHitDice.length) {
      errors.action = "All hit dice are already available"
      return { values: preparedValues, errors }
    }

    // Validate die_value for restore
    if (preparedValues.die_value) {
      const dieValue = parseInt(preparedValues.die_value)
      if (isNaN(dieValue) || ![6, 8, 10, 12].includes(dieValue)) {
        errors.die_value = "Invalid die value"
      } else {
        // Check if this die type is actually used
        const usedDice = [...allHitDice]
        for (const die of availableHitDice) {
          const index = usedDice.indexOf(die)
          if (index !== -1) {
            usedDice.splice(index, 1)
          }
        }
        if (!usedDice.includes(dieValue as HitDieType)) {
          errors.die_value = `You don't have a used D${dieValue}`
        }
      }
    }
  }

  // Validate spend action
  if (preparedValues.action === "spend") {
    if (availableHitDice.length === 0) {
      errors.action = "No hit dice available to spend"
      return { values: preparedValues, errors }
    }

    // Validate die_value
    if (preparedValues.die_value) {
      const dieValue = parseInt(preparedValues.die_value)
      if (isNaN(dieValue) || ![6, 8, 10, 12].includes(dieValue)) {
        errors.die_value = "Invalid die value"
      } else if (!availableHitDice.includes(dieValue as HitDieType)) {
        errors.die_value = `You don't have a D${dieValue} available`
      }

      // Validate hp_rolled
      if (preparedValues.hp_rolled) {
        const hpRolled = parseInt(preparedValues.hp_rolled)
        if (isNaN(hpRolled) || hpRolled < 1 || hpRolled > dieValue) {
          errors.hp_rolled = `HP rolled must be between 1 and ${dieValue}`
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
export function validateUpdateHitDice(
  values: Record<string, string>,
  allHitDice: HitDieType[],
  availableHitDice: HitDieType[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate action
  if (!values.action) {
    errors.action = "Action is required"
    return { valid: false, errors }
  }

  if (values.action !== "restore" && values.action !== "spend") {
    errors.action = "Invalid action"
    return { valid: false, errors }
  }

  // Validate restore
  if (values.action === "restore") {
    if (availableHitDice.length >= allHitDice.length) {
      errors.action = "All hit dice are already available"
      return { valid: false, errors }
    }

    if (!values.die_value) {
      errors.die_value = "Die value is required"
      return { valid: false, errors }
    }

    const dieValue = parseInt(values.die_value)
    if (isNaN(dieValue) || ![6, 8, 10, 12].includes(dieValue)) {
      errors.die_value = "Invalid die value"
      return { valid: false, errors }
    }

    // Check if this die type is actually used
    const usedDice = [...allHitDice]
    for (const die of availableHitDice) {
      const index = usedDice.indexOf(die)
      if (index !== -1) {
        usedDice.splice(index, 1)
      }
    }
    if (!usedDice.includes(dieValue as HitDieType)) {
      errors.die_value = `You don't have a used D${dieValue}`
      return { valid: false, errors }
    }
  }

  // Validate spend
  if (values.action === "spend") {
    if (availableHitDice.length === 0) {
      errors.action = "No hit dice available to spend"
      return { valid: false, errors }
    }

    if (!values.die_value) {
      errors.die_value = "Die value is required"
      return { valid: false, errors }
    }

    const dieValue = parseInt(values.die_value)
    if (isNaN(dieValue) || ![6, 8, 10, 12].includes(dieValue)) {
      errors.die_value = "Invalid die value"
      return { valid: false, errors }
    }

    if (!availableHitDice.includes(dieValue as HitDieType)) {
      errors.die_value = `You don't have a D${dieValue} available`
      return { valid: false, errors }
    }

    if (!values.hp_rolled) {
      errors.hp_rolled = "HP rolled is required"
      return { valid: false, errors }
    }

    const hpRolled = parseInt(values.hp_rolled)
    if (isNaN(hpRolled) || hpRolled < 1 || hpRolled > dieValue) {
      errors.hp_rolled = `HP rolled must be between 1 and ${dieValue}`
      return { valid: false, errors }
    }
  }

  const valid = Object.keys(errors).length === 0
  return { valid, errors }
}

/**
 * Update hit dice by creating appropriate records
 * For restore: creates single restore record for one die
 * For spend: creates use record and HP delta
 */
export async function updateHitDice(
  db: SQL,
  data: UpdateHitDiceApi,
  allHitDice: HitDieType[],
  availableHitDice: HitDieType[],
  currentHP: number,
  maxHitPoints: number
): Promise<void> {
  if (data.action === "restore") {
    // Restore: restore single die
    if (!data.die_value) {
      throw new Error("Die value is required for restoring")
    }

    await createHitDiceDb(db, {
      character_id: data.character_id,
      die_value: data.die_value,
      action: "restore",
      note: data.note || null,
    })
  } else {
    // Spend: create use record and HP delta
    if (!data.die_value || !data.hp_rolled) {
      throw new Error("Die value and HP rolled are required for spending")
    }

    // Create hit dice use record
    await createHitDiceDb(db, {
      character_id: data.character_id,
      die_value: data.die_value,
      action: "use",
      note: data.note || null,
    })

    // Create HP restoration record (capped at max HP)
    const hpToRestore = Math.min(data.hp_rolled, maxHitPoints - currentHP)
    if (hpToRestore > 0) {
      await createHPDb(db, {
        character_id: data.character_id,
        delta: hpToRestore,
        note: `Spent a D${data.die_value} hit die`,
      })
    }
  }
}
