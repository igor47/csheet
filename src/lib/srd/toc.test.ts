import { describe, expect, test } from "bun:test"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { getToc, parseToc, type TocEntry } from "@src/lib/srd/toc"

function flatten(entries: TocEntry[]): TocEntry[] {
  return entries.flatMap((e) => [e, ...flatten(e.children)])
}

describe("parseToc", () => {
  const markdown = [
    "# Monsters", // 1
    "", // 2
    "## Aboleth", // 3
    "Huge aberration", // 4
    "### Actions", // 5
    "Tentacle.", // 6
    "## Bandit", // 7
    "### Actions", // 8
    "### Actions", // 9
    "# Attack \\[Action\\]", // 10
    "Make an attack.", // 11
    "",
  ].join("\n")
  const entries = parseToc(markdown)

  test("nests headings by level", () => {
    expect(entries.map((e) => e.title)).toEqual(["Monsters", "Attack [Action]"])
    expect(entries[0]!.children.map((e) => e.title)).toEqual(["Aboleth", "Bandit"])
    expect(entries[0]!.children[0]!.children[0]!.path).toEqual(["Monsters", "Aboleth", "Actions"])
  })

  test("ends each section before the next heading at the same or a higher level", () => {
    const [monsters, attack] = entries
    const [aboleth, bandit] = monsters!.children
    expect([monsters!.lineStart, monsters!.lineEnd]).toEqual([1, 9])
    expect([aboleth!.lineStart, aboleth!.lineEnd]).toEqual([3, 6])
    expect([aboleth!.children[0]!.lineStart, aboleth!.children[0]!.lineEnd]).toEqual([5, 6])
    expect([bandit!.lineStart, bandit!.lineEnd]).toEqual([7, 9])
    expect([attack!.lineStart, attack!.lineEnd]).toEqual([10, 11])
  })

  test("builds ids from the title path, suffixing duplicate siblings", () => {
    const ids = flatten(entries).map((e) => e.id)
    expect(ids).toEqual([
      "monsters",
      "monsters/aboleth",
      "monsters/aboleth/actions",
      "monsters/bandit",
      "monsters/bandit/actions",
      "monsters/bandit/actions-2",
      "attack-action",
    ])
  })
})

describe("getToc", () => {
  for (const ruleset of [SRD51_ID, SRD52_ID]) {
    describe(ruleset, () => {
      test("has unique ids and well-formed line ranges", async () => {
        const toc = await getToc(ruleset)
        const all = flatten(toc.entries)
        expect(all.length).toBeGreaterThan(1000)
        expect(new Set(all.map((e) => e.id)).size).toBe(all.length)

        for (const entry of all) {
          expect(entry.lineEnd).toBeGreaterThanOrEqual(entry.lineStart)
          for (const child of entry.children) {
            expect(child.lineStart).toBeGreaterThan(entry.lineStart)
            expect(child.lineEnd).toBeLessThanOrEqual(entry.lineEnd)
          }
        }
      })

      test("finds the Fireball spell", async () => {
        const toc = await getToc(ruleset)
        const fireball = flatten(toc.entries).find((e) => e.title === "Fireball")
        expect(fireball?.path[0]).toMatch(/Spell/)
      })
    })
  }
})
