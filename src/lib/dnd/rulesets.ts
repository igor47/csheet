import srd51 from "./srd51"
import srd52 from "./srd52"

export function getRuleset(ruleset: "srd51" | "srd52") {
  if (ruleset === "srd52") {
    return srd52
  }
  return srd51
}
