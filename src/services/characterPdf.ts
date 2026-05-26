import { config } from "@src/config"
import { Abilities, type AbilityType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { PDFDocument, type PDFForm } from "pdf-lib"

const TEMPLATE_PATHS: Record<RulesetId, string> = {
  srd51: `${config.repoRoot}/assets/mpmb/srd51.pdf`,
  srd52: `${config.repoRoot}/assets/mpmb/srd52.pdf`,
}

const ABILITY_TO_MPMB: Record<AbilityType, string> = {
  strength: "Str",
  dexterity: "Dex",
  constitution: "Con",
  intelligence: "Int",
  wisdom: "Wis",
  charisma: "Cha",
}

const fmt = (n: number): string => (n >= 0 ? `+${n}` : `${n}`)

const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

function classString(character: ComputedCharacter): string {
  return character.classes.map((c) => `${titleCase(c.class)} ${c.level}`).join(" / ")
}

function totalLevel(character: ComputedCharacter): number {
  return character.classes.reduce((sum, c) => sum + c.level, 0)
}

// pdf-lib throws if a field doesn't exist or is the wrong type. We log and skip
// rather than crashing the whole sheet — the field universe is large and
// version-dependent across srd51 / srd52 templates.
function setText(form: PDFForm, name: string, value: string): void {
  try {
    form.getTextField(name).setText(value)
  } catch {
    logger.warn("pdf: skipping missing text field", { name })
  }
}

function checkBox(form: PDFForm, name: string): void {
  try {
    form.getCheckBox(name).check()
  } catch {
    logger.warn("pdf: skipping missing checkbox", { name })
  }
}

// MPMB uses PDFDropdown for Background / Race / Alignment, but allows free-text
// entry. We pass our value as a new option so custom species/backgrounds work.
function setDropdown(form: PDFForm, name: string, value: string): void {
  try {
    const dropdown = form.getDropdown(name)
    dropdown.addOptions([value])
    dropdown.select(value)
  } catch {
    logger.warn("pdf: skipping missing dropdown", { name })
  }
}

function fillCharacterFields(form: PDFForm, character: ComputedCharacter): void {
  setText(form, "PC Name", character.name)
  setText(form, "Class and Levels", classString(character))
  setText(form, "Character Level", String(totalLevel(character)))
  if (character.background) setDropdown(form, "Background", character.background)
  const speciesText = character.lineage
    ? `${character.species} (${character.lineage})`
    : character.species
  setDropdown(form, "Race", speciesText)
  if (character.alignment) setDropdown(form, "Alignment", character.alignment)

  for (const ability of Abilities) {
    const prefix = ABILITY_TO_MPMB[ability]
    const score = character.abilityScores[ability]
    setText(form, prefix, String(score.score))
    setText(form, `${prefix} Mod`, fmt(score.modifier))
    setText(form, `${prefix} ST Mod`, fmt(score.savingThrow))
    if (score.proficient) checkBox(form, `${prefix} ST Prof`)
  }
}

// MPMB's "CRITICAL FAIL!" d20 overlay is a form button that is visible by
// default and hidden by MPMB's AcroForm JavaScript when running in Adobe
// Acrobat. We don't execute that JS, so we must remove the button ourselves.
function removeD20Warning(form: PDFForm): void {
  try {
    form.removeField(form.getButton("d20warning"))
  } catch {
    // Field not present in this template version; nothing to do
  }
}

export async function generateCharacterPdf(character: ComputedCharacter): Promise<Uint8Array> {
  const templatePath = TEMPLATE_PATHS[character.ruleset]
  const templateFile = Bun.file(templatePath)
  if (!(await templateFile.exists())) {
    throw new Error(
      `MPMB template not found at ${templatePath}. ` +
        "Download from https://www.flapkan.com/download/#charactersheets and place at that path."
    )
  }

  const templateBytes = await templateFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()

  logger.info("pdf: loaded template", {
    ruleset: character.ruleset,
    fieldCount: form.getFields().length,
    characterId: character.id,
  })

  fillCharacterFields(form, character)
  removeD20Warning(form)

  // Keep only page 1 (front of main sheet). Remove from the end backwards so
  // indices stay valid. We use removePage rather than copyPages because copyPages
  // doesn't bring the document-level AcroForm definition with it — the new doc
  // would have orphan widget annotations referencing nonexistent fields.
  for (let i = pdfDoc.getPageCount() - 1; i >= 1; i--) {
    pdfDoc.removePage(i)
  }

  // We deliberately do NOT call form.flatten() — MPMB's template contains rich
  // text fields and buttons with missing appearance streams that crash pdf-lib's
  // flattener. Leaving the form intact still renders the filled values
  // correctly in all major PDF viewers (Chrome, Firefox, Preview, Evince).
  //
  // updateFieldAppearances: false skips pdf-lib's auto-regeneration of every
  // field's visual stream on save. Without it, MPMB's rich text fields trip
  // RichTextFieldReadError, and regenerating 3600 fields takes seconds.
  return pdfDoc.save({ updateFieldAppearances: false })
}
