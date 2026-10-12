import type { RulesetId } from "@src/lib/dnd/rulesets"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { hasChildPages, isEmptySection, resolvePage } from "@src/lib/srd/sections"
import { SRD_ATTRIBUTIONS, type SrdToc, type TocEntry } from "@src/lib/srd/toc"
import { marked } from "marked"

export function rulesHref(ruleset: RulesetId, sectionId?: string): string {
  const params = new URLSearchParams({ ruleset })
  if (sectionId) params.set("section", sectionId)
  return `/rules?${params.toString()}`
}

export function rulesPageTitle(entry?: TocEntry): string {
  return entry ? `${entry.title} - Rules Reference` : "Rules Reference"
}

function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false, gfm: true }) as string
  // wide tables (e.g. class progressions) scroll on their own instead of widening the page
  return html
    .replaceAll(
      "<table>",
      '<div class="table-responsive"><table class="table table-sm table-striped">'
    )
    .replaceAll("</table>", "</table></div>")
}

/** A link that swaps just the content pane, keeping the sidebar in place. */
const SectionLink = ({
  ruleset,
  entry,
  class: className,
  children,
}: {
  ruleset: RulesetId
  entry: TocEntry
  class?: string
  children: unknown
}) => {
  const href = rulesHref(ruleset, entry.id)
  return (
    <a
      href={href}
      hx-get={href}
      hx-target="#rules-content"
      hx-swap="innerHTML show:window:top"
      hx-push-url="true"
      class={className}
      data-section={entry.id}
    >
      {children}
    </a>
  )
}

interface RulesTocProps {
  toc: SrdToc
  entries: TocEntry[]
  activeId?: string
}

/**
 * Collapsible TOC tree, down to TOC_DEPTH. Branches start open only when they
 * contain the active section; static/rules.js keeps that in sync as you navigate.
 */
const RulesToc = ({ toc, entries, activeId }: RulesTocProps) => (
  <ul class="rules-toc-list">
    {entries
      .filter((entry) => !isEmptySection(toc, entry))
      .map((entry) => {
        const page = resolvePage(toc, entry)
        const linkClass = `rules-toc-link${page.id === activeId ? " active" : ""}`
        const link = (
          <SectionLink ruleset={toc.ruleset} entry={page} class={linkClass}>
            {entry.title}
          </SectionLink>
        )

        if (!hasChildPages(page)) {
          return <li>{link}</li>
        }

        const isOpen = activeId?.startsWith(`${page.id}/`) ?? false
        return (
          <li>
            <details open={isOpen}>
              <summary>{link}</summary>
              <RulesToc toc={toc} entries={page.children} activeId={activeId} />
            </details>
          </li>
        )
      })}
  </ul>
)

export interface RulesSectionProps {
  toc: SrdToc
  /** The section to show; the landing page when undefined */
  entry?: TocEntry
  ancestors: TocEntry[]
  markdown: string
  /** Child pages to link to below the section text */
  childPages: TocEntry[]
}

/** The content pane: breadcrumb, title, section text, and links to child pages. */
export const RulesSection = ({
  toc,
  entry,
  ancestors,
  markdown,
  childPages,
}: RulesSectionProps) => {
  const ruleset = toc.ruleset
  // single-monster wrappers have no page of their own, so leave them out
  const crumbs = ancestors.filter((a) => resolvePage(toc, a) === a)

  return (
    <article data-active-section={entry?.id ?? ""}>
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a href={rulesHref(ruleset)}>Rules</a>
          </li>
          {crumbs.map((crumb) => (
            <li class="breadcrumb-item">
              <SectionLink ruleset={ruleset} entry={crumb}>
                {crumb.title}
              </SectionLink>
            </li>
          ))}
        </ol>
      </nav>

      <h2>{entry ? entry.title : "Rules Reference"}</h2>

      {markdown && (
        <div
          class="rules-markdown"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SRD content from our vendored files
          dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
        />
      )}

      {childPages.length > 0 && (
        <div class="list-group mb-3">
          {childPages.map((child) => (
            <SectionLink
              ruleset={ruleset}
              entry={resolvePage(toc, child)}
              class="list-group-item list-group-item-action"
            >
              {child.title}
            </SectionLink>
          ))}
        </div>
      )}

      <p class="small text-muted mt-5">{SRD_ATTRIBUTIONS[ruleset]}</p>
    </article>
  )
}

export const Rules = (props: RulesSectionProps) => {
  const ruleset = props.toc.ruleset

  return (
    <div class="container-fluid mt-3">
      <div class="row">
        <div class="col-12 col-md-4 col-lg-3">
          <nav class="rules-sidebar mb-3" aria-label="Rules table of contents">
            <form method="get" action="/rules" class="mb-2">
              <select
                name="ruleset"
                class="form-select form-select-sm"
                aria-label="Ruleset"
                onchange="this.form.submit()"
              >
                <option value={SRD51_ID} selected={ruleset === SRD51_ID}>
                  SRD 5.1
                </option>
                <option value={SRD52_ID} selected={ruleset === SRD52_ID}>
                  SRD 5.2.1
                </option>
              </select>
            </form>
            <button
              class="btn btn-outline-secondary btn-sm w-100 d-md-none"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#rules-toc"
              aria-expanded="false"
              aria-controls="rules-toc"
            >
              <i class="bi bi-list me-1" />
              Contents
            </button>
            <div class="collapse d-md-block" id="rules-toc">
              <RulesToc toc={props.toc} entries={props.toc.entries} activeId={props.entry?.id} />
            </div>
          </nav>
        </div>
        <div class="col-12 col-md-8 col-lg-9" id="rules-content">
          <RulesSection {...props} />
        </div>
      </div>
      <script src="/static/rules.js" />
    </div>
  )
}
