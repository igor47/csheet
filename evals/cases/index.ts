import type { EvalCase } from "../types"
import { levelingCases } from "./leveling"
import { coinCases, hitPointCases, inventoryCases } from "./resources"
import { rulesCases } from "./rules"
import { spellCases } from "./spells"

export const CASES: EvalCase[] = [
  ...levelingCases,
  ...spellCases,
  ...coinCases,
  ...hitPointCases,
  ...inventoryCases,
  ...rulesCases,
]
