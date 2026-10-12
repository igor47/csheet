import { SRD52_ID } from "@src/lib/dnd/srd52"
import { check, lookedUpRule, lookedUpSpell, noEdits, replyMatches } from "../checks"
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
      // -2 per level to d20 rolls, and -5 ft speed per level; both new in 5.2
      replyMatches(
        o,
        // "-2", "minus 2", "subtract 2", "penalty of 2 ×", "2 per level", but not a range like "1-2"
        /(?<![\d–])(-|−|minus |subtract |penalty of |by )2\b|\b2 ?(×|x|times|per)\b/i
      ),
      replyMatches(o, /speed[^.]{0,60}\b5\b|\b5\b[^.]{0,60}speed/i),
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
      // new in 5.2: disadvantage on attacks against anyone but the grappler
      replyMatches(
        o,
        /disadvantage[^.]{0,120}(other than|isn'?t|is not|anyone but|anyone else|except|besides|aside from|other (creatures|targets))|(other than|isn'?t the|anyone but|anyone else|except)[^.]{0,120}disadvantage/i
      ),
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
      // "light" is a common word, so only count it capitalized, as a spell name
      const named = all.filter((c) =>
        (c === "light" ? /\bLight\b/ : new RegExp(`\\b${c}\\b`, "i")).test(o.reply)
      )
      return [
        replyMatches(o, /thaumaturgy/i),
        replyMatches(o, /mending/i),
        check("names at least 6 of the 7", named.length >= 6, `named: ${named.join(", ")}`),
        noEdits(o),
      ]
    },
  },
]
