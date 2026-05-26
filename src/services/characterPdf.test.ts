import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { computeCharacter } from "@src/services/computeCharacter"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { PDFDocument } from "pdf-lib"
import { generateCampaignPdf, generateCharacterPdf } from "./characterPdf"

async function loadPdf(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes)
}

function readText(doc: PDFDocument, name: string): string {
  return doc.getForm().getTextField(name).getText() ?? ""
}

function readDropdown(doc: PDFDocument, name: string): string {
  return doc.getForm().getDropdown(name).getSelected().join(",")
}

function isChecked(doc: PDFDocument, name: string): boolean {
  return doc.getForm().getCheckBox(name).isChecked()
}

describe("generateCharacterPdf", () => {
  const testCtx = useTestApp()
  let user: User

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
  })

  describe("srd52 (2024)", () => {
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

    test("returns a single-page PDF with character info filled in", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(out.getPageCount()).toBe(1)
      expect(readText(out, "PC Name")).toBe("Test Hero")
      expect(readText(out, "Class and Levels")).toBe("Wizard 4")
      expect(readText(out, "Character Level")).toBe("4")
      expect(readDropdown(out, "Background")).toBe("sage")
      expect(readDropdown(out, "Race")).toBe("human")
      expect(readDropdown(out, "Alignment")).toBe("neutral good")
    })

    test("fills ability scores, modifiers, and saving throws", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(readText(out, "Str")).toBe("8")
      expect(readText(out, "Str Mod")).toBe("-1")
      expect(readText(out, "Dex")).toBe("14")
      expect(readText(out, "Dex Mod")).toBe("+2")
      expect(readText(out, "Int")).toBe("17")
      expect(readText(out, "Int Mod")).toBe("+3")
    })

    test("fills combat block: AC, initiative, speed, HP, prof bonus, passive perception", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      // Save/init/prof fields use unsigned format (layout supplies "+").
      expect(readText(out, "AC")).toBe(String(computed.armorClass))
      expect(readText(out, "Initiative bonus")).toBe(String(computed.initiative))
      expect(readText(out, "Speed")).toBe(String(computed.speed))
      expect(readText(out, "HP Max")).toBe(String(computed.maxHitPoints))
      expect(readText(out, "HP Current")).toBe(String(computed.currentHP))
      expect(readText(out, "Proficiency Bonus")).toBe("2") // level 4 → +2
      expect(readText(out, "Passive Perception")).toBe(String(computed.passivePerception))
    })

    test("fills skill modifiers", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      // Skill fields use unsigned format; "-1" keeps its minus, "+2" becomes "2".
      expect(readText(out, "Arc")).toBe(String(computed.skills.arcana.modifier))
      expect(readText(out, "Acr")).toBe(String(computed.skills.acrobatics.modifier))
      expect(readText(out, "Ath")).toBe(String(computed.skills.athletics.modifier))
    })

    test("fills hit dice for single-class character", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      // Wizard 4 → 4 d6 hit dice
      expect(readText(out, "HD1 Die")).toBe("d6")
      expect(readText(out, "HD1 Level")).toBe("4")
    })

    test("fills Player Name when supplied", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed, "Igor")
      const out = await loadPdf(bytes)

      expect(readText(out, "Player Name")).toBe("Igor")
    })

    test("leaves Player Name blank when not supplied", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(readText(out, "Player Name")).toBe("")
    })

    test("removes the d20warning overlay", async () => {
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(() => out.getForm().getButton("d20warning")).toThrow()
    })

    test("renders a lineage as 'species (lineage)'", async () => {
      // Override species to include lineage by editing the DB character row
      const elfChar = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "elf", lineage: "high" },
        testCtx.db
      )
      const computed = await computeCharacter(testCtx.db, elfChar.id)
      if (!computed) throw new Error("computeCharacter returned null")

      const bytes = await generateCharacterPdf(computed)
      const out = await loadPdf(bytes)

      expect(readDropdown(out, "Race")).toBe("elf (high)")
    })
  })

  describe("srd51 (2014)", () => {
    test("returns a single-page PDF with character info filled in", async () => {
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

      expect(out.getPageCount()).toBe(1)
      expect(readText(out, "PC Name")).toBe("Old School")
      expect(readText(out, "Class and Levels")).toBe("Fighter 3")
      expect(readDropdown(out, "Race")).toBe("elf")
    })
  })

  test("leaves saving throw proficiency unchecked when not proficient", async () => {
    // The character factory creates ability scores with proficiency: false
    // regardless of class, so all save prof boxes should remain unchecked.
    const dbChar = await characterFactory.create(
      { user_id: user.id, ruleset: "srd52", species: "human", class: "wizard", level: 1 },
      testCtx.db
    )
    const computed = await computeCharacter(testCtx.db, dbChar.id)
    if (!computed) throw new Error("computeCharacter returned null")

    const bytes = await generateCharacterPdf(computed)
    const out = await loadPdf(bytes)

    expect(isChecked(out, "Str ST Prof")).toBe(false)
    expect(isChecked(out, "Int ST Prof")).toBe(false)
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

  // Each MPMB template parse takes ~1.5s; 3-character campaigns exceed the
  // default 5s timeout. Bump these to 20s.
  test("concatenates one page per character", async () => {
    const entries = []
    for (let i = 0; i < 3; i++) {
      const dbChar = await characterFactory.create(
        { user_id: user.id, ruleset: "srd52", species: "human", name: `Hero ${i}` },
        testCtx.db
      )
      const computed = await computeCharacter(testCtx.db, dbChar.id)
      if (!computed) throw new Error("computeCharacter returned null")
      entries.push({ character: computed, playerName: `Player ${i}` })
    }

    const bytes = await generateCampaignPdf(entries)
    const out = await PDFDocument.load(bytes)

    expect(out.getPageCount()).toBe(3)
  }, 20_000)

  test("works across mixed rulesets", async () => {
    const a = await characterFactory.create(
      { user_id: user.id, ruleset: "srd51", species: "human", name: "Old" },
      testCtx.db
    )
    const b = await characterFactory.create(
      { user_id: user.id, ruleset: "srd52", species: "human", name: "New" },
      testCtx.db
    )
    const ca = await computeCharacter(testCtx.db, a.id)
    const cb = await computeCharacter(testCtx.db, b.id)
    if (!ca || !cb) throw new Error("computeCharacter returned null")

    const bytes = await generateCampaignPdf([{ character: ca }, { character: cb }])
    const out = await PDFDocument.load(bytes)

    expect(out.getPageCount()).toBe(2)
  }, 20_000)
})
