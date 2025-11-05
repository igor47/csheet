import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { HitDieType } from "@src/lib/dnd"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const ShortRestApiSchema = z.object({
  note: OptionalString().describe("Optional note about the circumstances of the short rest"),
  is_check: Checkbox().optional().default(false),
  arcane_recovery: Checkbox()
    .optional()
    .default(false)
    .describe(
      "Whether to use Arcane Recovery (Wizards only). Allows recovering spell slots with combined levels up to half wizard level (rounded up), maximum 5th level slots"
    ),
  arcane_slot_1: Checkbox()
    .optional()
    .default(false)
    .describe("Restore a 1st level spell slot via Arcane Recovery"),
  arcane_slot_2: Checkbox()
    .optional()
    .default(false)
    .describe("Restore a 2nd level spell slot via Arcane Recovery"),
  arcane_slot_3: Checkbox()
    .optional()
    .default(false)
    .describe("Restore a 3rd level spell slot via Arcane Recovery"),
  arcane_slot_4: Checkbox()
    .optional()
    .default(false)
    .describe("Restore a 4th level spell slot via Arcane Recovery"),
  arcane_slot_5: Checkbox()
    .optional()
    .default(false)
    .describe("Restore a 5th level spell slot via Arcane Recovery"),
})

export type ShortRestApi = z.infer<typeof ShortRestApiSchema>

export interface ShortRestSummary {
  hpRestored: number
  hitDiceSpent: number
  diceRolls: Array<{ die: number; roll: number; modifier: number }>
  spellSlotsRestored: number
  arcaneRecoveryUsed: boolean
}

export type ShortRestResult =
  | { complete: true; summary: ShortRestSummary }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

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

  // Stage 2: Custom validation
  const errors: Record<string, string> = {}

  // Parse selected hit dice
  const selectedDice: HitDieType[] = []
  for (let i = 0; i < char.availableHitDice.length; i++) {
    if (data[`spend_die_${i}`] === String(char.availableHitDice[i])) {
      selectedDice.push(char.availableHitDice[i]!)
    }
  }

  // Validate Arcane Recovery
  if (checkD.data.arcane_recovery) {
    const wizardClass = char.classes.find((c) => c.class === "wizard")
    if (!wizardClass) {
      errors.arcane_recovery = "Only Wizards can use Arcane Recovery"
    } else {
      const maxArcaneRecoveryLevel = Math.min(5, Math.ceil(wizardClass.level / 2))
      const selectedSlots: number[] = []

      for (let level = 1; level <= 5; level++) {
        if (checkD.data[`arcane_slot_${level}` as keyof typeof checkD.data]) {
          selectedSlots.push(level)
        }
      }

      // Calculate total slot levels
      const totalSlotLevels = selectedSlots.reduce((sum, level) => sum + level, 0)
      if (totalSlotLevels > maxArcaneRecoveryLevel) {
        errors.arcane_slots = `Total slot levels (${totalSlotLevels}) exceeds maximum (${maxArcaneRecoveryLevel})`
      }

      // Validate character has used slots to restore
      if (char.spellSlots && char.availableSpellSlots) {
        for (const level of selectedSlots) {
          const total = char.spellSlots.filter((s) => s === level).length
          const available = char.availableSpellSlots.filter((s) => s === level).length
          if (available >= total) {
            errors.arcane_slots = `You don't have any used level ${level} spell slots to restore`
            break
          }
        }
      }
    }
  }

  // Stage 3: Early return for check mode
  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Stage 4: Full Zod validation
  const result = ShortRestApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Stage 5: Execute the short rest
  const summary: ShortRestSummary = {
    hpRestored: 0,
    hitDiceSpent: 0,
    diceRolls: [],
    spellSlotsRestored: 0,
    arcaneRecoveryUsed: false,
  }

  const note = result.data.note || "Took a short rest"
  const conMod = char.abilityScores.constitution.modifier

  // Spend hit dice and restore HP
  for (const die of selectedDice) {
    const roll = Math.floor(Math.random() * die) + 1
    const hpGain = Math.max(1, roll + conMod) // Minimum 1 HP

    await createHitDiceDb(db, {
      character_id: char.id,
      die_value: die,
      action: "use",
      note,
    })

    await createHPDb(db, {
      character_id: char.id,
      delta: hpGain,
      note: `${note} - Rolled d${die}: ${roll} + ${conMod}`,
    })

    summary.hitDiceSpent++
    summary.hpRestored += hpGain
    summary.diceRolls.push({ die, roll, modifier: conMod })
  }

  // Arcane Recovery
  if (result.data.arcane_recovery) {
    summary.arcaneRecoveryUsed = true

    for (let level = 1; level <= 5; level++) {
      if (result.data[`arcane_slot_${level}` as keyof typeof result.data]) {
        await createSpellSlotDb(db, {
          character_id: char.id,
          slot_level: level,
          action: "restore",
          note: `${note} - Arcane Recovery`,
        })
        summary.spellSlotsRestored++
      }
    }
  }

  return { complete: true, summary }
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
  parameters: Record<string, any>
): Promise<ToolExecutorResult> {
  const data: Record<string, string> = {
    note: parameters.note?.toString() || "",
    is_check: "false",
    arcane_recovery: parameters.arcane_recovery?.toString() || "false",
    arcane_slot_1: parameters.arcane_slot_1?.toString() || "false",
    arcane_slot_2: parameters.arcane_slot_2?.toString() || "false",
    arcane_slot_3: parameters.arcane_slot_3?.toString() || "false",
    arcane_slot_4: parameters.arcane_slot_4?.toString() || "false",
    arcane_slot_5: parameters.arcane_slot_5?.toString() || "false",
  }

  // Add hit dice spending fields (AI can't specify these, so we won't spend any dice automatically)
  // This tool is mainly for recording the rest and using Arcane Recovery

  const result = await shortRest(db, char, data)

  if (!result.complete) {
    const errorMessage = Object.values(result.errors).join(", ")
    return { status: "failed", error: errorMessage }
  }

  return {
    status: "success",
    data: result.summary,
  }
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
