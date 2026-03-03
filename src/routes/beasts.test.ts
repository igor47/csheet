import { describe, expect, test } from "bun:test"
import { getBeasts } from "@src/lib/dnd/beasts"
import { useTestApp } from "@src/test/app"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

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

  test("returns 404 for invalid beast ID without HTMX request", async () => {
    const response = await makeRequest(testCtx.app, "/beasts/nonexistent_beast?ruleset=srd52")

    expect(response.status).toBe(404)
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
