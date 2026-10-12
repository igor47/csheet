/**
 * Generate the SRD 5.1 spell catalog (src/lib/dnd/spells/srd51.ts) from the
 * vendored SRD 5.1 markdown.
 *
 *   bun utils/generate-srd51-spells.ts            # write the catalog
 *   bun utils/generate-srd51-spells.ts --report   # also print what to review
 *
 * The header fields and text come straight from the SRD. The structured
 * fields the casting tools use (target, resolution, damage, healing, ...)
 * start from:
 *   - the SRD 5.2.1 catalog entry, for spells in both editions (same id), or
 *   - a regex parse of the 5.1 text, for spells only in 5.1,
 * and are then replaced by the hand-reviewed values in
 * utils/srd51-spell-overrides.ts. `--report` lists every spell where the
 * parse of the 5.1 text disagrees with what will be written, so a change to
 * the SRD text or the 5.2 catalog gets reviewed.
 */

import type { AbilityType } from "@src/lib/dnd"
import type {
  AreaOfEffect,
  DamageEntry,
  DamageScaling,
  DamageType,
  Dice,
  Resolution,
  Spell,
  Target,
} from "@src/lib/dnd/spells"
import { DamageTypes } from "@src/lib/dnd/spells"
import { srd52Spells } from "@src/lib/dnd/spells/srd52"
import {
  getSrdSpells,
  normalizeSpellName,
  type SrdSpellText,
  toCastingTime,
  toComponents,
  toDuration,
  toRange,
} from "@src/lib/srd/spells"
import { $ } from "bun"
import { srd51Overrides, srd51Reviewed } from "./srd51-spell-overrides"

const OUTPUT = "src/lib/dnd/spells/srd51.ts"

const dice = (count: number, sides: number): Dice => Array(count).fill(sides)

// --- Parsing mechanics out of 5.1 text ---

const ABILITIES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const satisfies readonly AbilityType[]

function parseResolution(text: string): Resolution {
  const attack = /\b(melee|ranged) (spell|weapon) attack/i.exec(text)
  if (attack) {
    const kind = `${attack[1]!.toLowerCase()}${attack[2] === "spell" ? "Spell" : "Weapon"}`
    return { kind: "attack", attackType: kind as "meleeSpell" }
  }
  const save = new RegExp(`\\b(${ABILITIES.join("|")}) saving throw`, "i").exec(text)
  if (save) {
    const ability = save[1]!.toLowerCase() as AbilityType
    const onSuccess = /half as much damage/i.test(text) ? "half" : "negates"
    return { kind: "save", ability, onSuccess }
  }
  return { kind: "none" }
}

const DAMAGE_RE = new RegExp(
  `(\\d+)d(\\d+)(?: ?\\+ ?(\\d+))? (${DamageTypes.join("|")}) damage`,
  "gi"
)

function parseDamage(text: string): DamageEntry[] | undefined {
  const entries: DamageEntry[] = []
  for (const m of text.matchAll(DAMAGE_RE)) {
    const entry: DamageEntry = {
      type: m[4]!.toLowerCase() as DamageType,
      dice: dice(Number(m[1]), Number(m[2])),
    }
    if (m[3]) entry.flatBonus = Number(m[3])
    if (!entries.some((e) => JSON.stringify(e) === JSON.stringify(entry))) entries.push(entry)
  }
  return entries.length > 0 ? entries : undefined
}

function parseHealing(text: string): Dice | undefined {
  const m = /regains? (?:a number of )?hit points equal to (\d+)d(\d+)/i.exec(text)
  return m ? dice(Number(m[1]), Number(m[2])) : undefined
}

function parseCantripScaling(text: string): DamageScaling | undefined {
  const m =
    /increases by (\d+)d(\d+) when you reach 5th level \((\d+)d\d+\), 11th level \((\d+)d\d+\), and 17th level \((\d+)d\d+\)/i.exec(
      text
    )
  if (!m) return undefined
  const sides = Number(m[2])
  const base = Number(m[3]) - Number(m[1])
  return {
    mode: "characterLevel",
    progression: {
      1: dice(base, sides),
      5: dice(Number(m[3]), sides),
      11: dice(Number(m[4]), sides),
      17: dice(Number(m[5]), sides),
    },
  }
}

const AREA_PATTERNS: [RegExp, (m: RegExpExecArray) => AreaOfEffect][] = [
  [
    /(\d+)-foot[- ]radius,? (\d+)-foot[- ]high cylinder/i,
    (m) => ({ shape: "cylinder", radius: Number(m[1]), height: Number(m[2]) }),
  ],
  [
    /(\d+)-foot[- ]radius (?:sphere|hemisphere)/i,
    (m) => ({ shape: "sphere", radius: Number(m[1]) }),
  ],
  [/(\d+)-foot cube/i, (m) => ({ shape: "cube", size: Number(m[1]) })],
  [/(\d+)-foot cone/i, (m) => ({ shape: "cone", length: Number(m[1]) })],
  [
    /line (?:that is )?(\d+) feet long and (\d+) feet? wide/i,
    (m) => ({ shape: "line", length: Number(m[1]), width: Number(m[2]) }),
  ],
]

function parseArea(text: string): AreaOfEffect | undefined {
  for (const [pattern, build] of AREA_PATTERNS) {
    const m = pattern.exec(text)
    if (m) return build(m)
  }
  return undefined
}

interface ParsedMechanics {
  resolution: Resolution
  damage?: DamageEntry[]
  damageScaling?: DamageScaling
  healingDice?: Dice
  area?: AreaOfEffect
}

function parseMechanics(text: SrdSpellText): ParsedMechanics {
  const body = text.paragraphs.join("\n")
  return {
    resolution: parseResolution(body),
    damage: parseDamage(body),
    damageScaling: text.level === 0 ? parseCantripScaling(body) : undefined,
    healingDice: parseHealing(body),
    area: parseArea(`${text.range}\n${body}`),
  }
}

// --- Building catalog entries ---

function spellId(name: string): string {
  return `srd_${name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`
}

function parsedTarget(parsed: ParsedMechanics): Target {
  return parsed.area
    ? { type: "area", area: parsed.area }
    : { type: "special", text: "See description" }
}

/** Fields that come from the 5.2 entry or the overrides rather than the SRD text */
type Mechanics = Pick<
  Spell,
  | "briefDescription"
  | "target"
  | "resolution"
  | "damage"
  | "damageScaling"
  | "healingDice"
  | "tempHPDice"
  | "conditionsInflicted"
  | "tags"
>

const MECHANICS_KEYS = [
  "briefDescription",
  "target",
  "resolution",
  "damage",
  "damageScaling",
  "healingDice",
  "tempHPDice",
  "conditionsInflicted",
  "tags",
] as const satisfies readonly (keyof Mechanics)[]

function pickMechanics(spell: Spell): Partial<Mechanics> {
  const picked: Partial<Mechanics> = {}
  for (const key of MECHANICS_KEYS) {
    if (spell[key] !== undefined) (picked as Record<string, unknown>)[key] = spell[key]
  }
  return picked
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

const CONDITION_STEMS: Record<string, RegExp> = {
  blinded: /\bblind/i,
  charmed: /\bcharm/i,
  deafened: /\bdeaf/i,
  frightened: /\bfrighten/i,
  incapacitated: /\bincapacitat/i,
  invisible: /\binvisib/i,
  paralyzed: /\bparaly/i,
  petrified: /\bpetrif/i,
  poisoned: /\bpoison/i,
  prone: /\bprone\b/i,
  restrained: /\brestrain/i,
  stunned: /\bstun/i,
  unconscious: /\bunconscious|\basleep|\bsleep/i,
}

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
]

/** "up to three creatures" -> "up to 3 creatures", so numbers in a brief can be found in the text */
function withDigits(text: string): string {
  return text
    .replace(/\btwenty-five\b/gi, "25")
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi, (w) =>
      String(NUMBER_WORDS.indexOf(w.toLowerCase()))
    )
}

export interface Srd51Build {
  spells: Spell[]
  /** What to review: where the 5.1 text disagrees with what will be written */
  reviewNotes: string[]
  /** 5.1-only spells with no briefDescription override yet */
  missing: string[]
}

/** Builds the SRD 5.1 catalog; pure apart from reading the SRD markdown */
export async function buildSrd51Spells(): Promise<Srd51Build> {
  const srdSpells = await getSrdSpells("srd51")
  const by52Name = new Map(srd52Spells.map((s) => [normalizeSpellName(s.name), s]))
  const reviewNotes: string[] = []
  const missing: string[] = []

  const spells: Spell[] = srdSpells.map((text) => {
    const from52 = by52Name.get(normalizeSpellName(text.name))
    const id = from52?.id ?? spellId(text.name)
    const parsed = parseMechanics(text)
    const override = srd51Overrides[id] ?? {}

    const base: Partial<Mechanics> = from52
      ? pickMechanics(from52)
      : {
          target: parsedTarget(parsed),
          resolution: parsed.resolution,
          damage: parsed.damage,
          damageScaling: parsed.damageScaling,
          healingDice: parsed.healingDice,
        }
    const mechanics: Partial<Mechanics> = { ...base, ...override }
    // an override can remove a field by setting it to undefined
    for (const key of MECHANICS_KEYS) if (mechanics[key] === undefined) delete mechanics[key]

    if (!mechanics.briefDescription || !mechanics.resolution || !mechanics.target) {
      missing.push(text.name)
      mechanics.briefDescription ??= ""
      mechanics.resolution ??= parsed.resolution
      mechanics.target ??= parsedTarget(parsed)
    }

    // a field is reviewed if an override sets it, or the whole spell was reviewed
    const notes: string[] = []
    const note = (field: keyof Mechanics, message: string) => {
      if (!(field in override) && !srd51Reviewed.has(id)) notes.push(message)
    }
    if (!from52 && !srd51Overrides[id]) notes.push("not in SRD 5.2.1")
    if (!same(parsed.resolution, mechanics.resolution)) {
      note("resolution", `resolution: parsed ${JSON.stringify(parsed.resolution)}`)
    }
    const parsedDice = parsed.damage?.map((d) => `${d.dice?.length}d${d.dice?.[0]} ${d.type}`)
    const finalDice = mechanics.damage?.map((d) => `${d.dice?.length}d${d.dice?.[0]} ${d.type}`)
    if (!same(parsedDice, finalDice)) note("damage", `damage: parsed ${JSON.stringify(parsedDice)}`)
    if (!same(parsed.healingDice, mechanics.healingDice)) {
      note("healingDice", `healing: parsed ${JSON.stringify(parsed.healingDice)}`)
    }
    if (!same(parsed.damageScaling, mechanics.damageScaling)) {
      note("damageScaling", `scaling: parsed ${JSON.stringify(parsed.damageScaling)}`)
    }
    const finalArea = mechanics.target.type === "area" ? mechanics.target.area : undefined
    if (
      parsed.area &&
      !same({ ...parsed.area, origin: undefined }, { ...finalArea, origin: undefined })
    ) {
      note("target", `area: parsed ${JSON.stringify(parsed.area)}`)
    }
    // conditions and numbers carried over from 5.2.1 that the 5.1 text doesn't mention
    const fullText = withDigits(
      [
        text.castingTime,
        text.range,
        text.components,
        text.duration,
        ...text.paragraphs,
        text.higherLevels ?? "",
      ].join("\n")
    )
    const unmentioned = (mechanics.conditionsInflicted ?? []).filter(
      (c) => !CONDITION_STEMS[c]?.test(fullText)
    )
    if (unmentioned.length > 0) {
      note("conditionsInflicted", `conditions not in the 5.1 text: ${unmentioned.join(", ")}`)
    }
    const briefNumbers = mechanics.briefDescription.match(/\d+d\d+|\d+/g) ?? []
    const strayNumbers = briefNumbers.filter((n) => !fullText.includes(n))
    if (strayNumbers.length > 0) {
      note("briefDescription", `brief numbers not in the 5.1 text: ${strayNumbers.join(", ")}`)
    }
    if (notes.length > 0) reviewNotes.push(`${text.name} (${id})\n  ${notes.join("\n  ")}`)

    return {
      id,
      name: text.name,
      level: text.level as Spell["level"],
      school: text.school,
      classes: text.classes,
      briefDescription: mechanics.briefDescription,
      description: text.paragraphs.join("\n"),
      ...(text.higherLevels ? { atHigherLevelsText: text.higherLevels } : {}),
      castingTime: toCastingTime(text.castingTime),
      ...(text.ritual ? { ritual: true } : {}),
      range: toRange(text.range),
      components: toComponents(text.components),
      duration: toDuration(text.duration),
      target: mechanics.target,
      resolution: mechanics.resolution,
      ...(mechanics.damage ? { damage: mechanics.damage } : {}),
      ...(mechanics.damageScaling ? { damageScaling: mechanics.damageScaling } : {}),
      ...(mechanics.healingDice ? { healingDice: mechanics.healingDice } : {}),
      ...(mechanics.tempHPDice ? { tempHPDice: mechanics.tempHPDice } : {}),
      ...(mechanics.conditionsInflicted
        ? { conditionsInflicted: mechanics.conditionsInflicted }
        : {}),
      source: "SRD 5.1",
      ...(mechanics.tags ? { tags: mechanics.tags } : {}),
    }
  })

  const catalogIds = new Set(spells.map((s) => s.id))
  const unused = [...Object.keys(srd51Overrides), ...srd51Reviewed].filter(
    (id) => !catalogIds.has(id)
  )
  if (unused.length > 0) throw new Error(`overrides for unknown spells: ${unused.join(", ")}`)

  return { spells, reviewNotes, missing }
}

if (import.meta.main) {
  const report = process.argv.includes("--report")
  const { spells, reviewNotes, missing } = await buildSrd51Spells()
  if (missing.length > 0 && !report) {
    throw new Error(`add a briefDescription override for: ${missing.join(", ")}`)
  }

  const source = `// GENERATED by utils/generate-srd51-spells.ts from refdocs/SRD_CC_v5.1.md. Don't edit by hand:
// fix the text in the generator, or the mechanics in utils/srd51-spell-overrides.ts, and re-run it.
import type { Spell } from "../spells"

export const srd51Spells: Spell[] = ${JSON.stringify(spells)}
`
  await Bun.write(OUTPUT, source)
  await $`bunx biome format --write ${OUTPUT}`.quiet()
  console.log(`${OUTPUT}: ${spells.length} spells`)

  if (report) {
    if (missing.length > 0) console.log(`\nNeed a briefDescription: ${missing.join(", ")}`)
    console.log(`\n${reviewNotes.length} spells to review:\n`)
    console.log(reviewNotes.join("\n"))
  }
}
