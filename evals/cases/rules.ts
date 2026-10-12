import { SRD52_ID } from "@src/lib/dnd/srd52"
import { check, lookedUpRule, lookedUpSpell, noEdits, replyLacks, replyMatches } from "../checks"
import { makeCharacter } from "../fixtures"
import type { EvalCase } from "../types"

// Questions are checked on facts in the reply. Where 5.1 and 5.2 differ, the same question is
// asked for each ruleset, so answering from memory gets one of them wrong
export const rulesCases: EvalCase[] = [
  {
    id: "rules-exhaustion-srd52",
    category: "rules",
    description: "5.2 exhaustion: each level is -2 to D20 Tests and -5 ft speed.",
    setup: (db, user) =>
      makeCharacter(db, user, { ruleset: SRD52_ID, class: "fighter", level: 3, strength: 16 }),
    turns: ["What does exhaustion do to me?"],
    expect: (o) => [
      replyMatches(o, /(-|−|minus |reduced by |by )2\b|2 (times|×|x)|twice/i),
      replyLacks(o, /disadvantage on ability checks/i),
      noEdits(o),
    ],
    grounding: (o) => [lookedUpRule(o, /exhaustion/i)],
  },
  {
    id: "rules-exhaustion-srd51",
    category: "rules",
    description:
      "5.1 exhaustion: six levels with a table of effects, starting with disadvantage on ability checks.",
    setup: (db, user) => makeCharacter(db, user, { class: "fighter", level: 3, strength: 16 }),
    turns: ["What does exhaustion do to me?"],
    expect: (o) => [
      replyMatches(o, /disadvantage on ability checks/i),
      replyMatches(o, /speed halved|half(ed)? speed|speed is halved/i),
      noEdits(o),
    ],
    grounding: (o) => [lookedUpRule(o, /exhaustion/i)],
  },
  {
    id: "rules-grappled-srd52",
    category: "rules",
    description:
      "5.2 grappled: speed 0, and disadvantage on attacks against anyone but the grappler (new in 5.2).",
    setup: (db, user) =>
      makeCharacter(db, user, { ruleset: SRD52_ID, class: "rogue", level: 3, dexterity: 16 }),
    turns: ["What happens to me when I'm grappled?"],
    expect: (o) => [
      replyMatches(o, /speed[^.]{0,20}\b0\b|\b0\b[^.]{0,10}speed|can'?t move/i),
      replyMatches(o, /disadvantage/i),
      noEdits(o),
    ],
    grounding: (o) => [lookedUpRule(o, /grappl/i)],
  },
  {
    id: "rules-fireball",
    category: "rules",
    description: "Spell facts: Fireball is 8d6 fire in a 20-foot radius.",
    setup: (db, user) => makeCharacter(db, user, { class: "wizard", level: 5, intelligence: 16 }),
    turns: ["How much damage does Fireball do, and how big is the blast?"],
    expect: (o) => [replyMatches(o, /8d6/i), replyMatches(o, /20[- ]?(foot|feet|ft)/i), noEdits(o)],
    grounding: (o) => [lookedUpSpell(o, /fireball/i)],
  },
  {
    id: "rules-ritual-casting-time",
    category: "rules",
    description: "Ritual casting takes 10 minutes longer than normal.",
    setup: (db, user) => makeCharacter(db, user, { class: "wizard", level: 3, intelligence: 16 }),
    turns: ["How long does it take to cast a spell as a ritual?"],
    expect: (o) => [
      replyMatches(o, /10 minutes/i),
      replyMatches(o, /longer|extra|additional|more|\+/i),
    ],
    grounding: (o) => [lookedUpRule(o, /ritual/i)],
  },
  {
    id: "rules-wizard-spellbook-size",
    category: "rules",
    description:
      "In prod Reed got this wrong and contradicted itself. A wizard starts with 6 spells and adds 2 per level: 14 at level 5.",
    setup: (db, user) => makeCharacter(db, user, { class: "wizard", level: 5, intelligence: 16 }),
    turns: [
      "At level 5, how many spells should be in my spellbook from leveling, not counting cantrips?",
    ],
    expect: (o) => [replyMatches(o, /\b14\b/), noEdits(o)],
    grounding: (o) => [lookedUpRule(o, /wizard|spellbook/i)],
  },
  {
    id: "rules-cleric-cantrip-list",
    category: "rules",
    description:
      "In prod Reed wrongly said Thaumaturgy and Mending weren't cleric cantrips, then admitted it had no list. The 5.1 list is guidance, light, mending, resistance, sacred flame, spare the dying, thaumaturgy.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "cleric", level: 3, subclass: "life domain", wisdom: 16 }),
    turns: ["Which cantrips can a cleric choose from?"],
    expect: (o) => {
      const all = [
        "guidance",
        "light",
        "mending",
        "resistance",
        "sacred flame",
        "spare the dying",
        "thaumaturgy",
      ]
      const named = all.filter((c) => new RegExp(`\\b${c}\\b`, "i").test(o.reply))
      return [
        replyMatches(o, /thaumaturgy/i),
        replyMatches(o, /mending/i),
        check("names at least 6 of the 7", named.length >= 6, `named: ${named.join(", ")}`),
        noEdits(o),
      ]
    },
  },
]
