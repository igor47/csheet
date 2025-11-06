import { beginOrSavepoint } from "@src/db"
import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { HitDieType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, NumericEnumField, OptionalNumber, OptionalString } from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { updateHitDice } from "./updateHitDice"

// Schema building blocks
const DieValueField = () =>
  NumericEnumField(z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]).nullable())
const RollValueField = () => OptionalNumber()
const ArcaneSlotField = () => Checkbox().optional().default(false)

export const ShortRestApiSchema = z.object({
  note: OptionalString().describe("Optional note about the circumstances of the short rest"),
  is_check: Checkbox().optional().default(false),

  // Hit dice spending (support up to 6 dice per short rest)
  spend_die_0: DieValueField().describe("Die value for first hit die to spend (6, 8, 10, or 12)"),
  roll_die_0: RollValueField().describe("Rolled value for first hit die (1 to die value)"),
  spend_die_1: DieValueField().describe("Die value for second hit die to spend (6, 8, 10, or 12)"),
  roll_die_1: RollValueField().describe("Rolled value for second hit die"),
  spend_die_2: DieValueField().describe("Die value for third hit die to spend (6, 8, 10, or 12)"),
  roll_die_2: RollValueField().describe("Rolled value for third hit die"),
  spend_die_3: DieValueField().describe("Die value for fourth hit die to spend (6, 8, 10, or 12)"),
  roll_die_3: RollValueField().describe("Rolled value for fourth hit die"),
  spend_die_4: DieValueField().describe("Die value for fifth hit die to spend (6, 8, 10, or 12)"),
  roll_die_4: RollValueField().describe("Rolled value for fifth hit die"),
  spend_die_5: DieValueField().describe("Die value for sixth hit die to spend (6, 8, 10, or 12)"),
  roll_die_5: RollValueField().describe("Rolled value for sixth hit die"),

  // Arcane Recovery (Wizards only)
  arcane_recovery: Checkbox()
    .optional()
    .default(false)
    .describe(
      "Whether to use Arcane Recovery (Wizards only). Allows recovering spell slots with combined levels up to half wizard level (rounded up), maximum 5th level slots"
    ),
  arcane_slot_1: ArcaneSlotField().describe("Restore a 1st level spell slot via Arcane Recovery"),
  arcane_slot_2: ArcaneSlotField().describe("Restore a 2nd level spell slot via Arcane Recovery"),
  arcane_slot_3: ArcaneSlotField().describe("Restore a 3rd level spell slot via Arcane Recovery"),
  arcane_slot_4: ArcaneSlotField().describe("Restore a 4th level spell slot via Arcane Recovery"),
  arcane_slot_5: ArcaneSlotField().describe("Restore a 5th level spell slot via Arcane Recovery"),
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
  data: Record<string, string>
): Promise<ShortRestResult> {
  // Stage 1: Partial Zod validation
  const checkD = ShortRestApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const values = checkD.data

  // Stage 2: Custom validation
  const errors: Record<string, string> = {}

  // Parse selected hit dice with their rolls
  const selectedDice: Array<{ index: number; die: HitDieType; roll?: number }> = []
  const remainingHitDice = [...char.availableHitDice]

  // Iterate over all possible form field indices (0-5)
  for (let i = 0; i < 6; i++) {
    const dieValue = values[`spend_die_${i}` as keyof typeof values]
    if (!dieValue) continue

    const dieNum = dieValue as HitDieType

    // Check if this die is available in remainingHitDice
    const availableIndex = remainingHitDice.indexOf(dieNum)
    if (availableIndex === -1) {
      errors[`spend_die_${i}`] = `You don't have a d${dieNum} hit die available`
      continue
    }

    // Remove from remainingHitDice to prevent double-spending
    remainingHitDice.splice(availableIndex, 1)

    // Find the original index in char.availableHitDice for tracking
    const originalIndex = char.availableHitDice.indexOf(dieNum)

    const roll = values[`roll_die_${i}` as keyof typeof values] as number | undefined

    // Validate roll value if provided
    if (roll !== undefined) {
      if (roll < 1 || roll > dieNum) {
        errors[`roll_die_${i}`] = `Roll must be between 1 and ${dieNum}`
      }
    } else if (!values.is_check) {
      // Require roll value for non-check submissions
      errors[`roll_die_${i}`] = "Roll value is required"
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
      const selectedSlots: { level: number; count: number }[] = []

      for (let level = 1; level <= 5; level++) {
        if (values[`arcane_slot_${level}` as keyof typeof values]) {
          // Calculate how many slots of this level to restore
          // Maximum is based on remaining budget divided by slot level
          const maxCount = Math.floor(maxArcaneRecoveryLevel / level)
          selectedSlots.push({ level, count: maxCount })
        }
      }

      // Calculate total slot levels (sum of level * count for each selected level)
      const totalSlotLevels = selectedSlots.reduce((sum, slot) => sum + slot.level * slot.count, 0)
      if (totalSlotLevels > maxArcaneRecoveryLevel) {
        errors.arcane_slots = `Total slot levels (${totalSlotLevels}) exceeds maximum (${maxArcaneRecoveryLevel})`
      }

      // Validate character has enough used slots to restore
      if (char.spellSlots && char.availableSpellSlots) {
        for (const slot of selectedSlots) {
          const total = char.spellSlots.filter((s) => s === slot.level).length
          const available = char.availableSpellSlots.filter((s) => s === slot.level).length
          const used = total - available
          if (used < slot.count) {
            errors.arcane_slots = `You only have ${used} used level ${slot.level} spell slot(s), but trying to restore ${slot.count}`
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

      const wizardClass = char.classes.find((c) => c.class === "wizard")!
      const maxArcaneRecoveryLevel = Math.min(5, Math.ceil(wizardClass.level / 2))

      for (let level = 1; level <= 5; level++) {
        if (result.data[`arcane_slot_${level}` as keyof typeof result.data]) {
          // Restore multiple slots of this level based on budget
          const maxCount = Math.floor(maxArcaneRecoveryLevel / level)

          for (let i = 0; i < maxCount; i++) {
            await createSpellSlotDb(tx, {
              character_id: currentChar.id,
              slot_level: level,
              action: "restore",
              note: `${note} - Arcane Recovery`,
            })
            summary.spellSlotsRestored++
          }
        }
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
  inputSchema: ShortRestApiSchema.omit({ is_check: true }),
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
  const data: Record<string, string> = {
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
    // Hit dice spending (AI can specify these for automated rests)
    spend_die_0: parameters.spend_die_0?.toString() || "",
    roll_die_0: parameters.roll_die_0?.toString() || "",
    spend_die_1: parameters.spend_die_1?.toString() || "",
    roll_die_1: parameters.roll_die_1?.toString() || "",
    spend_die_2: parameters.spend_die_2?.toString() || "",
    roll_die_2: parameters.roll_die_2?.toString() || "",
    spend_die_3: parameters.spend_die_3?.toString() || "",
    roll_die_3: parameters.roll_die_3?.toString() || "",
    spend_die_4: parameters.spend_die_4?.toString() || "",
    roll_die_4: parameters.roll_die_4?.toString() || "",
    spend_die_5: parameters.spend_die_5?.toString() || "",
    roll_die_5: parameters.roll_die_5?.toString() || "",
    // Arcane Recovery
    arcane_recovery: parameters.arcane_recovery?.toString() || "false",
    arcane_slot_1: parameters.arcane_slot_1?.toString() || "false",
    arcane_slot_2: parameters.arcane_slot_2?.toString() || "false",
    arcane_slot_3: parameters.arcane_slot_3?.toString() || "false",
    arcane_slot_4: parameters.arcane_slot_4?.toString() || "false",
    arcane_slot_5: parameters.arcane_slot_5?.toString() || "false",
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
    message += `\n${note}`
  }

  return message
}
