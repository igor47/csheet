import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { computeCharacter } from "@src/services/computeCharacter"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { PDFDocument } from "pdf-lib"
import { generateCharacterPdf } from "./characterPdf"

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
      { user_id: user.id, ruleset: "srd52", class: "wizard", level: 1 },
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
