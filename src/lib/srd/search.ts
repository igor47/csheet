/**
 * Keyword search over SRD pages, for Reed's search_rules tool.
 *
 * Every page (see sections.ts) is a document; its title and TOC path count
 * extra so "grappled" ranks the Grappled condition above pages that merely
 * mention grappling. Scores use BM25. The index is built on first use and
 * cached per ruleset, like the TOC.
 */

import type { RulesetId } from "@src/lib/dnd/rulesets"
import { isEmptySection, readSection, resolvePage, TOC_DEPTH } from "@src/lib/srd/sections"
import { getToc, type SrdToc, type TocEntry } from "@src/lib/srd/toc"

export interface SearchResult {
  entry: TocEntry
  /** Plain-text excerpt around the first matching word, or the start of the section */
  excerpt: string
  score: number
}

interface IndexedPage {
  entry: TocEntry
  /** Section text with markdown syntax removed, for excerpts */
  text: string
  termCounts: Map<string, number>
  length: number
}

interface SearchIndex {
  pages: IndexedPage[]
  /** Number of pages containing each term */
  docFrequency: Map<string, number>
  averageLength: number
}

const TITLE_WEIGHT = 5
const PATH_WEIGHT = 2
const EXCERPT_LENGTH = 200
/** Added to a page whose title is exactly the query, so "Fireball" beats "Wand of Fireballs" */
const EXACT_TITLE_BONUS = 10

const STOP_WORDS = new Set(
  "a an and are as at be by can do does for from how i if in is it its of on or the to what when with you your".split(
    " "
  )
)

/** Crude stemming so "grappled", "grappling" and "grapples" match "grapple". */
function stem(word: string): string {
  const base = word.length > 4 ? word.replace(/(ing|ed|es|s)$/, "") : word
  return base.length > 3 ? base.replace(/e$/, "") : base
}

/** A title for exact comparison, without tags like "[Condition]" */
function titleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP_WORDS.has(w)).map(stem)
}

/** Strips markdown syntax down to readable text, collapsing whitespace. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/^\|?[\s:|-]+\|?$/gm, " ") // table separator rows
    .replace(/[*_`|>]/g, "")
    .replace(/\\([[\]()])/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

function countTerms(weightedTokens: [string[], number][]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const [tokens, weight] of weightedTokens) {
    for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + weight)
  }
  return counts
}

function buildIndex(toc: SrdToc): SearchIndex {
  const pages: IndexedPage[] = []
  const docFrequency = new Map<string, number>()

  for (const entry of toc.byId.values()) {
    // pages are the top TOC_DEPTH levels, minus wrappers that just redirect to their child
    // and empty group labels
    if (entry.level > TOC_DEPTH || resolvePage(toc, entry) !== entry) continue
    if (isEmptySection(toc, entry)) continue

    const text = toPlainText(readSection(toc, entry).markdown)
    const termCounts = countTerms([
      [tokenize(text), 1],
      [tokenize(entry.title), TITLE_WEIGHT],
      [tokenize(entry.path.slice(0, -1).join(" ")), PATH_WEIGHT],
    ])
    let length = 0
    for (const count of termCounts.values()) length += count

    pages.push({ entry, text, termCounts, length })
    for (const term of termCounts.keys()) {
      docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1)
    }
  }

  const averageLength = pages.reduce((sum, p) => sum + p.length, 0) / pages.length
  return { pages, docFrequency, averageLength }
}

function excerptFor(text: string, terms: string[]): string {
  const lower = text.toLowerCase()
  const hits = terms.map((t) => lower.search(new RegExp(`\\b${t}`))).filter((i) => i >= 0)
  const start = hits.length > 0 ? Math.max(0, Math.min(...hits) - EXCERPT_LENGTH / 4) : 0
  // begin and end on word boundaries
  const from = start === 0 ? 0 : text.indexOf(" ", start) + 1
  let excerpt = text.slice(from, from + EXCERPT_LENGTH)
  if (from + EXCERPT_LENGTH < text.length) excerpt = `${excerpt.replace(/\s\S*$/, "")}…`
  return from > 0 ? `…${excerpt}` : excerpt
}

const indexCache = new Map<RulesetId, Promise<SearchIndex>>()

function getIndex(ruleset: RulesetId): Promise<SearchIndex> {
  let index = indexCache.get(ruleset)
  if (!index) {
    index = getToc(ruleset)
      .then(buildIndex)
      .catch((error) => {
        // don't cache a failed build
        indexCache.delete(ruleset)
        throw error
      })
    indexCache.set(ruleset, index)
  }
  return index
}

/** Returns the best-matching pages for a query, highest score first. */
export async function searchRules(
  ruleset: RulesetId,
  query: string,
  limit = 8
): Promise<SearchResult[]> {
  const terms = [...new Set(tokenize(query))]
  const queryKey = titleKey(query)
  if (terms.length === 0) return []

  const { pages, docFrequency, averageLength } = await getIndex(ruleset)
  const k1 = 1.2
  const b = 0.75

  const scored: SearchResult[] = []
  for (const page of pages) {
    let score = 0
    for (const term of terms) {
      const tf = page.termCounts.get(term)
      if (!tf) continue
      const df = docFrequency.get(term) ?? 0
      const idf = Math.log(1 + (pages.length - df + 0.5) / (df + 0.5))
      score += (idf * tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * page.length) / averageLength))
    }
    if (score === 0) continue
    if (titleKey(page.entry.title) === queryKey) score += EXACT_TITLE_BONUS
    scored.push({ entry: page.entry, excerpt: "", score })
  }

  scored.sort((x, y) => y.score - x.score)
  const top = scored.slice(0, limit)
  const textById = new Map(pages.map((p) => [p.entry.id, p.text]))
  for (const result of top) {
    result.excerpt = excerptFor(textById.get(result.entry.id) ?? "", terms)
  }
  return top
}
