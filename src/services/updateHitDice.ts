import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import type { HitDieType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumberField, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const UpdateHitDiceApiSchema = z.object({
  action: z
    .enum(["restore", "spend"])
    .describe("Whether to spend a hit die (during short rest) or restore a hit die"),
  die_value: NumberField(
    z
      .number()
      .int({ message: "Must be a whole number" })
      .refine((val): val is HitDieType => [6, 8, 10, 12].includes(val), {
        message: "Hit die must be 6, 8, 10, or 12",
      })
      .nullable()
  )
    .optional()
    .describe("The type of hit die (6, 8, 10, or 12)"),
  hp_rolled: NumberField(
    z
      .number()
      .int({ message: "Must be a whole number" })
      .min(1, { message: "Must be at least 1" })
      .max(12, { message: "Cannot exceed 12" })
      .nullable()
  )
    .optional()
    .describe("The HP rolled when spending a hit die (required for spend action)"),
  note: OptionalString().describe("Optional note about the hit die use or restoration"),
  is_check: Checkbox().optional().default(false),
})

export type UpdateHitDiceResult = ServiceResult<{ newHP?: number }>

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

    // Calculate HP gain: roll + constitution modifier (minimum 1)
    const conMod = char.abilityScores.constitution.modifier
    const hpGain = Math.max(1, result.data.hp_rolled + conMod)

    // Create HP restoration record (capped at max HP)
    const hpToRestore = Math.min(hpGain, char.maxHitPoints - char.currentHP)
    if (hpToRestore > 0) {
      await createHPDb(db, {
        character_id: char.id,
        delta: hpToRestore,
        note: `Spent a D${result.data.die_value} hit die - Rolled ${result.data.hp_rolled} + ${conMod} CON`,
      })
      newHP = char.currentHP + hpToRestore
    }
  }

  return { complete: true, result: { newHP } }
}

// Vercel AI SDK tool definitions
export const useHitDieToolName = "use_hit_die" as const
export const useHitDieTool = tool({
  name: useHitDieToolName,
  description: `Spend a hit die during a short rest to regain HP. The character rolls the hit die and regains that much HP (plus Constitution modifier). Ask the user to roll the die and provide the result.`,
  inputSchema: UpdateHitDiceApiSchema.omit({ action: true, is_check: true }).required({
    die_value: true,
    hp_rolled: true,
  }),
})

export const restoreHitDieToolName = "restore_hit_die" as const
export const restoreHitDieTool = tool({
  name: restoreHitDieToolName,
  description: `Restore a spent hit die. This can happen from features like the Durable feat or certain class abilities. Long rests automatically restore half of spent hit dice.`,
  inputSchema: UpdateHitDiceApiSchema.omit({
    action: true,
    hp_rolled: true,
    is_check: true,
  }).required({ die_value: true }),
})

/**
 * Execute the use_hit_die tool from AI assistant
 */
export async function executeUseHitDie(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  const data: Record<string, string> = {
    action: "spend",
    die_value: parameters.die_value?.toString() || "",
    hp_rolled: parameters.hp_rolled?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return updateHitDice(db, char, data)
}

/**
 * Execute the restore_hit_die tool from AI assistant
 */
export async function executeRestoreHitDie(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  const data: Record<string, string> = {
    action: "restore",
    die_value: parameters.die_value?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return updateHitDice(db, char, data)
}

/**
 * Format approval message for use_hit_die tool calls
 */
export function formatUseHitDieApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { die_value, hp_rolled, note } = parameters

  let message = `Spend D${die_value} hit die (rolled ${hp_rolled} HP)`

  if (note) {
    message += `\n${note}`
  }

  return message
}

/**
 * Format approval message for restore_hit_die tool calls
 */
export function formatRestoreHitDieApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { die_value, note } = parameters

  let message = `Restore D${die_value} hit die`

  if (note) {
    message += `\n${note}`
  }

  return message
}
