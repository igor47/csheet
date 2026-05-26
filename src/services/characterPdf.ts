import { config } from "@src/config"
import { Abilities, type AbilityType, Skills, type SkillType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { PDFBool, PDFDocument, type PDFForm, PDFName } from "pdf-lib"

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

// MPMB encodes skills with 3-4 letter prefixes that gate three fields each:
// {prefix} (modifier text), {prefix} Prof (proficient checkbox), {prefix} Exp
// (expertise checkbox). E.g. "Acr", "Acr Prof", "Acr Exp" for Acrobatics.
const SKILL_TO_MPMB: Record<SkillType, string> = {
  acrobatics: "Acr",
  "animal handling": "Ani",
  arcana: "Arc",
  athletics: "Ath",
  deception: "Dec",
  history: "His",
  insight: "Ins",
  intimidation: "Inti",
  investigation: "Inv",
  medicine: "Med",
  nature: "Nat",
  perception: "Perc",
  performance: "Perf",
  persuasion: "Pers",
  religion: "Rel",
  "sleight of hand": "Sle",
  stealth: "Ste",
  survival: "Sur",
}

// Big ability-modifier boxes (Str Mod, Dex Mod, …) render the raw value, so
// we prefix "+" for non-negative numbers ourselves.
const fmt = (n: number): string => (n >= 0 ? `+${n}` : `${n}`)

// MPMB's smaller signed-bonus fields (save mods, skill mods, proficiency
// bonus, initiative, etc.) have a "+" pre-rendered in the sheet's layout.
// Passing "+2" here yields "++2"; pass "2" (or "-1") and the layout fills in
// the sign on its own.
const unsignedFmt = (n: number): string => String(n)

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

// Group character hit dice by die size, returning per-die {total, available}.
// Used to fill MPMB's HD1/HD2/HD3 rows — one row per distinct hit die size.
function groupHitDice(character: ComputedCharacter): Array<{
  die: number
  total: number
  used: number
}> {
  const totalCounts = new Map<number, number>()
  for (const d of character.hitDice) totalCounts.set(d, (totalCounts.get(d) ?? 0) + 1)
  const availCounts = new Map<number, number>()
  for (const d of character.availableHitDice) availCounts.set(d, (availCounts.get(d) ?? 0) + 1)

  return Array.from(totalCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([die, total]) => ({
      die,
      total,
      used: total - (availCounts.get(die) ?? 0),
    }))
}

function fillCharacterFields(
  form: PDFForm,
  character: ComputedCharacter,
  playerName?: string
): void {
  // Identity
  setText(form, "PC Name", character.name)
  if (playerName) setText(form, "Player Name", playerName)
  setText(form, "Class and Levels", classString(character))
  setText(form, "Character Level", String(totalLevel(character)))
  if (character.background) setDropdown(form, "Background", character.background)
  const speciesText = character.lineage
    ? `${character.species} (${character.lineage})`
    : character.species
  setDropdown(form, "Race", speciesText)
  if (character.alignment) setDropdown(form, "Alignment", character.alignment)

  // Abilities + saving throws. The big ability-mod box uses fmt() (raw value
  // with sign). ST Mod is a small field with a pre-rendered "+" in the layout.
  for (const ability of Abilities) {
    const prefix = ABILITY_TO_MPMB[ability]
    const score = character.abilityScores[ability]
    setText(form, prefix, String(score.score))
    setText(form, `${prefix} Mod`, fmt(score.modifier))
    setText(form, `${prefix} ST Mod`, unsignedFmt(score.savingThrow))
    if (score.proficient) checkBox(form, `${prefix} ST Prof`)
  }

  // Skills — modifier, plus proficient/expert flags. Expertise implies prof.
  for (const skill of Skills) {
    const prefix = SKILL_TO_MPMB[skill]
    const skillScore = character.skills[skill]
    setText(form, prefix, unsignedFmt(skillScore.modifier))
    if (skillScore.proficiency === "proficient" || skillScore.proficiency === "expert") {
      checkBox(form, `${prefix} Prof`)
    }
    if (skillScore.proficiency === "expert") {
      checkBox(form, `${prefix} Exp`)
    }
  }

  // Combat block — all of these have "+" pre-rendered, so use unsigned.
  setText(form, "AC", String(character.armorClass))
  setText(form, "Initiative bonus", unsignedFmt(character.initiative))
  setText(form, "Speed", String(character.speed))
  setText(form, "HP Max", String(character.maxHitPoints))
  setText(form, "HP Current", String(character.currentHP))
  setText(form, "Proficiency Bonus", unsignedFmt(character.proficiencyBonus))
  setText(form, "Passive Perception", String(character.passivePerception))

  // Hit dice — MPMB has 3 rows (HD1/HD2/HD3) for multi-class characters
  const hd = groupHitDice(character)
  for (let i = 0; i < Math.min(hd.length, 3); i++) {
    const row = hd[i]
    if (!row) continue
    const idx = i + 1
    setText(form, `HD${idx} Die`, `d${row.die}`)
    setText(form, `HD${idx} Level`, String(row.total))
    if (row.used > 0) setText(form, `HD${idx} Used`, String(row.used))
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

export interface CampaignPdfEntry {
  character: ComputedCharacter
  playerName?: string
}

// Build a single-page PDFDocument for one character. Returns the doc rather
// than saved bytes so it can be either serialized (generateCharacterPdf) or
// concatenated with others (generateCampaignPdf).
async function buildCharacterPdfDoc(
  character: ComputedCharacter,
  playerName?: string
): Promise<PDFDocument> {
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

  fillCharacterFields(form, character, playerName)
  removeD20Warning(form)

  // Tell PDF viewers and print engines to regenerate appearance streams from
  // /V on the fly. Without this flag, in-browser viewers (Chrome, Firefox)
  // auto-render values fine on screen, but their print pipelines fall back to
  // the stored /AP — which is stale because we save with
  // updateFieldAppearances: false. The result is that banner/identity/dropdown
  // fields come up blank in print. Setting NeedAppearances forces regeneration
  // by the renderer, which handles MPMB's rich text fields without crashing.
  const acroForm = form.acroForm.dict
  acroForm.set(PDFName.of("NeedAppearances"), PDFBool.True)

  // Keep only page 1 (front of main sheet). Remove from the end backwards so
  // indices stay valid. We use removePage rather than copyPages because copyPages
  // doesn't bring the document-level AcroForm definition with it — the new doc
  // would have orphan widget annotations referencing nonexistent fields.
  for (let i = pdfDoc.getPageCount() - 1; i >= 1; i--) {
    pdfDoc.removePage(i)
  }

  return pdfDoc
}

// We deliberately do NOT call form.flatten() — MPMB's template contains rich
// text fields and buttons with missing appearance streams that crash pdf-lib's
// flattener. Leaving the form intact still renders the filled values correctly
// in all major PDF viewers (Chrome, Firefox, Preview, Evince).
//
// updateFieldAppearances: false skips pdf-lib's auto-regeneration of every
// field's visual stream on save. Without it, MPMB's rich text fields trip
// RichTextFieldReadError, and regenerating 3600 fields takes seconds.
const SAVE_OPTIONS = { updateFieldAppearances: false } as const

export async function generateCharacterPdf(
  character: ComputedCharacter,
  playerName?: string
): Promise<Uint8Array> {
  const pdfDoc = await buildCharacterPdfDoc(character, playerName)
  return pdfDoc.save(SAVE_OPTIONS)
}

// Concatenate per-character single-page PDFs into one party-wide document.
// Pages are copied in the order characters are supplied.
export async function generateCampaignPdf(entries: CampaignPdfEntry[]): Promise<Uint8Array> {
  if (entries.length === 0) {
    throw new Error("Cannot generate campaign PDF with zero characters")
  }

  const combined = await PDFDocument.create()
  for (const entry of entries) {
    const charDoc = await buildCharacterPdfDoc(entry.character, entry.playerName)
    const [page] = await combined.copyPages(charDoc, [0])
    combined.addPage(page)
  }

  return combined.save(SAVE_OPTIONS)
}
