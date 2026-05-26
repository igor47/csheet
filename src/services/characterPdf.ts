import { config } from "@src/config"
import { Abilities, type AbilityType, Skills, type SkillType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { spells as allSpells, type Spell } from "@src/lib/dnd/spells"
import { logger } from "@src/lib/logger"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { SpellInfoForClass } from "@src/services/computeSpells"
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

// MPMB's main sheet has 16 "Limited Feature" rows (Name / Max / Recovery / Used),
// intended for tracking class features with limited uses (Bardic Inspiration,
// Channel Divinity, etc.). They're also a natural fit for spell slot tracking,
// since MPMB's actual spell-slot checkbox grid is on the dedicated spell sheet
// PDFs — not on the main sheet.
//
// Only the first 8 rows are visually on page 1; rows 9-16 live on a later page
// of the main sheet PDF (we currently emit only page 1).
const LIMITED_FEATURE_ROWS = 8

// Count occurrences of each value in an array.
function countBy(values: number[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return counts
}

// Group character hit dice by die size, returning per-die {total, available}.
// Used to fill MPMB's HD1/HD2/HD3 rows — one row per distinct hit die size.
function groupHitDice(character: ComputedCharacter): Array<{
  die: number
  total: number
  used: number
}> {
  const totalCounts = countBy(character.hitDice)
  const availCounts = countBy(character.availableHitDice)

  return Array.from(totalCounts.entries())
    .sort(([a], [b]) => a - b)
    .map(([die, total]) => ({
      die,
      total,
      used: total - (availCounts.get(die) ?? 0),
    }))
}

interface LimitedFeatureRow {
  name: string
  max: number
  recovery: string // "Short Rest" | "Long Rest" | "Dawn" | etc. — MPMB dropdown options
  used: number
}

function fillLimitedFeatures(form: PDFForm, rows: LimitedFeatureRow[]): void {
  for (let i = 0; i < Math.min(rows.length, LIMITED_FEATURE_ROWS); i++) {
    const row = rows[i]
    if (!row) continue
    const num = i + 1
    setText(form, `Limited Feature ${num}`, row.name)
    setText(form, `Limited Feature Max Usages ${num}`, String(row.max))
    setDropdown(form, `Limited Feature Recovery ${num}`, row.recovery)
    if (row.used > 0) setText(form, `Limited Feature Used ${num}`, String(row.used))
  }
}

function fillSpellcasterFields(form: PDFForm, character: ComputedCharacter): void {
  // Per-class spellcasting stats (MPMB page 1 supports up to 2 classes).
  for (let i = 0; i < Math.min(character.spells.length, 2); i++) {
    const info = character.spells[i]
    if (!info) continue
    const num = i + 1
    setText(form, `Spell save DC ${num}`, String(info.spellSaveDC))
    setDropdown(form, `Spell DC ${num} Mod`, titleCase(info.ability))
  }
}

// Build Limited Feature rows for spell slots — one per spell level the
// character has slots for. Pact magic (warlock) gets its own row since it
// recovers on short rest rather than long rest.
function spellSlotLimitedFeatures(character: ComputedCharacter): LimitedFeatureRow[] {
  const rows: LimitedFeatureRow[] = []

  const totalSlots = countBy(character.spellSlots)
  const availSlots = countBy(character.availableSpellSlots)
  for (let level = 1; level <= 9; level++) {
    const total = totalSlots.get(level) ?? 0
    if (total === 0) continue
    rows.push({
      name: `Spell Slots Lv ${level}`,
      max: total,
      recovery: "Long Rest",
      used: total - (availSlots.get(level) ?? 0),
    })
  }

  if (character.pactMagicSlots && character.pactMagicSlots.length > 0) {
    const pactByLevel = countBy(character.pactMagicSlots)
    for (const [level, total] of pactByLevel) {
      // ComputedCharacter doesn't track pact-slot usage separately yet;
      // emit total max and assume unused.
      rows.push({
        name: `Pact Slots Lv ${level}`,
        max: total,
        recovery: "Short Rest",
        used: 0,
      })
    }
  }

  return rows
}

// Resolve cantrip damage dice at the character's current level. Cantrips scale
// at thresholds (1/5/11/17 typically); pick the highest threshold ≤ level.
function cantripDiceAtLevel(spell: Spell, charLevel: number): number[] {
  const baseDice = spell.damage?.[0]?.dice
  if (!baseDice) return []
  if (spell.damageScaling?.mode !== "characterLevel") return baseDice

  const sortedDescending = Object.keys(spell.damageScaling.progression)
    .map(Number)
    .sort((a, b) => b - a)
  for (const threshold of sortedDescending) {
    if (threshold <= charLevel) {
      return spell.damageScaling.progression[threshold] ?? baseDice
    }
  }
  return baseDice
}

function formatDamageDice(dice: number[]): string {
  if (dice.length === 0) return ""
  const die = dice[0]
  if (die === undefined) return ""
  return `${dice.length}d${die}`
}

function formatRange(range: Spell["range"]): string {
  if (range.type === "distance") return `${range.feet} ft.`
  if (range.type === "self") return "Self"
  if (range.type === "touch") return "Touch"
  return ""
}

interface AttackEntry {
  name: string
  modAbility: string // MPMB attack-mod dropdown abbrev: Str/Dex/Con/Int/Wis/Cha
  range: string
  toHit: number
  damageDice: string
  damageType: string
  description: string
}

function attackCantripsFor(character: ComputedCharacter): AttackEntry[] {
  const charLevel = totalLevel(character)
  const entries: AttackEntry[] = []

  for (const spellInfo of character.spells as SpellInfoForClass[]) {
    for (const cantrip of spellInfo.cantripSlots) {
      if (!cantrip.spell_id) continue
      const spell = allSpells.find((s) => s.id === cantrip.spell_id)
      if (!spell) continue
      if (spell.resolution.kind !== "attack") continue

      const damage = spell.damage?.[0]
      entries.push({
        name: spell.name,
        modAbility: ABILITY_TO_MPMB[spellInfo.ability],
        range: formatRange(spell.range),
        toHit: spellInfo.spellAttackBonus,
        damageDice: formatDamageDice(cantripDiceAtLevel(spell, charLevel)),
        damageType: damage ? titleCase(damage.type) : "",
        description: spell.briefDescription,
      })
    }
  }

  return entries
}

function fillAttackCantrips(form: PDFForm, character: ComputedCharacter): void {
  const cantrips = attackCantripsFor(character)
  // MPMB page 1 has 5 attack rows. Cantrips go after weapons (we don't fill
  // weapons yet, so they start at row 1).
  //
  // The visible "Attack Name" widget is the Weapon Selection dropdown, not the
  // Weapon text field (they're stacked at the same coordinates). The dropdown
  // has 93 predefined weapon/cantrip options; setDropdown adds the name as a
  // new option if it isn't already present.
  for (let i = 0; i < Math.min(cantrips.length, 5); i++) {
    const c = cantrips[i]
    if (!c) continue
    const num = i + 1
    setDropdown(form, `Attack.${num}.Weapon Selection`, c.name)
    setDropdown(form, `Attack.${num}.Mod`, c.modAbility)
    if (c.range) setText(form, `Attack.${num}.Range`, c.range)
    setText(form, `Attack.${num}.To Hit`, unsignedFmt(c.toHit))
    if (c.damageDice) setText(form, `Attack.${num}.Damage`, c.damageDice)
    if (c.damageType) setDropdown(form, `Attack.${num}.Damage Type`, c.damageType)
    setText(form, `Attack.${num}.Description`, c.description)
  }
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

  // Spellcasting stats + slot tracking (only if character has any spellcasting)
  if (character.spells.length > 0) {
    fillSpellcasterFields(form, character)
    fillLimitedFeatures(form, spellSlotLimitedFeatures(character))
    fillAttackCantrips(form, character)
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
