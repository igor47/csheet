import { SpellDetail } from "@src/components/SpellDetail"
import { Spells } from "@src/components/Spells"
import { SpellsTable } from "@src/components/SpellsTable"
import type { ClassNameType } from "@src/lib/dnd"
import { parseRulesetParam } from "@src/lib/dnd/rulesets"
import { spellIssue } from "@src/lib/dnd/spellIssues"
import { findSpell, getSpells, type SpellSchoolType } from "@src/lib/dnd/spells"
import { normalizeSpellName } from "@src/lib/srd/spells"
import { Hono } from "hono"

export const spellsRoutes = new Hono()

spellsRoutes.get("/spells", async (c) => {
  // Parse query parameters
  const ruleset = parseRulesetParam(c.req.query("ruleset"))
  const classFilter = c.req.query("class") as ClassNameType | undefined
  const maxLevelStr = c.req.query("maxLevel")
  const maxLevel = maxLevelStr ? parseInt(maxLevelStr, 10) : undefined
  const schoolFilter = c.req.query("school") as SpellSchoolType | undefined
  const searchQuery = c.req.query("search")
  const sortBy = c.req.query("sortBy") || "level"
  const sortOrder = c.req.query("sortOrder") || "asc"
  const openSpellId = c.req.query("openSpell")

  // Filter spells
  let filteredSpells = [...getSpells(ruleset)]

  if (classFilter) {
    filteredSpells = filteredSpells.filter((spell) => spell.classes.includes(classFilter))
  }

  if (maxLevel !== undefined && !Number.isNaN(maxLevel)) {
    filteredSpells = filteredSpells.filter((spell) => spell.level <= maxLevel)
  }

  if (schoolFilter) {
    filteredSpells = filteredSpells.filter((spell) => spell.school === schoolFilter)
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    // normalized, since 5.2 text uses curly apostrophes and 5.1 text straight ones
    const query = normalizeSpellName(searchQuery)
    filteredSpells = filteredSpells.filter(
      (spell) =>
        normalizeSpellName(spell.name).includes(query) ||
        normalizeSpellName(spell.description).includes(query) ||
        normalizeSpellName(spell.briefDescription).includes(query)
    )
  }

  // Sort spells
  filteredSpells.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name)
        break
      case "level":
        comparison = a.level - b.level
        break
      case "school":
        comparison = a.school.localeCompare(b.school)
        break
      default:
        comparison = a.level - b.level
    }

    return sortOrder === "desc" ? -comparison : comparison
  })

  // Check if this is an HTMX request
  const isHtmxRequest = c.req.header("HX-Request") === "true"

  if (isHtmxRequest) {
    return c.html(
      <>
        <input type="hidden" id="sortBy" name="sortBy" value={sortBy} hx-swap-oob="true" />
        <input type="hidden" id="sortOrder" name="sortOrder" value={sortOrder} hx-swap-oob="true" />
        <SpellsTable
          spells={filteredSpells}
          sortBy={sortBy}
          sortOrder={sortOrder}
          selectedRuleset={ruleset}
          selectedClass={classFilter}
          selectedMaxLevel={maxLevelStr}
          selectedSchool={schoolFilter}
          searchQuery={searchQuery}
        />
      </>
    )
  }

  // Find spell to open if openSpell param is present; a character sheet links to
  // its spells in its own ruleset, which can include ones from the other ruleset
  const openSpell = openSpellId ? findSpell(ruleset, openSpellId) : undefined

  // Return full page for initial load
  return c.render(
    <Spells
      spells={filteredSpells}
      selectedRuleset={ruleset}
      selectedClass={classFilter}
      selectedMaxLevel={maxLevelStr}
      selectedSchool={schoolFilter}
      searchQuery={searchQuery}
      sortBy={sortBy}
      sortOrder={sortOrder}
      openSpell={openSpell}
    />,
    { title: "Spells" }
  )
})

spellsRoutes.get("/spells/:id", async (c) => {
  const spellId = c.req.param("id")
  const ruleset = parseRulesetParam(c.req.query("ruleset"))
  const isHtmxRequest = c.req.header("HX-Request") === "true"

  // If not HTMX, redirect to /spells?openSpell=:id
  if (!isHtmxRequest) {
    return c.redirect(`/spells?openSpell=${spellId}&ruleset=${ruleset}`)
  }

  // Find spell by ID
  const found = findSpell(ruleset, spellId)

  if (!found) {
    return c.html(
      <>
        <div class="modal-header">
          <h5 class="modal-title">Spell Not Found</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">The spell with ID "{spellId}" could not be found.</div>
        </div>
      </>
    )
  }

  return c.html(<SpellDetail spell={found.spell} issue={spellIssue(ruleset, found)} />)
})
