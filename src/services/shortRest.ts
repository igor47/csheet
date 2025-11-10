import { beginOrSavepoint } from "@src/db"
import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { HitDieType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  ArrayField,
  Checkbox,
  NumberField,
  ObjectArrayField,
  OptionalString,
} from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { updateHitDice } from "./updateHitDice"

export const ShortRestApiSchema = z.object({
  note: OptionalString().describe("Optional note about the circumstances of the short rest"),
  is_check: Checkbox().optional().default(false),

  // Hit dice spending - array of {die, roll} objects
  dice: ObjectArrayField(
    z.object({
      die: NumberField(
        z.number().refine((v) => [6, 8, 10, 12].includes(v), {
          message: "Die value must be 6, 8, 10, or 12",
        })
      ).describe("The type of hit die (6, 8, 10, or 12)"),
      roll: NumberField(z.number().int().min(1).max(12).nullable()).describe(
        "The HP rolled when spending this hit die"
      ),
    })
  )
    .optional()
    .default([])
    .describe(
      "Array of hit dice to spend. Each die has a value (6/8/10/12) and roll (1 to die value)"
    ),

  // Arcane Recovery (Wizards only)
  arcane_recovery: Checkbox()
    .optional()
    .default(false)
    .describe(
      "Whether to use Arcane Recovery (Wizards only). Allows recovering spell slots with combined levels up to half wizard level (rounded up), maximum 5th level slots"
    ),
  "arcane_slots[]": ArrayField(z.array(NumberField(z.number().int().min(1).max(5))))
    .optional()
    .default([])
    .describe("Array of spell slot levels (1-5) to restore via Arcane Recovery"),
})

export type ShortRestApi = z.infer<typeof ShortRestApiSchema>

export interface ShortRestSummary {
  hpRestored: number
  hitDiceSpent: number
  diceRolls: Array<{ die: number; roll: number; modifier: number }>
  spellSlotsRestored: number
  arcaneRecoveryUsed: boolean
}

export type ShortRestResult = ServiceResult<ShortRestSummary>

/**
 * Perform a short rest for a character
 * - In D&D 5e, a short rest is at least 1 hour of downtime
 * - Characters can spend hit dice to recover HP during a short rest
 * - Wizards can use Arcane Recovery to restore spell slots
 */
export async function shortRest(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Form data can include arrays and objects from parseBody
  data: Record<string, any>
): Promise<ShortRestResult> {
  // Stage 1: Partial Zod validation
  const checkD = ShortRestApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const values = checkD.data

  // Stage 2: Custom validation
  const errors: Record<string, string> = {}

  // Parse and validate hit dice
  const selectedDice: Array<{ index: number; die: HitDieType; roll?: number }> = []
  const remainingHitDice = [...char.availableHitDice]

  const dice = values.dice || []
  for (let i = 0; i < dice.length; i++) {
    const diceEntry = dice[i]
    if (!diceEntry) continue
    const dieNum = diceEntry.die as HitDieType
    const roll = diceEntry.roll

    // Skip dice with no roll (empty/null) - these are UI-only, not being spent
    if (roll === null || roll === undefined) {
      continue
    }

    // Check if this die is available in remainingHitDice
    const availableIndex = remainingHitDice.indexOf(dieNum)
    if (availableIndex === -1) {
      errors[`dice.${i}.die`] = `You don't have a d${dieNum} hit die available`
      continue
    }

    // Remove from remainingHitDice to prevent double-spending
    remainingHitDice.splice(availableIndex, 1)

    // Find the original index in char.availableHitDice for tracking
    const originalIndex = char.availableHitDice.indexOf(dieNum)

    // Validate roll value (we know it's not null/undefined at this point)
    if (roll < 1 || roll > dieNum) {
      errors[`dice.${i}.roll`] = `Roll must be between 1 and ${dieNum}`
    }

    selectedDice.push({ index: originalIndex, die: dieNum, roll })
  }

  // Validate Arcane Recovery
  if (values.arcane_recovery) {
    const wizardClass = char.classes.find((c) => c.class === "wizard")
    if (!wizardClass) {
      errors.arcane_recovery = "Only Wizards can use Arcane Recovery"
    } else {
      const maxArcaneRecoveryLevel = Math.min(5, Math.ceil(wizardClass.level / 2))
      const selectedSlotLevels = values["arcane_slots[]"] || []

      // Calculate total slot levels
      const totalSlotLevels = selectedSlotLevels.reduce(
        (sum: number, level: number) => sum + level,
        0
      )
      if (totalSlotLevels > maxArcaneRecoveryLevel) {
        errors["arcane_slots[]"] =
          `Total slot levels (${totalSlotLevels}) exceeds maximum (${maxArcaneRecoveryLevel})`
      }

      // Validate character has enough used slots to restore
      if (char.spellSlots && char.availableSpellSlots) {
        // Count how many of each level are being restored
        const slotCounts = new Map<number, number>()
        for (const level of selectedSlotLevels) {
          slotCounts.set(level, (slotCounts.get(level) || 0) + 1)
        }

        // Check if we have enough used slots
        for (const [level, count] of slotCounts) {
          const total = char.spellSlots.filter((s) => s === level).length
          const available = char.availableSpellSlots.filter((s) => s === level).length
          const used = total - available
          if (used < count) {
            errors["arcane_slots[]"] =
              `You only have ${used} used level ${level} spell slot(s), but trying to restore ${count}`
            break
          }
        }
      }
    }
  }

  // Stage 3: Early return for check mode
  if (values.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Stage 4: Full Zod validation
  const result = ShortRestApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Stage 5: Execute the short rest in a transaction
  const summary = await beginOrSavepoint(db, async (tx) => {
    const summary: ShortRestSummary = {
      hpRestored: 0,
      hitDiceSpent: 0,
      diceRolls: [],
      spellSlotsRestored: 0,
      arcaneRecoveryUsed: false,
    }

    const note = result.data.note || "Took a short rest"
    const conMod = char.abilityScores.constitution.modifier

    // Spend hit dice and restore HP using updateHitDice service
    let currentChar = char
    for (const diceInfo of selectedDice) {
      const hitDiceResult = await updateHitDice(tx, currentChar, {
        action: "spend",
        die_value: String(diceInfo.die),
        hp_rolled: String(diceInfo.roll!),
        note,
        is_check: "false",
      })

      if (hitDiceResult.complete) {
        const hpGain = hitDiceResult.result.newHP! - currentChar.currentHP
        summary.hitDiceSpent++
        summary.hpRestored += hpGain
        summary.diceRolls.push({ die: diceInfo.die, roll: diceInfo.roll!, modifier: conMod })
        // Update char's current HP for next iteration
        currentChar = { ...currentChar, currentHP: hitDiceResult.result.newHP! }
      }
    }

    // Arcane Recovery
    if (result.data.arcane_recovery) {
      summary.arcaneRecoveryUsed = true

      for (const level of result.data["arcane_slots[]"]) {
        await createSpellSlotDb(tx, {
          character_id: currentChar.id,
          slot_level: level,
          action: "restore",
          note: `${note} - Arcane Recovery`,
        })
        summary.spellSlotsRestored++
      }
    }

    return summary
  })

  return { complete: true, result: summary }
}

// Vercel AI SDK tool definition
export const shortRestToolName = "short_rest" as const
export const shortRestTool = tool({
  name: shortRestToolName,
  description: `Take a short rest (1 hour of downtime). You can spend hit dice to recover HP. Each die recovers HP equal to the roll + Constitution modifier. Wizards can use Arcane Recovery to restore spell slots.`,
  inputSchema: ShortRestApiSchema.omit({ is_check: true, "arcane_slots[]": true }).extend({
    arcane_slots: ShortRestApiSchema.shape["arcane_slots[]"],
  }),
})

/**
 * Execute the short_rest tool from AI assistant
 * Converts AI parameters to service format and calls shortRest
 */
export async function executeShortRest(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
) {
  const data: Parameters<typeof shortRest>[2] = {
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
    arcane_recovery: parameters.arcane_recovery?.toString() || "false",
  }

  // Convert dice array if provided
  if (parameters.dice && Array.isArray(parameters.dice)) {
    data.dice = parameters.dice
  }

  // Convert arcane_slots array if provided
  if (parameters.arcane_slots && Array.isArray(parameters.arcane_slots)) {
    data["arcane_slots[]"] = parameters.arcane_slots
  }

  return shortRest(db, char, data)
}

/**
 * Format approval message for short_rest tool calls
 */
export function formatShortRestApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { note, arcane_recovery } = parameters

  let message = "Take a short rest"

  if (arcane_recovery) {
    message += " with Arcane Recovery"
  }

  if (note) {
    message += ` with note '${note}'`
  }

  return message
}
