import { z } from "zod"
import type { Ruleset } from "../dnd"
import srd51, { SRD51_ID } from "./srd51"
import srd52, { SRD52_ID } from "./srd52"

export const RulesetIdSchema = z.enum([SRD51_ID, SRD52_ID])
export type RulesetId = z.infer<typeof RulesetIdSchema>

export const RULESETS: Ruleset[] = [srd51, srd52]

export function getRuleset(ruleset: RulesetId): Ruleset {
  if (ruleset === SRD52_ID) {
    return srd52
  }
  return srd51
}

/** A ruleset from a query parameter, defaulting to SRD 5.1 */
export function parseRulesetParam(value: string | undefined): RulesetId {
  return value === SRD52_ID ? SRD52_ID : SRD51_ID
}

export const RULESET_LABELS: Record<RulesetId, string> = {
  [SRD51_ID]: "SRD 5.1",
  [SRD52_ID]: "SRD 5.2",
}
