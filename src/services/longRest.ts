import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import { type ServiceResult, serviceResultToToolResult } from "@src/lib/serviceResult"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LongRestApiSchema = z.object({
  note: OptionalString().describe(
    "Optional note about the circumstances of the long rest (e.g., where they rested, what happened)"
  ),
  is_check: Checkbox().optional().default(false),
})

export type LongRestApi = z.infer<typeof LongRestApiSchema>

export interface LongRestSummary {
  hpRestored: number
  hitDiceRestored: number
  spellSlotsRestored: number
}

export type LongRestResult = ServiceResult<LongRestSummary>

/**
 * Perform a long rest for a character
 * - Restores all HP to max
 * - Restores half of spent hit dice (rounded down, largest first)
 * - Restores all spell slots
 */
export async function longRest(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<LongRestResult> {
  // Stage 1: Partial Zod validation
  const checkD = LongRestApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  // Stage 2: Custom validation (none needed for long rest)
  const errors: Record<string, string> = {}

  // Stage 3: Early return for check mode
  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Stage 4: Full Zod validation
  const result = LongRestApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Stage 5: Execute the long rest
  const summary: LongRestSummary = {
    hpRestored: 0,
    hitDiceRestored: 0,
    spellSlotsRestored: 0,
  }

  const note = result.data.note || "Took a long rest"

  // Restore HP to max
  const hpToRestore = char.maxHitPoints - char.currentHP
  if (hpToRestore > 0) {
    await createHPDb(db, {
      character_id: char.id,
      delta: hpToRestore,
      note,
    })
    summary.hpRestored = hpToRestore
  }

  // Restore half of spent hit dice (rounded down, largest first)
  const maxRestoration = Math.max(Math.floor(char.hitDice.length / 2), 1)
  const currentlyUsed = char.hitDice.length - char.availableHitDice.length
  const toRestore = Math.min(maxRestoration, currentlyUsed)

  if (toRestore > 0) {
    // Find used dice to restore
    const usedDice = [...char.hitDice]
    for (const die of char.availableHitDice) {
      const index = usedDice.indexOf(die)
      if (index !== -1) {
        usedDice.splice(index, 1)
      }
    }

    // Sort largest-first
    usedDice.sort((a, b) => b - a)

    // Create restore records
    for (let i = 0; i < toRestore; i++) {
      if (usedDice[i]) {
        await createHitDiceDb(db, {
          character_id: char.id,
          die_value: usedDice[i]!,
          action: "restore",
          note,
        })
        summary.hitDiceRestored++
      }
    }
  }

  // Restore all spell slots
  if (char.spellSlots && char.availableSpellSlots) {
    for (let level = 1; level <= 9; level++) {
      const total = char.spellSlots.filter((lvl) => lvl === level).length
      const available = char.availableSpellSlots.filter((lvl) => lvl === level).length
      const toRestoreSlots = total - available

      // Create restore records for each used slot
      for (let i = 0; i < toRestoreSlots; i++) {
        await createSpellSlotDb(db, {
          character_id: char.id,
          slot_level: level,
          action: "restore",
          note,
        })
        summary.spellSlotsRestored++
      }
    }
  }

  return { complete: true, result: summary }
}

// Vercel AI SDK tool definition
export const longRestToolName = "long_rest" as const
export const longRestTool = tool({
  name: longRestToolName,
  description: `Take a long rest (8 hours of sleep). Restores all HP to maximum, restores half of spent hit dice (rounded down, largest first), and restores all spell slots.`,
  inputSchema: LongRestApiSchema.omit({ is_check: true }),
})

/**
 * Execute the long_rest tool from AI assistant
 * Converts AI parameters to service format and calls longRest
 */
export async function executeLongRest(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>,
  isCheck?: boolean
): Promise<ToolExecutorResult> {
  const data: Record<string, string> = {
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  const result = await longRest(db, char, data)

  return serviceResultToToolResult(result)
}

/**
 * Format approval message for long_rest tool calls
 */
export function formatLongRestApproval(
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): string {
  const { note } = parameters

  let message = "Take a long rest"

  if (note) {
    message += `\n${note}`
  }

  return message
}
