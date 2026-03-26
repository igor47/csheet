import { describe, expect, test } from "bun:test"
import { spells } from "@src/lib/dnd/spells"
import { useTestApp } from "@src/test/app"
import { elementExists, expectElement, makeRequest, parseHtml } from "@src/test/http"

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
    expect(response.headers.get("Location")).toContain(`/spells?openSpell=${spell.id}`)
  })
})
