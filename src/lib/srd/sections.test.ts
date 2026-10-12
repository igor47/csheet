import { describe, expect, test } from "bun:test"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { findSection, readSection } from "@src/lib/srd/sections"
import { getToc } from "@src/lib/srd/toc"

async function read(ruleset: typeof SRD51_ID | typeof SRD52_ID, id: string) {
  const toc = await getToc(ruleset)
  const entry = findSection(toc, id)
  if (!entry) throw new Error(`no section ${id}`)
  return readSection(toc, entry)
}

describe("readSection", () => {
  test("returns undefined for an unknown id", async () => {
    const toc = await getToc(SRD52_ID)
    expect(findSection(toc, "no/such/section")).toBeUndefined()
  })

  describe("a chapter", () => {
    test("shows only its intro, and links to its child pages", async () => {
      const { markdown, children } = await read(SRD52_ID, "spells")
      expect(children.map((c) => c.title)).toContain("Spell Descriptions")
      expect(markdown).not.toContain("Fireball")
      expect(markdown).not.toMatch(/^#/m)
    })
  })

  describe("a page at the deepest TOC level", () => {
    test("shows the spell without its own heading", async () => {
      const { markdown, children } = await read(SRD52_ID, "spells/spell-descriptions/fireball")
      expect(children).toEqual([])
      expect(markdown).not.toContain("### Fireball")
      expect(markdown).toContain("8d6")
    })

    test("includes deeper headings in a monster stat block", async () => {
      const { markdown, children } = await read(SRD52_ID, "monsters-a-z/aboleth/aboleth")
      expect(children).toEqual([])
      expect(markdown).toContain("#### Actions")
    })

    test("handles SRD 5.1 monsters, which sit directly under their chapter", async () => {
      const { markdown, children } = await read(SRD51_ID, "monsters-a/aboleth")
      expect(children).toEqual([])
      expect(markdown).toContain("#### Legendary Actions")
    })
  })

  describe("a chapter with empty group labels", () => {
    test("leaves them out of its child pages", async () => {
      const { children } = await read(SRD51_ID, "monsters-d")
      const titles = children.map((c) => c.title)
      expect(titles).not.toContain("Dragons, Chromatic")
      expect(titles).toContain("Black Dragon")
    })
  })

  describe("a page with no child pages above the deepest level", () => {
    test("shows its full content", async () => {
      const { markdown, children } = await read(SRD51_ID, "spell-descriptions/fireball")
      expect(children).toEqual([])
      expect(markdown).toContain("8d6")
    })
  })
})
