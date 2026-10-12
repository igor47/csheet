import { describe, expect, test } from "bun:test"
import { getSpells } from "@src/lib/dnd/spells"
import { useTestApp } from "@src/test/app"
import { elementExists, expectElement, getElements, makeRequest, parseHtml } from "@src/test/http"

// /spells shows SRD 5.1 unless a ruleset is picked
const spells = getSpells("srd51")

describe("GET /spells", () => {
  const testCtx = useTestApp()

  test("renders the spells list page", async () => {
    const response = await makeRequest(testCtx.app, "/spells")

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    expect(body).toContain("Spells")
    expect(elementExists(document, "#spells-table")).toBe(true)
    expect(elementExists(document, "table")).toBe(true)
  })

  test("filters by class", async () => {
    const response = await makeRequest(testCtx.app, "/spells?class=wizard")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    // Should only contain wizard spells
    const nonWizardSpell = spells.find((s) => !s.classes.includes("wizard"))
    if (nonWizardSpell) {
      expect(body).not.toContain(nonWizardSpell.name)
    }
  })

  test("filters by max level", async () => {
    const response = await makeRequest(testCtx.app, "/spells?maxLevel=1")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    const highLevelSpell = spells.find((s) => s.level > 1)
    if (highLevelSpell) {
      expect(body).not.toContain(highLevelSpell.name)
    }
  })

  test("filters by school", async () => {
    const response = await makeRequest(testCtx.app, "/spells?school=evocation")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    const nonEvocationSpell = spells.find((s) => s.school !== "evocation")
    if (nonEvocationSpell) {
      expect(body).not.toContain(nonEvocationSpell.name)
    }
  })

  test("searches by name", async () => {
    const fireball = spells.find((s) => s.name === "Fireball")
    if (!fireball) return

    const response = await makeRequest(testCtx.app, "/spells?search=fireball")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    expect(body).toContain("Fireball")
  })

  test("returns only table for HTMX requests", async () => {
    const response = await makeRequest(testCtx.app, "/spells", {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    expect(elementExists(document, "#spells-table")).toBe(true)
    expect(elementExists(document, "h1")).toBe(false)
  })

  test("renders filter controls", async () => {
    const response = await makeRequest(testCtx.app, "/spells")
    const document = await parseHtml(response)

    expect(elementExists(document, "#class-filter")).toBe(true)
    expect(elementExists(document, "#level-filter")).toBe(true)
    expect(elementExists(document, "#school-filter")).toBe(true)
    expect(elementExists(document, "#search-filter")).toBe(true)
  })

  test("preserves sort params in hidden inputs", async () => {
    const response = await makeRequest(testCtx.app, "/spells?sortBy=name&sortOrder=desc")
    const document = await parseHtml(response)

    const sortByInput = expectElement(document, "#sortBy")
    const sortOrderInput = expectElement(document, "#sortOrder")

    expect(sortByInput.getAttribute("value")).toBe("name")
    expect(sortOrderInput.getAttribute("value")).toBe("desc")
  })
})

describe("GET /spells with a ruleset picked", () => {
  const testCtx = useTestApp()

  async function spellNames(path: string, headers: Record<string, string> = {}) {
    const response = await makeRequest(testCtx.app, path, { headers })
    const document = await parseHtml(response)
    return getElements(document, "#spells-table tbody tr td:first-child").map((td) =>
      td.textContent?.trim()
    )
  }

  test("lists SRD 5.1 spells by default", async () => {
    const response = await makeRequest(testCtx.app, "/spells")
    const document = await parseHtml(response)
    const names = getElements(document, "#spells-table tbody tr td:first-child").map((td) =>
      td.textContent?.trim()
    )

    expect(names).toContain("Feeblemind")
    expect(names).not.toContain("Hex")
    const selected = expectElement(document, "#ruleset-filter option[selected]")
    expect(selected.getAttribute("value")).toBe("srd51")
  })

  test("lists SRD 5.2 spells when SRD 5.2 is picked", async () => {
    const names = await spellNames("/spells?ruleset=srd52")

    expect(names).toContain("Hex")
    expect(names).not.toContain("Feeblemind")
  })

  test("switches the table when the picker changes", async () => {
    const names = await spellNames("/spells?ruleset=srd52&search=hex", { "HX-Request": "true" })

    expect(names).toEqual(["Hex"])
  })

  test("keeps the ruleset and search in sort and spell links", async () => {
    const response = await makeRequest(testCtx.app, "/spells?ruleset=srd52&search=cure", {
      headers: { "HX-Request": "true" },
    })
    const document = await parseHtml(response)

    const sortLink = expectElement(document, "#spells-table th [hx-get]")
    expect(sortLink.getAttribute("hx-get")).toContain("ruleset=srd52")
    expect(sortLink.getAttribute("hx-get")).toContain("search=cure")
    const spellLink = expectElement(document, "#spells-table tbody button[hx-get]")
    expect(spellLink.getAttribute("hx-get")).toContain("?ruleset=srd52")
    expect(spellLink.getAttribute("hx-push-url")).toContain("ruleset=srd52")
  })

  test("matches straight and curly apostrophes in either ruleset", async () => {
    expect(await spellNames("/spells?ruleset=srd52&search=hunter's mark")).toEqual([
      "Hunter’s Mark",
    ])
    expect(await spellNames("/spells?ruleset=srd51&search=hunter’s mark")).toEqual([
      "Hunter's Mark",
    ])
  })

  test("shows the picked ruleset's version of a spell", async () => {
    const detail = async (ruleset: string) => {
      const response = await makeRequest(
        testCtx.app,
        `/spells/srd_cure_wounds?ruleset=${ruleset}`,
        {
          headers: { "HX-Request": "true" },
        }
      )
      return (await parseHtml(response)).body.textContent || ""
    }

    expect(await detail("srd51")).toContain("1d8 + your spellcasting ability modifier")
    expect(await detail("srd52")).toContain("2d8 plus your spellcasting ability modifier")
  })

  test("opens a spell from the other ruleset with a badge", async () => {
    const response = await makeRequest(testCtx.app, "/spells?ruleset=srd51&openSpell=srd_hex")
    const document = await parseHtml(response)

    expect(expectElement(document, ".modal-title").textContent).toContain("Hex")
    expect(elementExists(document, ".modal-title .spell-issue-badge")).toBe(true)
  })
})

describe("GET /spells/:id", () => {
  const testCtx = useTestApp()
  const spell = spells[0]!

  test("returns spell details for HTMX request", async () => {
    const response = await makeRequest(testCtx.app, `/spells/${spell.id}`, {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    const title = expectElement(document, ".modal-title")
    expect(title.textContent).toContain(spell.name)
  })

  test("redirects to list page for non-HTMX request", async () => {
    const response = await makeRequest(testCtx.app, `/spells/${spell.id}`)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe(`/spells?openSpell=${spell.id}&ruleset=srd51`)
  })
})
