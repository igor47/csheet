import {
  called,
  check,
  inSpellbook,
  isPrepared,
  lookedUpSpell,
  noEdits,
  notPrepared,
  replyMatches,
  slotsAvailable,
} from "../checks"
import { makeCharacter } from "../fixtures"
import type { EvalCase } from "../types"

// prepare_spell failed or was rejected 21 of 92 times in prod, and lookups failed on names
// not in the catalog. Reed also refused spells that are on the class list, from memory
export const spellCases: EvalCase[] = [
  {
    id: "spells-wizard-learn-then-prepare",
    category: "spells",
    description:
      "Wizards must have a spell in their spellbook before preparing it. In prod Reed tried to prepare first, failed 7 times, then learned them.",
    setup: (db, user) => makeCharacter(db, user, { class: "wizard", level: 3, intelligence: 16 }),
    turns: [
      "Add magic missile, shield, detect magic and find familiar to my spellbook, and prepare magic missile and shield.",
    ],
    expect: ({ after }) => [
      inSpellbook(after, "srd_magic_missile"),
      inSpellbook(after, "srd_shield"),
      inSpellbook(after, "srd_detect_magic"),
      inSpellbook(after, "srd_find_familiar"),
      isPrepared(after, "srd_magic_missile"),
      isPrepared(after, "srd_shield"),
    ],
  },
  {
    id: "spells-wizard-learn-and-prep-counterspell",
    category: "spells",
    description: "In prod this request errored three times in a row before working.",
    setup: (db, user) => makeCharacter(db, user, { class: "wizard", level: 5, intelligence: 16 }),
    turns: ["Can you add dispel magic and counterspell to my spellbook, and prep counterspell?"],
    expect: ({ after }) => [
      inSpellbook(after, "srd_dispel_magic"),
      inSpellbook(after, "srd_counterspell"),
      isPrepared(after, "srd_counterspell"),
    ],
  },
  {
    id: "spells-cleric-thaumaturgy",
    category: "spells",
    description:
      "In prod Reed told a cleric Thaumaturgy was a wizard cantrip, from memory. It's a cleric-only cantrip.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "cleric", level: 3, subclass: "life domain", wisdom: 16 }),
    turns: ["Can you prepare Thaumaturgy for me?"],
    expect: ({ after }) => [isPrepared(after, "srd_thaumaturgy")],
    grounding: (o) => [lookedUpSpell(o, /thaumaturgy/i)],
  },
  {
    id: "spells-cleric-mending",
    category: "spells",
    description:
      "In prod Reed said Mending was wizard-only, then later prepared it when the player pushed back. It's on the cleric list.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "cleric", level: 3, subclass: "life domain", wisdom: 16 }),
    turns: ["Prepare Mending as one of my cantrips."],
    expect: ({ after }) => [isPrepared(after, "srd_mending")],
    grounding: (o) => [lookedUpSpell(o, /mending/i)],
  },
  {
    id: "spells-bard-fireball-refused",
    category: "spells",
    description:
      "Fireball isn't on the bard list. Reed should explain that and not prepare it or work around it.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        class: "bard",
        level: 5,
        subclass: "college of lore",
        charisma: 16,
      }),
    turns: ["Prepare Fireball for me."],
    expect: (o) => [notPrepared(o.after, "srd_fireball"), noEdits(o), replyMatches(o, /bard/i)],
  },
  {
    id: "spells-druid-name-variants",
    category: "spells",
    description:
      "Players use names that differ from the catalog ('thorn whip' is 'Whip of Thorns', 'enlarge reduce' is 'Enlarge/Reduce'). In prod Reed gave up on Thorn Whip.",
    setup: (db, user) => makeCharacter(db, user, { class: "druid", level: 4, wisdom: 16 }),
    turns: [
      "My prepared cantrips are produce flame, shillelagh, and thorn whip.",
      "And my prepared spells should be enlarge reduce, barkskin, cure wounds and thunderwave.",
    ],
    expect: ({ after }) => [
      isPrepared(after, "srd_produce_flame"),
      isPrepared(after, "srd_shillelagh"),
      isPrepared(after, "srd_whip_of_thorns"),
      isPrepared(after, "srd_enlarge_reduce"),
      isPrepared(after, "srd_barkskin"),
      isPrepared(after, "srd_cure_wounds"),
      isPrepared(after, "srd_thunderwave"),
    ],
  },
  {
    id: "spells-non-srd-cantrip",
    category: "spells",
    description:
      "Toll the Dead isn't in the SRD. In prod Reed suggested it, failed to find it, then suggested Thaumaturgy and refused it. Reed should say it's not available and change nothing.",
    setup: (db, user) =>
      makeCharacter(db, user, { class: "cleric", level: 3, subclass: "life domain", wisdom: 16 }),
    turns: ["Prepare Toll the Dead as a cantrip for me."],
    expect: (o) => [
      noEdits(o),
      replyMatches(
        o,
        /SRD|not (in|available|found)|can'?t find|couldn'?t find|isn'?t (in|available)/i
      ),
    ],
  },
  {
    id: "spells-cast-ritual",
    category: "spells",
    description: "Casting a ritual spell as a ritual uses no slot.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        class: "wizard",
        level: 3,
        intelligence: 16,
        spellbook: ["srd_detect_magic"],
        prepared: [["wizard", "srd_detect_magic", "spell"]],
      }),
    turns: ["Cast detect magic as a ritual."],
    expect: (o) => [
      called(o, "cast_spell", (p) => p.spell_id === "srd_detect_magic" && p.as_ritual === true),
      check(
        "no slot used",
        o.after.availableSpellSlots.length === o.before.availableSpellSlots.length,
        `slots ${o.before.availableSpellSlots.length} -> ${o.after.availableSpellSlots.length}`
      ),
    ],
  },
  {
    id: "spells-cast-upcast",
    category: "spells",
    description: "Casting at a higher level uses a slot of that level.",
    setup: (db, user) =>
      makeCharacter(db, user, {
        class: "wizard",
        level: 5,
        intelligence: 16,
        spellbook: ["srd_magic_missile"],
        prepared: [["wizard", "srd_magic_missile", "spell"]],
      }),
    turns: ["I cast magic missile at 3rd level at the banshee."],
    expect: ({ before, after }) => [
      check(
        "used a 3rd-level slot",
        slotsAvailable(after, 3) === slotsAvailable(before, 3) - 1 &&
          slotsAvailable(after, 1) === slotsAvailable(before, 1),
        `3rd ${slotsAvailable(before, 3)} -> ${slotsAvailable(after, 3)}, 1st ${slotsAvailable(before, 1)} -> ${slotsAvailable(after, 1)}`
      ),
    ],
  },
]
