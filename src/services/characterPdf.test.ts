import { beforeEach, describe, expect, test } from "bun:test"
import { create as createCharTrait } from "@src/db/char_traits"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { computeCharacter } from "@src/services/computeCharacter"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { decodePDFRawStream, PDFDocument, PDFRawStream } from "pdf-lib"
import { generateCampaignPdf, generateCharacterPdf } from "./characterPdf"

// pdf-lib flate-compresses content streams and encodes drawn text as PDF
// hex strings (e.g. `<54657374> Tj`). To substring-match what was drawn,
// reload the PDF, walk every PDFRawStream, decode it, then replace every
// `<HEX>` literal with its decoded ASCII before searching.
function decodeHexLiterals(s: string): string {
  return s.replace(/<([0-9A-Fa-f\s]+)>/g, (_, hex: string) => {
    const cleaned = hex.replace(/\s+/g, "")
    if (cleaned.length === 0 || cleaned.length % 2 !== 0) return ""
    let out = ""
    for (let i = 0; i < cleaned.length; i += 2) {
      out += String.fromCharCode(parseInt(cleaned.slice(i, i + 2), 16))
    }
    return out
  })
}

async function pdfTextDump(bytes: Uint8Array): Promise<string> {
  const doc = await PDFDocument.load(bytes)
  const parts: string[] = []
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    try {
      const decoded = decodePDFRawStream(obj).decode()
      parts.push(decodeHexLiterals(Buffer.from(decoded).toString("latin1")))
    } catch {
      // ignore streams we can't decode (e.g. unknown filter)
    }
  }
  return parts.join("\n")
}

async function pdfContainsText(bytes: Uint8Array, needle: string): Promise<boolean> {
  const dump = await pdfTextDump(bytes)
  return dump.includes(needle)
}

async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes)
}

describe("generateCharacterPdf", () => {
  const testCtx = useTestApp()
  let user: User

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
  })

  describe("a wizard character", () => {
    let dbChar: Character

    beforeEach(async () => {
      dbChar = await characterFactory.create(
        {
          user_id: user.id,
          ruleset: "srd52",
          name: "Test Hero",
          species: "human",
          background: "sage",
          alignment: "neutral good",
          class: "wizard",
          level: 4,
          strength: 8,
          dexterity: 14,
          constitution: 10,
          intelligence: 17,
          wisdom: 12,
          charisma: 13,
        },
        testCtx.db
      )
    })

    test("returns a PDF that parses and has at least one page", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(bytes.length).toBeGreaterThan(0)
      expect(out.getPageCount()).toBeGreaterThanOrEqual(1)
    })

    test("sets the document title to the character name", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(out.getTitle()).toContain("Test Hero")
    })

    test("renders the character name, class line, and identity fields", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "Test Hero")).toBe(true)
      expect(await pdfContainsText(bytes, "Wizard 4")).toBe(true)
      expect(await pdfContainsText(bytes, "Human")).toBe(true)
      expect(await pdfContainsText(bytes, "Sage")).toBe(true)
      expect(await pdfContainsText(bytes, "Neutral Good")).toBe(true)
    })

    test("includes the player name in the header when supplied", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed, "Igor")

      expect(await pdfContainsText(bytes, "Igor")).toBe(true)
    })

    test("omits player line text when no player name is supplied", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "Player:")).toBe(false)
    })

    test("renders top-strip and secondary-stat labels", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      for (const label of [
        "CHARACTER NAME",
        "BACKGROUND",
        "CLASS",
        "SPECIES",
        "SUBCLASS",
        "SIZE",
        "ARMOR CLASS",
        "HIT POINTS",
        "HIT DICE",
        "INITIATIVE",
        "SPEED",
        "PASSIVE PERCEPTION",
        "PROF. BONUS",
      ]) {
        expect(await pdfContainsText(bytes, label)).toBe(true)
      }
    })

    test("renders all six ability abbreviations", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      for (const ab of ["STR", "DEX", "CON", "INT", "WIS", "CHA"]) {
        expect(await pdfContainsText(bytes, ab)).toBe(true)
      }
    })

    test("renders the skills section with skill names and ability tags", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "SKILLS")).toBe(true)
      expect(await pdfContainsText(bytes, "Arcana (INT)")).toBe(true)
      expect(await pdfContainsText(bytes, "Perception (WIS)")).toBe(true)
    })

    test("renders a save row on each ability card", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const dump = await pdfTextDump(bytes)
      // Six SAVE labels — one per ability card.
      const matches = dump.match(/SAVE/g) ?? []
      expect(matches.length).toBeGreaterThanOrEqual(6)
    })

    test("renders a spellcasting section with per-class stats and slot tiles", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "SPELLCASTING")).toBe(true)
      // Per-class stats line
      expect(await pdfContainsText(bytes, "Wizard")).toBe(true)
      expect(await pdfContainsText(bytes, "Save DC")).toBe(true)
      expect(await pdfContainsText(bytes, "Atk")).toBe(true)
      expect(await pdfContainsText(bytes, "Ability")).toBe(true)
      // Slot tiles render with "L1" / "L2" labels per tile.
      expect(await pdfContainsText(bytes, "L1")).toBe(true)
      expect(await pdfContainsText(bytes, "L2")).toBe(true)
    })

    test("renders a per-class spells section on the overflow page", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "WIZARD SPELLS")).toBe(true)
    })

    test("renders a Features & Traits box on page 1 with trait names", async () => {
      await createCharTrait(testCtx.db, {
        character_id: dbChar.id,
        name: "Arcane Recovery",
        description: "Once per day during a short rest, recover spell slots.",
        source: "class",
        source_detail: "Wizard",
        level: 1,
        note: null,
      })

      const refreshed = await computeCharacter(testCtx.db, dbChar.id)
      if (!refreshed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(refreshed)

      expect(await pdfContainsText(bytes, "FEATURES & TRAITS")).toBe(true)
      expect(await pdfContainsText(bytes, "Arcane Recovery")).toBe(true)
    })

    test("does not render full trait descriptions anywhere", async () => {
      await createCharTrait(testCtx.db, {
        character_id: dbChar.id,
        name: "Arcane Recovery",
        description: "Once per day during a short rest, recover spell slots.",
        source: "class",
        source_detail: "Wizard",
        level: 1,
        note: null,
      })

      const refreshed = await computeCharacter(testCtx.db, dbChar.id)
      if (!refreshed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(refreshed)

      // Names only — no description body, no "(Full)" section.
      expect(await pdfContainsText(bytes, "Arcane Recovery")).toBe(true)
      expect(await pdfContainsText(bytes, "recover spell slots")).toBe(false)
      expect(await pdfContainsText(bytes, "FEATURES & TRAITS (FULL)")).toBe(false)
    })

    test("renders an Equipment box with a coins line", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "EQUIPMENT")).toBe(true)
      expect(await pdfContainsText(bytes, "Coins:")).toBe(true)
      expect(await pdfContainsText(bytes, "GP")).toBe(true)
    })

    test("renders the species (lineage) when a lineage is set", async () => {
      const elfChar = await characterFactory.create(
        {
          user_id: user.id,
          ruleset: "srd52",
          species: "elf",
          lineage: "high",
          class: "wizard",
          level: 1,
        },
        testCtx.db
      )
      const computed = await computeCharacter(testCtx.db, elfChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      expect(await pdfContainsText(bytes, "Elf")).toBe(true)
      expect(await pdfContainsText(bytes, "High")).toBe(true)
    })

    test("renders a footer with the character name and page numbers", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(await pdfContainsText(bytes, `page 1 of ${out.getPageCount()}`)).toBe(true)
    })
  })

  describe("a non-spellcasting character", () => {
    test("notes the absence of spellcasting in the spellcasting box", async () => {
      const fighter = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", class: "fighter", level: 3 },
        testCtx.db
      )
      const computed = await computeCharacter(testCtx.db, fighter.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)

      // The "Spellcasting" tabbed box is always present on page 1, but with
      // a "no spellcasting" placeholder for non-casters. No per-class spell
      // page is generated.
      expect(await pdfContainsText(bytes, "SPELLCASTING")).toBe(true)
      expect(await pdfContainsText(bytes, "no spellcasting")).toBe(true)
      expect(await pdfContainsText(bytes, "WIZARD SPELLS")).toBe(false)
    })
  })

  describe("srd51 ruleset", () => {
    test("renders identity fields and produces a valid PDF", async () => {
      const dbChar = await characterFactory.create(
        {
          user_id: user.id,
          ruleset: "srd51",
          name: "Old School",
          species: "elf",
          background: "noble",
          alignment: "lawful good",
          class: "fighter",
          level: 3,
        },
        testCtx.db
      )
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(out.getPageCount()).toBeGreaterThanOrEqual(1)
      expect(await pdfContainsText(bytes, "Old School")).toBe(true)
      expect(await pdfContainsText(bytes, "Fighter 3")).toBe(true)
      expect(await pdfContainsText(bytes, "Elf")).toBe(true)
    })
  })
})

describe("generateCampaignPdf", () => {
  const testCtx = useTestApp()
  let user: User

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
  })

  test("throws when given no characters", async () => {
    expect(generateCampaignPdf([])).rejects.toThrow(/zero characters/)
  })

  test("concatenates every character's full PDF, preserving per-character page counts", async () => {
    const entries = []
    let expectedTotal = 0

    for (let i = 0; i < 3; i++) {
      const dbChar = await characterFactory.create(
        {
          user_id: user.id,
          ruleset: "srd52",
          species: "human",
          name: `Hero${i}`,
          class: "wizard",
          level: 2,
        },
        testCtx.db
      )
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const charBytes = await generateCharacterPdf(computed, `Player ${i}`)
      const charDoc = await loadPdf(charBytes)
      expectedTotal += charDoc.getPageCount()

      entries.push({ character: computed, playerName: `Player ${i}` })
    }

    const bytes = await generateCampaignPdf(entries)
    const out = await loadPdf(bytes)

    expect(out.getPageCount()).toBe(expectedTotal)
    expect(await pdfContainsText(bytes, "Hero0")).toBe(true)
    expect(await pdfContainsText(bytes, "Hero1")).toBe(true)
    expect(await pdfContainsText(bytes, "Hero2")).toBe(true)
  }, 20_000)

  test("works across mixed rulesets", async () => {
    const a = await characterFactory.create(
      {
        user_id: user.id,
        ruleset: "srd51",
        species: "human",
        name: "Old",
        class: "fighter",
        level: 1,
      },
      testCtx.db
    )
    const b = await characterFactory.create(
      {
        user_id: user.id,
        ruleset: "srd52",
        species: "human",
        name: "New",
        class: "fighter",
        level: 1,
      },
      testCtx.db
    )
    const ca = await computeCharacter(testCtx.db, a.id)
    const cb = await computeCharacter(testCtx.db, b.id)
    if (!ca || !cb) throw new Error("computeCharacter returned null")

    const bytes = await generateCampaignPdf([{ character: ca }, { character: cb }])
    const out = await loadPdf(bytes)

    expect(out.getPageCount()).toBeGreaterThanOrEqual(2)
    expect(await pdfContainsText(bytes, "Old")).toBe(true)
    expect(await pdfContainsText(bytes, "New")).toBe(true)
  }, 20_000)
})
