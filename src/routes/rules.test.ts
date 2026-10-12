import { describe, expect, test } from "bun:test"
import { useTestApp } from "@src/test/app"
import { elementExists, expectElement, getElements, makeRequest, parseHtml } from "@src/test/http"

describe("GET /rules", () => {
  const testCtx = useTestApp()

  describe("without a section", () => {
    test("lists the chapters and shows the attribution", async () => {
      const response = await makeRequest(testCtx.app, "/rules?ruleset=srd52")
      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      const content = expectElement(document, "#rules-content")
      expect(content.textContent).toContain("Playing the Game")
      expect(content.textContent).toContain("System Reference Document 5.2.1")
      expect(elementExists(document, "#rules-toc")).toBe(true)
    })

    test("defaults to SRD 5.1", async () => {
      const response = await makeRequest(testCtx.app, "/rules")
      const document = await parseHtml(response)
      const selected = expectElement(document, "select[name=ruleset] option[selected]")
      expect(selected.getAttribute("value")).toBe("srd51")
    })
  })

  describe("with a section", () => {
    test("renders the section and marks it active in the TOC", async () => {
      const section = "spells/spell-descriptions/fireball"
      const response = await makeRequest(testCtx.app, `/rules?ruleset=srd52&section=${section}`)
      expect(response.status).toBe(200)

      const document = await parseHtml(response)
      expect(expectElement(document, "#rules-content h2").textContent).toBe("Fireball")
      expect(expectElement(document, "#rules-content").textContent).toContain("8d6")
      expect(expectElement(document, "title").textContent).toContain("Fireball")

      const active = expectElement(document, "#rules-toc .rules-toc-link.active")
      expect(active.getAttribute("data-section")).toBe(section)
      // the branches leading to the active section start open
      expect(getElements(document, "#rules-toc details[open]").length).toBe(2)
    })

    test("wraps tables so wide ones scroll instead of widening the page", async () => {
      const response = await makeRequest(
        testCtx.app,
        "/rules?ruleset=srd52&section=classes/wizard/wizard-class-features"
      )
      const document = await parseHtml(response)
      expect(elementExists(document, "#rules-content .table-responsive > table.table")).toBe(true)
    })

    test("links a chapter to its child pages", async () => {
      const response = await makeRequest(testCtx.app, "/rules?ruleset=srd52&section=spells")
      const document = await parseHtml(response)
      const links = getElements(document, "#rules-content .list-group-item")
      expect(links.map((l) => l.textContent)).toContain("Spell Descriptions")
    })

    test("redirects a single-monster wrapper to the monster", async () => {
      const response = await makeRequest(
        testCtx.app,
        "/rules?ruleset=srd52&section=monsters-a-z/aboleth"
      )
      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe(
        "/rules?ruleset=srd52&section=monsters-a-z/aboleth/aboleth"
      )
    })

    test("still accepts links with encoded slashes", async () => {
      const response = await makeRequest(
        testCtx.app,
        "/rules?ruleset=srd52&section=spells%2Fspell-descriptions%2Ffireball"
      )
      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      expect(expectElement(document, "#rules-content h2").textContent).toBe("Fireball")
    })

    test("redirects an unknown section to the landing page", async () => {
      const response = await makeRequest(testCtx.app, "/rules?ruleset=srd52&section=nope")
      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/rules?ruleset=srd52")
    })
  })

  describe("when an htmx link swaps the content pane", () => {
    test("returns only the section, with its title", async () => {
      const response = await makeRequest(
        testCtx.app,
        "/rules?ruleset=srd52&section=spells/spell-descriptions/fireball",
        { headers: { "HX-Request": "true", "HX-Target": "rules-content" } }
      )
      const html = await response.text()
      expect(html).toContain("<title>Fireball - Rules Reference</title>")
      expect(html).toContain("8d6")
      expect(html).not.toContain('id="rules-toc"')
      expect(html).not.toContain('<nav class="navbar')
    })

    test("varies on the htmx headers so caches keep the partial and page apart", async () => {
      const response = await makeRequest(testCtx.app, "/rules?ruleset=srd52&section=spells", {
        headers: { "HX-Request": "true", "HX-Target": "rules-content" },
      })
      expect(response.headers.get("Vary")).toContain("HX-Target")
    })

    test("returns the whole page for a history restore", async () => {
      const response = await makeRequest(testCtx.app, "/rules?ruleset=srd52&section=spells", {
        headers: {
          "HX-Request": "true",
          "HX-Target": "rules-content",
          "HX-History-Restore-Request": "true",
        },
      })
      const document = await parseHtml(response)
      expect(elementExists(document, "#rules-toc")).toBe(true)
    })
  })
})
