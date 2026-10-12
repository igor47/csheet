import {
  create as createProficiencyDb,
  findByCharacterId as findProficiencyChanges,
} from "@src/db/char_proficiencies"
import type { Character } from "@src/db/characters"
import { getRuleset } from "@src/lib/dnd"
import {
  classProficiencies,
  originProficiencies,
  type ProficiencyGrant,
  uniqueGrants,
} from "@src/lib/dnd/proficiencies"
import type { SQL } from "bun"

/**
 * Proficiencies a character gets by gaining a level: their origin and the full set for their
 * first class at total level 1, or the multiclassing set for the first level in another class
 */
export function levelProficiencies(
  char: Character,
  className: string,
  classLevel: number,
  totalLevel: number
): ProficiencyGrant[] {
  const ruleset = getRuleset(char.ruleset)
  if (totalLevel === 1) {
    return uniqueGrants([
      ...originProficiencies(ruleset, char),
      ...classProficiencies(ruleset, className, { multiclass: false }),
    ])
  }
  if (classLevel === 1) {
    return classProficiencies(ruleset, className, { multiclass: true })
  }
  return []
}

/**
 * Record proficiency grants as add rows in the character's history
 * Skips any (kind, name) that already appears anywhere in the history: one the character has, and
 * one that was removed, since a player or DM who took a proficiency away shouldn't get it back
 * silently because a new class also grants it. So granting the same set twice is a no-op
 * Returns the grants it recorded
 */
export async function grantProficiencies(
  db: SQL,
  characterId: string,
  grants: ProficiencyGrant[],
  note: string | null = null
): Promise<ProficiencyGrant[]> {
  const history = await findProficiencyChanges(db, characterId)
  const touched = new Set(history.map((row) => `${row.kind}:${row.name}`))
  const toGrant = uniqueGrants(grants).filter((g) => !touched.has(`${g.kind}:${g.name}`))

  for (const grant of toGrant) {
    await createProficiencyDb(db, {
      character_id: characterId,
      kind: grant.kind,
      name: grant.name,
      action: "add",
      source: grant.source,
      source_detail: grant.source_detail,
      note: grant.note ?? note,
    })
  }
  return toGrant
}
