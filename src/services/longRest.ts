import { create as createHitDiceDb } from "@src/db/char_hit_dice"
import { create as createHPDb } from "@src/db/char_hp"
import { create as createSpellSlotDb } from "@src/db/char_spell_slots"
import type { HitDieType, SpellSlotsType } from "@src/lib/dnd"
import type { SQL } from "bun"
import { z } from "zod"

export const LongRestApiSchema = z.object({
  character_id: z.string(),
  note: z.string().nullable().optional(),
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
  const maxRestoration = Math.floor(allHitDice.length / 2)
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
