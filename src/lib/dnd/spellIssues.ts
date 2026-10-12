import type { ClassNameType } from "@src/lib/dnd"
import { RULESET_LABELS, type RulesetId } from "./rulesets"
import type { FoundSpell } from "./spells"

/** Why a spell a character already has couldn't be added again today */
export interface SpellIssue {
  /** Short badge text */
  label: string
  /** One sentence for a tooltip */
  reason: string
}

/**
 * Spells on a sheet from before spells were split by ruleset can be from the
 * other ruleset, or from this one but not on the class's list here (classes'
 * lists changed between editions). They stay, but can't be learned or
 * prepared again.
 *
 * @param spellList the class spell list the spell is on the sheet under, if any
 */
export function spellIssue(
  ruleset: RulesetId,
  found: FoundSpell,
  spellList?: ClassNameType
): SpellIssue | undefined {
  const { spell } = found
  const rulesetName = RULESET_LABELS[ruleset]
  if (!found.inRuleset) {
    const source = spell.source ?? "another ruleset"
    return { label: source, reason: `${spell.name} is from ${source}, not ${rulesetName}.` }
  }
  if (spellList && !spell.classes.includes(spellList)) {
    return {
      label: `Not a ${spellList} spell`,
      reason: `${spell.name} isn't a ${spellList} spell in ${rulesetName}.`,
    }
  }
  return undefined
}

/** Added to a reason on a character sheet */
export const KEPT_FROM_BEFORE =
  "It was added before spells were split by ruleset, so it stays and can be cast, but it can't be added or prepared again."
