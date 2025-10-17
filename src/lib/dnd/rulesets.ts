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
