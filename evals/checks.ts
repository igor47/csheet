import type { ClassNameType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { findSection } from "@src/lib/srd/sections"
import { getToc } from "@src/lib/srd/toc"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { isReadOnly } from "@src/tools"
import type { Check, Outcome, RecordedCall } from "./types"

export function check(name: string, pass: boolean, detail?: string): Check {
  return pass ? { name, pass } : { name, pass, detail }
}

// -- character state --

export function classLevel(char: ComputedCharacter, cls: ClassNameType): number {
  return char.classes.find((c) => c.class === cls)?.level ?? 0
}

/** The character has reached `level` in `cls`, with `subclass` if given */
export function hasLevel(
  char: ComputedCharacter,
  cls: ClassNameType,
  level: number,
  subclass?: string
): Check[] {
  const entry = char.classes.find((c) => c.class === cls)
  const checks = [
    check(`${cls} level ${level}`, entry?.level === level, `got ${cls} ${entry?.level ?? 0}`),
  ]
  if (subclass) {
    checks.push(
      check(
        `${cls} subclass is ${subclass}`,
        entry?.subclass?.toLowerCase() === subclass,
        `got ${entry?.subclass ?? "none"}`
      )
    )
  }
  return checks
}

function preparedIds(char: ComputedCharacter): string[] {
  return char.spells.flatMap((s) =>
    [...s.cantripSlots, ...s.preparedSpells].flatMap((slot) =>
      slot.spell_id ? [slot.spell_id] : []
    )
  )
}

export function isPrepared(char: ComputedCharacter, spellId: string): Check {
  const ids = preparedIds(char)
  return check(`${spellId} prepared`, ids.includes(spellId), `prepared: ${ids.join(", ")}`)
}

export function notPrepared(char: ComputedCharacter, spellId: string): Check {
  return check(`${spellId} not prepared`, !preparedIds(char).includes(spellId))
}

export function inSpellbook(char: ComputedCharacter, spellId: string): Check {
  const book = char.spells.flatMap((s) => s.knownSpells ?? [])
  return check(`${spellId} in spellbook`, book.includes(spellId), `spellbook: ${book.join(", ")}`)
}

export function totalCp(char: ComputedCharacter): number {
  const c = char.coins
  if (!c) return 0
  return c.pp * 1000 + c.gp * 100 + c.ep * 50 + c.sp * 10 + c.cp
}

export function coinsAre(char: ComputedCharacter, cp: number): Check {
  return check(`coins total ${cp}cp`, totalCp(char) === cp, `got ${totalCp(char)}cp`)
}

export function findItem(char: ComputedCharacter, name: RegExp) {
  return char.equippedItems.find((i) => name.test(i.name))
}

export function hasItem(char: ComputedCharacter, name: RegExp): Check {
  return check(
    `has item ${name}`,
    !!findItem(char, name),
    `items: ${char.equippedItems.map((i) => i.name).join(", ") || "none"}`
  )
}

export function slotsAvailable(char: ComputedCharacter, level: number): number {
  return char.availableSpellSlots.filter((l) => l === level).length
}

// -- tool calls --

/** Calls that change the sheet (ones that need the player's approval) and went through */
export function edits(o: Outcome): RecordedCall[] {
  return o.calls.filter((c) => !isReadOnly(c.name) && c.status === "success")
}

export function noEdits(o: Outcome, except: string[] = []): Check {
  const made = edits(o).filter((c) => !except.includes(c.name))
  return check(
    except.length ? `no edits besides ${except.join(", ")}` : "no edits",
    made.length === 0,
    `made: ${made.map((c) => c.name).join(", ")}`
  )
}

/** Reed made a successful call to one of `names` whose parameters match */
export function called(
  o: Outcome,
  names: string | string[],
  // biome-ignore lint/suspicious/noExplicitAny: Tool parameters can be any valid JSON
  match: (params: Record<string, any>) => boolean = () => true,
  label?: string
): Check {
  const list = Array.isArray(names) ? names : [names]
  const hit = o.calls.some(
    (c) => list.includes(c.name) && c.status === "success" && match(c.parameters)
  )
  return check(label ?? `called ${list.join(" or ")}`, hit)
}

/** Reed looked something up with search_rules or read_rule */
export function lookedUpRule(o: Outcome, topic: RegExp): Check {
  return called(
    o,
    ["search_rules", "read_rule"],
    (p) => topic.test(String(p.query ?? p.section_id ?? "")),
    `looked up rules for ${topic}`
  )
}

export function lookedUpSpell(o: Outcome, spell: RegExp): Check {
  return called(
    o,
    ["lookup_spell", "search_rules", "read_rule"],
    (p) => spell.test(String(p.spell_name ?? p.query ?? p.section_id ?? "")),
    `looked up spell ${spell}`
  )
}

// -- replies --

function snippet(text: string): string {
  return text.replace(/\s+/g, " ").slice(0, 200)
}

export function replyMatches(o: Outcome, pattern: RegExp, reply = o.reply): Check {
  return check(`reply matches ${pattern}`, pattern.test(reply), `reply: ${snippet(reply)}`)
}

export function replyLacks(o: Outcome, pattern: RegExp, reply = o.reply): Check {
  return check(`reply lacks ${pattern}`, !pattern.test(reply), `reply: ${snippet(reply)}`)
}

/**
 * Every link Reed wrote points at a rules section that exists. Run on every case: Haiku 4.5
 * was seen making up D&D Beyond links (#83)
 */
export async function linksAreValid(o: Outcome): Promise<Check> {
  const text = o.transcript.turns.map((t) => t.reply).join("\n")
  const bad: string[] = []
  for (const [, url] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (!url) continue
    if (!url.startsWith("/rules")) {
      bad.push(url)
      continue
    }
    const params = new URL(url, "http://localhost").searchParams
    const section = params.get("section")
    const ruleset = (params.get("ruleset") ?? o.after.ruleset) as RulesetId
    if (section && !findSection(await getToc(ruleset), section)) bad.push(url)
  }
  // bare links outside markdown
  for (const [url] of text.matchAll(/(?<!\]\()https?:\/\/[^\s)]+/g)) bad.push(url)
  return check("links point at real rules sections", bad.length === 0, `bad: ${bad.join(", ")}`)
}
