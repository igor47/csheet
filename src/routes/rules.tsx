import { Rules, RulesSection, rulesPageTitle } from "@src/components/Rules"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { ancestors, findSection, readSection, resolvePage, rulesHref } from "@src/lib/srd/sections"
import { getToc } from "@src/lib/srd/toc"
import { Hono } from "hono"

export const rulesRoutes = new Hono()

function normalizeRuleset(value: string | undefined): RulesetId {
  return value === "srd52" ? "srd52" : "srd51"
}

rulesRoutes.get("/rules", async (c) => {
  const ruleset = normalizeRuleset(c.req.query("ruleset"))
  const sectionId = c.req.query("section")
  const toc = await getToc(ruleset)

  const found = sectionId ? findSection(toc, sectionId) : undefined
  if (sectionId && !found) {
    return c.redirect(rulesHref(ruleset))
  }

  const entry = found && resolvePage(toc, found)
  if (found && entry !== found) {
    return c.redirect(rulesHref(ruleset, entry!.id))
  }

  const section = entry ? readSection(toc, entry) : { markdown: "", children: toc.entries }
  const props = {
    toc,
    entry,
    ancestors: entry ? ancestors(toc, entry) : [],
    markdown: section.markdown,
    childPages: section.children,
  }

  // the same URL returns a partial or the whole page depending on these headers,
  // so caches (including the back/forward cache) must keep them apart
  c.header("Vary", "HX-Request, HX-Target")

  // links in the page swap only the content pane; history restores need the whole page
  const isContentSwap =
    c.req.header("HX-Target") === "rules-content" &&
    c.req.header("HX-History-Restore-Request") !== "true"
  if (isContentSwap) {
    return c.html(
      <>
        <title>{rulesPageTitle(entry)}</title>
        <RulesSection {...props} />
      </>
    )
  }

  return c.render(<Rules {...props} />, { title: rulesPageTitle(entry) })
})
