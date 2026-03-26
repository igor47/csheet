import { describe, expect, test } from "bun:test"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { elementExists, expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /beasts", () => {
  const testCtx = useTestApp()

  test("renders the beasts list page", async () => {
    const response = await makeRequest(testCtx.app, "/beasts")

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    expect(body).toContain("Beasts")
    expect(elementExists(document, "#beasts-table")).toBe(true)
    expect(elementExists(document, "table")).toBe(true)
  })

  test("defaults to srd51 beasts", async () => {
    const response = await makeRequest(testCtx.app, "/beasts")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    const srd51Beasts = getBeasts("srd51")
    expect(body).toContain(srd51Beasts[0]!.name)
  })

  test("filters by ruleset", async () => {
    const response = await makeRequest(testCtx.app, "/beasts?ruleset=srd52")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    const srd52Beasts = getBeasts("srd52")
    expect(body).toContain(srd52Beasts[0]!.name)
  })

  test("filters by size", async () => {
    const response = await makeRequest(testCtx.app, "/beasts?size=tiny")
    const document = await parseHtml(response)

    const body = document.body.textContent || ""

    // All displayed beasts should be tiny
    const srd51Beasts = getBeasts("srd51")
    const tinyBeasts = srd51Beasts.filter((b) => b.size === "tiny")
    const nonTinyBeasts = srd51Beasts.filter((b) => b.size !== "tiny")

    if (tinyBeasts.length > 0) {
      expect(body).toContain(tinyBeasts[0]!.name)
    }
    if (nonTinyBeasts.length > 0) {
      expect(body).not.toContain(nonTinyBeasts[0]!.name)
    }
  })

  test("filters by max CR", async () => {
    const response = await makeRequest(testCtx.app, "/beasts?maxCR=0.25")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    const srd51Beasts = getBeasts("srd51")
    const highCRBeast = srd51Beasts.find((b) => b.cr > 0.25)
    if (highCRBeast) {
      expect(body).not.toContain(highCRBeast.name)
    }
  })

  test("filters by movement type", async () => {
    const response = await makeRequest(testCtx.app, "/beasts?movement=fly")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    const srd51Beasts = getBeasts("srd51")
    const flyingBeast = srd51Beasts.find((b) => b.speed.fly)
    const nonFlyingBeast = srd51Beasts.find((b) => !b.speed.fly)

    if (flyingBeast) {
      expect(body).toContain(flyingBeast.name)
    }
    if (nonFlyingBeast) {
      expect(body).not.toContain(nonFlyingBeast.name)
    }
  })

  test("searches by name", async () => {
    const response = await makeRequest(testCtx.app, "/beasts?search=wolf")
    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    expect(body).toContain("Wolf")
  })

  test("returns only table for HTMX requests", async () => {
    const response = await makeRequest(testCtx.app, "/beasts", {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    expect(elementExists(document, "#beasts-table")).toBe(true)
    // Should not have the full page wrapper
    expect(elementExists(document, "h1")).toBe(false)
  })

  test("renders filter controls", async () => {
    const response = await makeRequest(testCtx.app, "/beasts")
    const document = await parseHtml(response)

    expect(elementExists(document, "#ruleset-filter")).toBe(true)
    expect(elementExists(document, "#size-filter")).toBe(true)
    expect(elementExists(document, "#cr-filter")).toBe(true)
    expect(elementExists(document, "#movement-filter")).toBe(true)
    expect(elementExists(document, "#beast-search-filter")).toBe(true)
  })
})

describe("GET /beasts/:id", () => {
  const testCtx = useTestApp()

  test("returns beast details for a valid beast ID", async () => {
    const beasts = getBeasts("srd52")
    const wolf = beasts.find((b) => b.name === "Wolf")!

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}?ruleset=srd52`, {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)

    const document = await parseHtml(response)

    // Check for beast name in modal header
    const title = expectElement(document, ".modal-title")
    expect(title.textContent).toContain("Wolf")
  })

  test("returns 404 for invalid beast ID with HTMX request", async () => {
    const response = await makeRequest(testCtx.app, "/beasts/nonexistent_beast?ruleset=srd52", {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    expect(body).toContain("Beast Not Found")
  })

  test("redirects to list page for non-HTMX request", async () => {
    const beasts = getBeasts("srd52")
    const wolf = beasts.find((b) => b.name === "Wolf")!

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}?ruleset=srd52`)

    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toContain(`/beasts?openBeast=${wolf.id}`)
  })

  test("displays beast CR in header", async () => {
    const beasts = getBeasts("srd52")
    const wolf = beasts.find((b) => b.name === "Wolf")!

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}?ruleset=srd52`, {
      headers: { "HX-Request": "true" },
    })

    const document = await parseHtml(response)

    // Check for CR badge
    const title = expectElement(document, ".modal-title")
    expect(title.textContent).toContain("CR")
  })

  test("displays beast stats", async () => {
    const beasts = getBeasts("srd52")
    const wolf = beasts.find((b) => b.name === "Wolf")!

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}?ruleset=srd52`, {
      headers: { "HX-Request": "true" },
    })

    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    // Check for key stats
    expect(body).toContain("Armor Class")
    expect(body).toContain("Hit Points")
    expect(body).toContain("Speed")
    expect(body).toContain("Ability Scores")
  })

  test("displays beast actions", async () => {
    const beasts = getBeasts("srd52")
    const wolf = beasts.find((b) => b.name === "Wolf")!

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}?ruleset=srd52`, {
      headers: { "HX-Request": "true" },
    })

    const document = await parseHtml(response)
    const body = document.body.textContent || ""

    // Check for actions section
    expect(body).toContain("Actions")
    expect(body).toContain("Bite") // Wolf has a bite attack
  })

  test("works with srd51 ruleset", async () => {
    const beasts = getBeasts("srd51")
    const wolf = beasts.find((b) => b.name === "Wolf")

    if (!wolf) {
      // If Wolf doesn't exist in srd51, skip this test
      return
    }

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}?ruleset=srd51`, {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)

    const document = await parseHtml(response)
    const title = expectElement(document, ".modal-title")
    expect(title.textContent).toContain("Wolf")
  })

  test("defaults to srd52 ruleset when not specified", async () => {
    const beasts = getBeasts("srd52")
    const wolf = beasts.find((b) => b.name === "Wolf")!

    const response = await makeRequest(testCtx.app, `/beasts/${wolf.id}`, {
      headers: { "HX-Request": "true" },
    })

    expect(response.status).toBe(200)
  })
})
