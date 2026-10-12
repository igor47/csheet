import { findByCharacterId as getAllLevels } from "@src/db/char_levels"
import { type Character, findById } from "@src/db/characters"
import { getRuleset } from "@src/lib/dnd"
import { classOrder, defaultProficiencies, type ProficiencyGrant } from "@src/lib/dnd/proficiencies"
import type { SQL } from "bun"
import { grantProficiencies } from "./grantProficiencies"

export const BACKFILL_NOTE = "Filled in for a character created before proficiencies were tracked"

/**
 * Give a character the proficiencies their species, lineage, background, and classes grant, the
 * way addLevel would have: the full set for the class they took first (their earliest level), the
 * multiclassing set for the others
 * Like any grant, skips proficiencies already in the character's history, so it's safe to re-run
 * Returns what it granted
 */
export async function backfillCharacterProficiencies(
  db: SQL,
  character: Character
): Promise<ProficiencyGrant[]> {
  const levels = await getAllLevels(db, character.id)
  const defaults = defaultProficiencies(
    getRuleset(character.ruleset),
    character,
    classOrder(levels)
  )
  return grantProficiencies(db, character.id, defaults, BACKFILL_NOTE)
}

/**
 * Backfill every character, archived ones included; a failure on one doesn't stop the rest
 */
export async function backfillAllProficiencies(
  db: SQL,
  log: (message: string) => void = () => {}
): Promise<{ granted: number; failed: number }> {
  const ids: { id: string }[] = await db`SELECT id FROM characters ORDER BY id`
  const summary = { granted: 0, failed: 0 }
  for (const { id } of ids) {
    try {
      const character = (await findById(db, id))!
      const grants = await backfillCharacterProficiencies(db, character)
      if (grants.length > 0) summary.granted++
      log(`${id} ${character.name}: granted ${grants.length}`)
    } catch (error) {
      summary.failed++
      log(`${id}: FAILED ${error}`)
    }
  }
  return summary
}
