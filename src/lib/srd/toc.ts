/**
 * Table of Contents for the SRD reference documents.
 *
 * The TOC is built at runtime from the markdown headings in the vendored
 * SRD files (see refdocs/README.md), and cached per ruleset.
 */

import type { RulesetId } from "@src/lib/dnd/rulesets"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"

export interface TocEntry {
  /** Stable section identifier built from the title path, e.g. "playing-the-game/d20-tests" */
  id: string
  /** Section title, e.g. "Damage Rolls" */
  title: string
  /** Titles from the top-level chapter down to this section */
  path: string[]
  /** Heading depth: 1 = chapter (`#`), 2 = section (`##`), etc. */
  level: number
  /** Line number (1-based) of this section's heading */
  lineStart: number
  /** Last line number (1-based) of this section, including its subsections */
  lineEnd: number
  children: TocEntry[]
}

export interface SrdToc {
  ruleset: RulesetId
  /** Path to the markdown file, relative to the project root */
  filePath: string
  entries: TocEntry[]
}

export const SRD_FILES: Record<RulesetId, string> = {
  [SRD51_ID]: "refdocs/SRD_CC_v5.1.md",
  [SRD52_ID]: "refdocs/SRD_CC_v5.2.1.md",
}

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/

/** Removes markdown backslash escapes, e.g. "Attack \[Action\]" -> "Attack [Action]" */
function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, "$1")
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Builds a TOC tree from the markdown headings in `markdown`.
 *
 * Each section runs from its heading to the line before the next heading at
 * the same or a higher level. Sibling sections with the same title get a
 * numeric suffix on their id ("actions", "actions-2").
 */
export function parseToc(markdown: string): TocEntry[] {
  const lines = markdown.split("\n")
  const root: TocEntry[] = []
  // open sections, from outermost to innermost
  const stack: TocEntry[] = []

  const closeUntil = (level: number, lastLine: number) => {
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
      stack.pop()!.lineEnd = lastLine
    }
  }

  lines.forEach((line, i) => {
    const match = HEADING_RE.exec(line)
    if (!match) return

    const level = match[1]!.length
    const title = unescapeMarkdown(match[2]!)
    const lineNumber = i + 1
    closeUntil(level, lineNumber - 1)

    const parent = stack[stack.length - 1]
    const siblings = parent ? parent.children : root
    const baseSlug = slugify(title)
    const taken = new Set(siblings.map((s) => s.id.split("/").pop()))
    let slug = baseSlug
    for (let n = 2; taken.has(slug); n++) slug = `${baseSlug}-${n}`

    const entry: TocEntry = {
      id: parent ? `${parent.id}/${slug}` : slug,
      title,
      path: parent ? [...parent.path, title] : [title],
      level,
      lineStart: lineNumber,
      lineEnd: lineNumber,
      children: [],
    }
    siblings.push(entry)
    stack.push(entry)
  })

  // a trailing newline leaves an empty last element that isn't a real line
  const lastLine = lines.at(-1) === "" ? lines.length - 1 : lines.length
  closeUntil(0, lastLine)
  return root
}

const tocCache = new Map<RulesetId, Promise<SrdToc>>()

/** Returns the parsed TOC for a ruleset, reading the markdown file on first use. */
export function getToc(ruleset: RulesetId): Promise<SrdToc> {
  let toc = tocCache.get(ruleset)
  if (!toc) {
    const filePath = SRD_FILES[ruleset]
    toc = Bun.file(`${import.meta.dir}/../../../${filePath}`)
      .text()
      .then((markdown) => ({ ruleset, filePath, entries: parseToc(markdown) }))
      .catch((error) => {
        // don't cache a failed read
        tocCache.delete(ruleset)
        throw error
      })
    tocCache.set(ruleset, toc)
  }
  return toc
}
