/**
 * Reading spells out of the vendored SRD markdown.
 *
 * This only extracts the text and the regular header fields of each spell, in
 * the SRD's own words. It's used to generate the SRD 5.1 spell catalog
 * (utils/generate-srd51-spells.ts) and to check both catalogs against the SRD.
 */

import type { ClassNameType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import type { CastingTime, Components, Duration, Range, SpellSchoolType } from "@src/lib/dnd/spells"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { getToc, type SrdToc, type TocEntry } from "@src/lib/srd/toc"

export interface SrdSpellText {
  name: string
  level: number
  school: SpellSchoolType
  classes: ClassNameType[]
  ritual: boolean
  castingTime: string
  range: string
  components: string
  duration: string
  /** Body paragraphs as plain text, without the higher-level paragraph */
  paragraphs: string[]
  /** "At Higher Levels" (5.1) or "Using a Higher-Level Spell Slot" / "Cantrip Upgrade" (5.2.1) */
  higherLevels?: string
}

/** SRD section ids that hold one sub-section per spell */
const DESCRIPTIONS_ID: Record<RulesetId, string> = {
  srd51: "spell-descriptions",
  srd52: "spells/spell-descriptions",
}

// a couple of 5.1 spells format it as "_At Higher Levels_."
const HIGHER_LEVELS_RE =
  /^_(?:\*\*)?(At Higher Levels|Using a Higher-Level Spell Slot|Cantrip Upgrade)(?:\.\*\*_|_\.)\s*/

/** Normalizes a spell name for matching across editions ("Heroes’ Feast" = "Heroes' Feast") */
export function normalizeSpellName(name: string): string {
  return name.replace(/[’‘]/g, "'").toLowerCase()
}

/** Markdown inline formatting to plain text */
export function plainText(markdown: string): string {
  return markdown
    .replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1")
    .replace(/_(\W)_/g, "$1") // stray emphasis around punctuation, e.g. "auras_._"
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(^|[^\w])_(.+?)_(?=[^\w]|$)/g, "$1$2")
    .replace(/ {2,}/g, " ")
    .trim()
}

/** Turns a markdown table into one line per row: "a: b" for two columns, "a | b | c" otherwise */
function tableToLines(rows: string[]): string[] {
  return rows
    .filter((row) => !/^\|[\s|:-]+\|$/.test(row))
    .map((row) =>
      row
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => plainText(cell))
    )
    .map((cells) => (cells.length === 2 ? `${cells[0]}: ${cells[1]}` : cells.join(" | ")))
}

/**
 * Splits a spell's body into paragraphs: one per markdown paragraph, list
 * item, table row or sub-heading.
 */
function bodyParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = []
  let table: string[] = []
  const flushTable = () => {
    if (table.length > 0) paragraphs.push(...tableToLines(table))
    table = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith("|")) {
      table.push(line)
      continue
    }
    flushTable()
    if (line === "") continue
    const heading = /^#+\s+(.*)$/.exec(line)
    if (heading) {
      paragraphs.push(`${plainText(heading[1]!)}:`)
    } else if (line.startsWith("- ")) {
      paragraphs.push(plainText(line.slice(2)))
    } else {
      paragraphs.push(plainText(line))
    }
  }
  flushTable()
  return paragraphs
}

const ORDINAL_LEVEL_RE = /^(\d)(?:st|nd|rd|th)-level (\w+)( \(ritual\))?$/i
const CANTRIP_51_RE = /^(\w+) cantrip$/i
const LEVEL_52_RE = /^Level (\d) (\w+) \((.+)\)$/
const CANTRIP_52_RE = /^(\w+) Cantrip \((.+)\)$/

function parseClasses(text: string): ClassNameType[] {
  return text.split(",").map((c) => c.trim().toLowerCase() as ClassNameType)
}

interface SpellType {
  level: number
  school: string
  ritual: boolean
  classes?: ClassNameType[]
}

/** "_2nd-level evocation (ritual)_" (5.1) or "_Level 2 Evocation (Wizard)_" (5.2.1) */
function parseTypeLine(typeLine: string): SpellType | undefined {
  const ordinal = ORDINAL_LEVEL_RE.exec(typeLine)
  if (ordinal) {
    return { level: Number(ordinal[1]), school: ordinal[2]!, ritual: ordinal[3] !== undefined }
  }
  const cantrip51 = CANTRIP_51_RE.exec(typeLine)
  if (cantrip51) return { level: 0, school: cantrip51[1]!, ritual: false }
  const level52 = LEVEL_52_RE.exec(typeLine)
  if (level52) {
    const classes = parseClasses(level52[3]!)
    return { level: Number(level52[1]), school: level52[2]!, ritual: false, classes }
  }
  const cantrip52 = CANTRIP_52_RE.exec(typeLine)
  if (cantrip52) {
    return { level: 0, school: cantrip52[1]!, ritual: false, classes: parseClasses(cantrip52[2]!) }
  }
  return undefined
}

function parseSpell(
  ruleset: RulesetId,
  toc: SrdToc,
  entry: TocEntry,
  classesByName: Map<string, ClassNameType[]>
): SrdSpellText {
  const lines = toc.lines.slice(entry.lineStart, entry.lineEnd)
  const nonEmpty = lines.map((l) => l.trim()).filter((l) => l !== "")
  const typeLine = nonEmpty[0]!.replace(/^_|_$/g, "")

  const type = parseTypeLine(typeLine)
  if (!type) throw new Error(`${ruleset} ${entry.title}: can't parse spell type line "${typeLine}"`)
  const { level, school } = type
  let ritual = type.ritual
  // 5.1 lists classes separately; 5.2.1 puts them in the type line
  const classes = type.classes ?? classesByName.get(normalizeSpellName(entry.title)) ?? []

  const field = (label: string): string => {
    const line = nonEmpty.find((l) => l.startsWith(`- **${label}:**`))
    if (!line) throw new Error(`${ruleset} ${entry.title}: no ${label}`)
    return plainText(line.slice(`- **${label}:**`.length))
  }
  const castingTime = field("Casting Time")
  if (/\bor Ritual\b/.test(castingTime)) ritual = true

  // the body starts after the last header bullet
  const lastField = lines.findIndex((l) => l.startsWith("- **Duration:**"))
  const bodyLines = lines.slice(lastField + 1)
  const higherIndex = bodyLines.findIndex((l) => HIGHER_LEVELS_RE.test(l.trim()))
  let higherLevels: string | undefined
  let paragraphLines = bodyLines
  if (higherIndex >= 0) {
    higherLevels = plainText(bodyLines[higherIndex]!.trim().replace(HIGHER_LEVELS_RE, ""))
    paragraphLines = [...bodyLines.slice(0, higherIndex), ...bodyLines.slice(higherIndex + 1)]
  }

  return {
    name: entry.title,
    level,
    school: school.toLowerCase() as SpellSchoolType,
    classes: [...classes].sort(),
    ritual,
    castingTime,
    range: field("Range"),
    components: field("Components"),
    duration: field("Duration"),
    paragraphs: bodyParagraphs(paragraphLines),
    higherLevels,
  }
}

/**
 * Spells described in SRD 5.1 but missing from its class spell lists. The
 * PDF lists Enlarge/Reduce (the markdown conversion lost it); the other three
 * are missing from the PDF too, so these follow the 5e class lists.
 */
const SRD51_MISSING_FROM_LISTS: Record<string, ClassNameType[]> = {
  "arcanist's magic aura": ["wizard"],
  "enlarge/reduce": ["sorcerer", "wizard"],
  "heroes' feast": ["cleric", "druid"],
  "hunter's mark": ["ranger"],
}

/**
 * SRD 5.1 lists each class's spells in a separate chapter rather than in
 * each spell's header.
 */
function srd51ClassLists(toc: SrdToc): Map<string, ClassNameType[]> {
  const lists = toc.byId.get("spell-lists")
  if (!lists) throw new Error("SRD 5.1 has no spell-lists section")
  const byName = new Map<string, ClassNameType[]>(Object.entries(SRD51_MISSING_FROM_LISTS))
  for (const classEntry of lists.children) {
    const className = classEntry.title.replace(/ Spells$/, "").toLowerCase() as ClassNameType
    for (const line of toc.lines.slice(classEntry.lineStart, classEntry.lineEnd)) {
      const item = /^- _(.+)_$/.exec(line.trim())
      if (!item) continue
      const key = normalizeSpellName(plainText(item[1]!))
      byName.set(key, [...(byName.get(key) ?? []), className])
    }
  }
  return byName
}

/** Every spell in a ruleset's SRD, in SRD order */
export async function getSrdSpells(ruleset: RulesetId): Promise<SrdSpellText[]> {
  const toc = await getToc(ruleset)
  const descriptions = toc.byId.get(DESCRIPTIONS_ID[ruleset])
  if (!descriptions) throw new Error(`${ruleset} has no ${DESCRIPTIONS_ID[ruleset]} section`)
  const classesByName = ruleset === SRD51_ID ? srd51ClassLists(toc) : new Map()
  return descriptions.children.map((entry) => parseSpell(ruleset, toc, entry, classesByName))
}

// --- Converting the header fields to the catalog's structured types ---

const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3 }

function quantity(text: string): number {
  return NUMBER_WORDS[text.toLowerCase()] ?? Number(text.replace(/,/g, ""))
}

export function toCastingTime(text: string): CastingTime {
  const base = text
    .replace(/ or Ritual$/, "")
    .replace(/ \(Overgrowth\) or 8 hours \(Enrichment\)$/, "")
    .replace(/^1 action or 8 hours$/, "1 action")
  const [main, ...rest] = base.split(", which you take ")
  const trigger = rest.length > 0 ? rest.join(", which you take ") : undefined
  const unit = /^(\d+) (minute|hour)s?$/.exec(main!)
  if (unit) {
    const value = Number(unit[1])
    return unit[2] === "minute" ? { type: "minutes", value } : { type: "hours", value }
  }
  switch (main!.toLowerCase()) {
    case "action":
    case "1 action":
      return { type: "action" }
    case "bonus action":
    case "1 bonus action":
      return trigger ? { type: "bonusAction", trigger } : { type: "bonusAction" }
    case "reaction":
    case "1 reaction":
      return trigger ? { type: "reaction", trigger } : { type: "reaction" }
  }
  throw new Error(`can't parse casting time "${text}"`)
}

export function toRange(text: string): Range {
  if (/^Self\b/.test(text)) return { type: "self" }
  if (text === "Touch") return { type: "touch" }
  const feet = /^(\d+) feet$/.exec(text)
  if (feet) return { type: "distance", feet: Number(feet[1]) }
  if (text === "1 mile") return { type: "distance", feet: 5280 }
  return { type: "special", text }
}

export function toDuration(text: string): Duration {
  const clean = text.replace(/\.$/, "")
  if (clean === "Instantaneous") return { type: "instantaneous" }
  if (clean === "Until dispelled") return { type: "untilDispelled" }
  const conc = /^Concentration,? up to (\w+) (round|minute|hour|day)s?$/i.exec(clean)
  if (conc) {
    const value = quantity(conc[1]!)
    // the catalog has no "day" unit for concentration
    return conc[2] === "day"
      ? { type: "concentration", max: { value: value * 24, unit: "hour" } }
      : {
          type: "concentration",
          max: { value, unit: conc[2] as "round" | "minute" | "hour" },
        }
  }
  const timed = /^(?:Up to )?(\d+) (round|minute|hour|day)s?$/i.exec(clean)
  if (timed) {
    return {
      type: "timed",
      value: Number(timed[1]),
      unit: timed[2] as "round" | "minute" | "hour" | "day",
    }
  }
  return { type: "special", text: clean }
}

export function toComponents(text: string): Components {
  const material = /\bM \((.*)\)$/.exec(text)
  const letters = text.replace(/\(.*\)$/, "")
  const components: Components = {
    verbal: /\bV\b/.test(letters),
    somatic: /\bS\b/.test(letters),
  }
  if (material) {
    const full = material[1]!
    const cost = /([\d,]+)\+? gp/i.exec(full)
    const consumed = /consume/i.test(full)
    // Like the 5.2 catalog, drop the cost clause that costGP and consumed cover, but only from a
    // single item ("a diamond worth at least 300 gp, which the spell consumes"). Keep it when
    // it covers several items or qualifies them ("..., each item worth at least 5 gp").
    const single =
      /^([^,]+?) worth (?:at least )?[\d,]+\+? gp(?:, which the spell consumes)?$/i.exec(full)
    const description = single && !/\bmaterials$/.test(single[1]!) ? single[1]! : full
    components.material = {
      description,
      ...(cost ? { costGP: quantity(cost[1]!) } : {}),
      ...(consumed ? { consumed: true } : {}),
    }
  }
  return components
}
