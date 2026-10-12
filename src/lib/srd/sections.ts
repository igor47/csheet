/**
 * Reading SRD sections for display.
 *
 * Only headings down to level TOC_DEPTH (`###`) are pages. A `###` page shows
 * everything under it, including deeper headings like a monster's Actions; a
 * page above it shows only its own intro text, and links to its child pages.
 *
 * This uses the heading level rather than depth in the TOC tree because SRD
 * 5.1 puts monsters (`###`) directly under their chapter (`#`).
 */

import type { RulesetId } from "@src/lib/dnd/rulesets"
import type { SrdToc, TocEntry } from "@src/lib/srd/toc"

export const TOC_DEPTH = 3

export interface SectionContent {
  /** Markdown for the section body, without the section's own heading */
  markdown: string
  /** Child pages to link to; empty for pages at TOC_DEPTH */
  children: TocEntry[]
}

/** True if the entry's children are pages of their own rather than part of its content. */
export function hasChildPages(entry: TocEntry): boolean {
  return entry.level < TOC_DEPTH && entry.children.length > 0
}

/**
 * Link to a section (or the landing page) in the /rules browser.
 * Slashes in section ids stay readable: "/" is allowed in a query string.
 */
export function rulesHref(ruleset: RulesetId, sectionId?: string): string {
  const base = `/rules?ruleset=${encodeURIComponent(ruleset)}`
  if (!sectionId) return base
  return `${base}&section=${encodeURIComponent(sectionId).replaceAll("%2F", "/")}`
}

export function findSection(toc: SrdToc, id: string): TocEntry | undefined {
  return toc.byId.get(id)
}

export function readSection(toc: SrdToc, entry: TocEntry): SectionContent {
  const children = hasChildPages(entry) ? entry.children : []
  // lineStart is the heading itself, so the body starts on the next line
  const lastLine = children.length > 0 ? children[0]!.lineStart - 1 : entry.lineEnd
  const markdown = toc.lines.slice(entry.lineStart, lastLine).join("\n").trim()
  return { markdown, children: children.filter((child) => !isEmptySection(toc, child)) }
}

/**
 * True for a heading with no text and nothing under it, which isn't worth a page.
 * SRD 5.1 has these as group labels, e.g. "## Dragons, Chromatic" directly
 * followed by "## Black Dragon".
 */
export function isEmptySection(toc: SrdToc, entry: TocEntry): boolean {
  return (
    entry.children.length === 0 &&
    toc.lines.slice(entry.lineStart, entry.lineEnd).join("").trim() === ""
  )
}

/**
 * Skips over entries that only wrap a same-titled child, returning the child.
 *
 * SRD 5.2.1 groups monsters under a `##` heading even when the group has just
 * one monster (`## Aboleth` > `### Aboleth`), so the wrapper's own page is empty.
 */
export function resolvePage(toc: SrdToc, entry: TocEntry): TocEntry {
  const only = entry.children.length === 1 ? entry.children[0]! : undefined
  if (only && only.title === entry.title && readSection(toc, entry).markdown === "") {
    return resolvePage(toc, only)
  }
  return entry
}

/** The entries above `entry` in the TOC, outermost first. */
export function ancestors(toc: SrdToc, entry: TocEntry): TocEntry[] {
  const segments = entry.id.split("/")
  return segments
    .slice(0, -1)
    .map((_, i) => toc.byId.get(segments.slice(0, i + 1).join("/")))
    .filter((e): e is TocEntry => e !== undefined)
}
