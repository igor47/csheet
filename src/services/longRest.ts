import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { HitDieType, SpellSlotsType } from "@src/lib/dnd"
import type { ToolExecutorResult } from "@src/tools"
import { tool } from "ai"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const LongRestApiSchema = z.object({
  character_id: z.string(),
  note: z.string().nullable().optional().describe("Optional note about the long rest"),
})

export type LongRestApi = z.infer<typeof LongRestApiSchema>

export interface LongRestSummary {
  hpRestored: number
  hitDiceRestored: number
  spellSlotsRestored: number
}

/**
 * Perform a long rest for a character
 * - Restores all HP to max
 * - Restores half of spent hit dice (rounded down, largest first)
 * - Restores all spell slots
 */
export async function longRest(
  db: SQL,
  data: LongRestApi,
  currentHP: number,
  maxHitPoints: number,
  allHitDice: HitDieType[],
  availableHitDice: HitDieType[],
  allSlots: SpellSlotsType | null,
  availableSlots: SpellSlotsType | null
): Promise<LongRestSummary> {
  const summary: LongRestSummary = {
    hpRestored: 0,
    hitDiceRestored: 0,
    spellSlotsRestored: 0,
  }

  const note = data.note || "Took a long rest"

  // Restore HP to max
  const hpToRestore = maxHitPoints - currentHP
  if (hpToRestore > 0) {
    await createHPDb(db, {
      character_id: data.character_id,
      delta: hpToRestore,
      note,
    })
    summary.hpRestored = hpToRestore
  }

  // Restore half of spent hit dice (rounded down, largest first)
  const maxRestoration = Math.max(Math.floor(allHitDice.length / 2), 1)
  const currentlyUsed = allHitDice.length - availableHitDice.length
  const toRestore = Math.min(maxRestoration, currentlyUsed)

  if (toRestore > 0) {
    // Find used dice to restore
    const usedDice = [...allHitDice]
    for (const die of availableHitDice) {
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
          character_id: data.character_id,
          die_value: usedDice[i]!,
          action: "restore",
          note,
        })
        summary.hitDiceRestored++
      }
    }
  }

  // Restore all spell slots
  if (allSlots && availableSlots) {
    for (let level = 1; level <= 9; level++) {
      const total = allSlots.filter((lvl) => lvl === level).length
      const available = availableSlots.filter((lvl) => lvl === level).length
      const toRestoreSlots = total - available

      // Create restore records for each used slot
      for (let i = 0; i < toRestoreSlots; i++) {
        await createSpellSlotDb(db, {
          character_id: data.character_id,
          slot_level: level,
          action: "restore",
          note,
        })
        summary.spellSlotsRestored++
      }
    }
  }

  return summary
}

// Vercel AI SDK tool definition
export const longRestToolName = "long_rest" as const
export const longRestTool = tool({
  name: longRestToolName,
  description: `Take a long rest (8 hours of sleep). Restores all HP to maximum, restores half of spent hit dice (rounded down, largest first), and restores all spell slots.`,
  inputSchema: LongRestApiSchema.omit({ character_id: true }),
})

/**
 * Execute the long_rest tool from AI assistant
 * Converts AI parameters to service format and calls longRest
 */
export async function executeLongRest(
  db: SQL,
  char: ComputedCharacter,
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  parameters: Record<string, any>
): Promise<ToolExecutorResult> {
  const summary = await longRest(
    db,
    {
      character_id: char.id,
      note: parameters.note || null,
    },
    char.currentHP,
    char.maxHitPoints,
    char.hitDice,
    char.availableHitDice,
    char.spellSlots,
    char.availableSpellSlots
  )

  return {
    status: "success",
    data: summary,
  }
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
