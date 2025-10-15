import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import type { HitDieType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  BooleanFormFieldSchema,
  NumberFormFieldSchema,
  OptionalNullStringSchema,
} from "@src/lib/schemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateHitDiceApiSchema = z.object({
  action: z.enum(["restore", "spend"]),
  die_value: NumberFormFieldSchema.int()
    .refine((val): val is HitDieType => [6, 8, 10, 12].includes(val))
    .optional(),
  hp_rolled: NumberFormFieldSchema.int().min(1).max(12).optional(),
  note: OptionalNullStringSchema,
  is_check: BooleanFormFieldSchema.optional().default(false),
})

export type UpdateHitDiceResult =
  | { complete: true; newHP?: number }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Update hit dice by creating appropriate records
 * For restore: creates single restore record for one die
 * For spend: creates use record and HP delta
 */
export async function updateHitDice(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateHitDiceResult> {
  const checkD = UpdateHitDiceApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const errors: Record<string, string> = {}
  const allHitDice = char.hitDice
  const availableHitDice = char.availableHitDice

  // Validate restore action
  if (checkD.data.action === "restore") {
    if (availableHitDice.length >= allHitDice.length) {
      errors.action = "All hit dice are already available"
    }

    // Validate die_value for restore
    if (data.die_value) {
      const dieValue = parseInt(data.die_value, 10)
      if (Number.isNaN(dieValue) || ![6, 8, 10, 12].includes(dieValue)) {
        errors.die_value = "Invalid die value"
      } else {
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
    } else if (!checkD.data.is_check) {
      errors.die_value = "Die value is required"
    }
  }

  // Validate spend action
  if (checkD.data.action === "spend") {
    if (availableHitDice.length === 0) {
      errors.action = "No hit dice available to spend"
    }

    // Validate die_value
    if (data.die_value) {
      const dieValue = parseInt(data.die_value, 10)
      if (Number.isNaN(dieValue) || ![6, 8, 10, 12].includes(dieValue)) {
        errors.die_value = "Invalid die value"
      } else if (!availableHitDice.includes(dieValue as HitDieType)) {
        errors.die_value = `You don't have a D${dieValue} available`
      }

      // Validate hp_rolled
      if (data.hp_rolled) {
        const hpRolled = parseInt(data.hp_rolled, 10)
        if (Number.isNaN(hpRolled) || hpRolled < 1 || hpRolled > dieValue) {
          errors.hp_rolled = `HP rolled must be between 1 and ${dieValue}`
        }
      } else if (!checkD.data.is_check) {
        errors.hp_rolled = "HP rolled is required"
      }
    } else if (!checkD.data.is_check) {
      errors.die_value = "Die value is required"
    }
  }

  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Parse and validate with Zod
  const result = UpdateHitDiceApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  //////////////////////////
  // actually update hit dice
  let newHP: number | undefined

  if (result.data.action === "restore") {
    // Restore: restore single die
    if (!result.data.die_value) {
      throw new Error("Die value is required for restoring")
    }

    await createHitDiceDb(db, {
      character_id: char.id,
      die_value: result.data.die_value,
      action: "restore",
      note: result.data.note || null,
    })
  } else {
    // Spend: create use record and HP delta
    if (!result.data.die_value || !result.data.hp_rolled) {
      throw new Error("Die value and HP rolled are required for spending")
    }

    // Create hit dice use record
    await createHitDiceDb(db, {
      character_id: char.id,
      die_value: result.data.die_value,
      action: "use",
      note: result.data.note || null,
    })

    // Create HP restoration record (capped at max HP)
    const hpToRestore = Math.min(result.data.hp_rolled, char.maxHitPoints - char.currentHP)
    if (hpToRestore > 0) {
      await createHPDb(db, {
        character_id: char.id,
        delta: hpToRestore,
        note: `Spent a D${result.data.die_value} hit die`,
      })
      newHP = char.currentHP + hpToRestore
    }
  }

  return { complete: true, newHP }
}
