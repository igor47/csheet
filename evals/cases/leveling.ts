import { SRD52_ID } from "@src/lib/dnd/srd52"
import { check, hasLevel, replyMatches } from "../checks"
import { makeCharacter } from "../fixtures"
import type { EvalCase } from "../types"

// add_level failed 73 of 86 times in prod (#87): calls ran out of order, and subclass names
// had to match exactly, so Reed guessed spellings and looped
export const levelingCases: EvalCase[] = [
  {
    id: "level-paladin-1-to-5-asks-for-oath",
    category: "leveling",
    description:
      "Player jumps several levels without naming a subclass. In prod Reed fired levels 2-5 at once, they failed at 3 for lack of an oath, then it guessed oath names. Reed should get the oath (asking if needed) and end at paladin 5.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "paladin", level: 1, strength: 15, charisma: 14 }),
    turns: ["My DM says I'm level 5 now. I rolled a 10 on every hit die.", "Oath of Devotion"],
    expect: ({ after }) => hasLevel(after, "paladin", 5, "oath of devotion"),
  },
  {
    id: "level-fighter-2-to-5-champion",
    category: "leveling",
    description:
      "Multi-level level-up with the subclass given up front. In prod Reed's 'Champion' was rejected and the player gave up and used the edit form.",
    setup: (db, user) => makeCharacter(db, user, { class: "fighter", level: 2, strength: 16 }),
    turns: ["I'm leveling up to 5 and taking the Champion archetype. My rolls are 7, 8 and 6."],
    expect: ({ before, after }) => [
      ...hasLevel(after, "fighter", 5, "champion"),
      check(
        "gained 21 max HP from the rolls",
        after.maxHitPoints === before.maxHitPoints + 21,
        `max HP ${before.maxHitPoints} -> ${after.maxHitPoints}`
      ),
    ],
  },
  {
    id: "level-barbarian-subclass-not-in-srd",
    category: "leveling",
    description:
      "Player picks a subclass the SRD doesn't have (Zealot). In prod Reed tried 'Zealot', 'Path of the Zealot', etc. and never explained. Reed should say it's unavailable and offer Berserker, the only 5.2 option.",
    setup: (db, user) =>
      makeCharacter(db, user, { ruleset: SRD52_ID, class: "barbarian", level: 1, strength: 16 }),
    turns: [
      "I reached level 5! My rolls were 10, 12, 11 and 8. I'm going Path of the Zealot.",
      "Ugh, fine. Use whatever option is available.",
    ],
    expect: (o) => [
      replyMatches(o, /berserker/i, o.transcript.turns[0]?.reply),
      ...hasLevel(o.after, "barbarian", 5, "path of the berserker"),
    ],
  },
  {
    id: "level-wizard-1-to-2-needs-school",
    category: "leveling",
    description:
      "SRD 5.1 wizards pick a school at level 2. In prod Reed tried 'Evocation' and 'School of Evocation' before the player typed it themselves.",
    setup: (db, user) => makeCharacter(db, user, { class: "wizard", level: 1, intelligence: 16 }),
    turns: ["I leveled up! I rolled a 5 for hit points.", "Evocation"],
    expect: ({ after }) => hasLevel(after, "wizard", 2, "school of evocation"),
  },
  {
    id: "level-multiclass-catch-up",
    category: "leveling",
    description:
      "Player records many levels across two classes at once, with average HP. In prod the calls ran out of order and every subclass name was rejected.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "fighter", level: 1, strength: 16, charisma: 13 }),
    turns: [
      "I'm actually a level 6 fighter and a level 2 paladin. Record the fighter levels first, then the paladin ones, using average hit die rolls. My fighter subclass is Battle Master.",
    ],
    expect: ({ before, after }) => {
      // fighters and paladins both use a d10, which averages 5.5; accept rounding either way
      const gained = after.maxHitPoints - before.maxHitPoints
      return [
        ...hasLevel(after, "fighter", 6, "battle master"),
        ...hasLevel(after, "paladin", 2),
        check("average hit die rolls", gained >= 7 * 5 && gained <= 7 * 6, `gained ${gained}`),
      ]
    },
  },
  {
    id: "level-bard-5-to-6",
    category: "leveling",
    description:
      "A plain one-level level-up, as a baseline. In prod this one was rejected by the player for unclear reasons.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        class: "bard",
        level: 5,
        subclass: "college of lore",
        charisma: 16,
      }),
    turns: ["Level up! I rolled an 8."],
    expect: ({ after }) => hasLevel(after, "bard", 6),
  },
]
