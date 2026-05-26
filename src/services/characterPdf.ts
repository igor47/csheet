import { Abilities, type AbilityType, Skills, type SkillType } from "@src/lib/dnd"
import { spells as allSpells } from "@src/lib/dnd/spells"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib"

// Letter portrait at 72 dpi
const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 24
const INNER_W = PAGE_W - MARGIN * 2

const INK = rgb(0.08, 0.08, 0.08)
const MUTED = rgb(0.42, 0.42, 0.42)
const STROKE = rgb(0.18, 0.18, 0.18)
const TAB_FILL = rgb(0.96, 0.96, 0.96)
const WHITE = rgb(1, 1, 1)

const LINE_W = 0.9
const THIN_W = 0.5

interface Fonts {
  regular: PDFFont
  bold: PDFFont
}

interface Cursor {
  page: PDFPage
  y: number
}

const fmtMod = (n: number): string => (n >= 0 ? `+${n}` : `${n}`)

const titleCase = (s: string): string => s.replace(/\b\w/g, (c) => c.toUpperCase())

const ab3 = (a: AbilityType): string => a.slice(0, 3).toUpperCase()

const lookupSpellName = (id: string): string => allSpells.find((s) => s.id === id)?.name ?? id

// ─── Primitives ────────────────────────────────────────────────────────────

function drawText(
  page: PDFPage,
  s: string,
  x: number,
  y: number,
  opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}
): void {
  page.drawText(s, {
    x,
    y,
    size: opts.size ?? 9,
    font: opts.font,
    color: opts.color ?? INK,
  })
}

function drawTextCenter(
  page: PDFPage,
  s: string,
  cx: number,
  y: number,
  font: PDFFont,
  size: number,
  color = INK
): void {
  const w = font.widthOfTextAtSize(s, size)
  page.drawText(s, { x: cx - w / 2, y, size, font, color })
}

function drawTextRight(
  page: PDFPage,
  s: string,
  rightX: number,
  y: number,
  font: PDFFont,
  size: number,
  color = INK
): void {
  const w = font.widthOfTextAtSize(s, size)
  page.drawText(s, { x: rightX - w, y, size, font, color })
}

function drawLine(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: { thickness?: number; color?: ReturnType<typeof rgb> } = {}
): void {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: opts.thickness ?? LINE_W,
    color: opts.color ?? STROKE,
  })
}

function drawRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: ReturnType<typeof rgb>; stroke?: ReturnType<typeof rgb>; thickness?: number } = {}
): void {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: opts.fill,
    borderColor: opts.stroke ?? STROKE,
    borderWidth: opts.thickness ?? LINE_W,
  })
}

// Filled disc (used for "save proficiency on" indicator).
function drawDisc(page: PDFPage, cx: number, cy: number, r: number, fill = INK): void {
  page.drawCircle({ x: cx, y: cy, size: r, color: fill, borderWidth: 0 })
}

// Hollow circle outline (used for "save proficiency off", and spell-slot bubbles).
function drawCircleOutline(
  page: PDFPage,
  cx: number,
  cy: number,
  r: number,
  thickness = THIN_W
): void {
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: STROKE, borderWidth: thickness })
}

// Wrap a string into lines that fit within maxW at the given size.
function wrapLines(font: PDFFont, size: number, s: string, maxW: number): string[] {
  const words = (s ?? "").replace(/\s+/g, " ").trim().split(" ")
  if (words.length === 1 && words[0] === "") return []
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(candidate, size) <= maxW) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    if (font.widthOfTextAtSize(w, size) > maxW) {
      let chunk = ""
      for (const ch of w) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxW) {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      line = chunk
    } else {
      line = w
    }
  }
  if (line) lines.push(line)
  return lines
}

// Crop a string with an ellipsis so it fits within maxW.
function ellipsize(font: PDFFont, size: number, s: string, maxW: number): string {
  if (font.widthOfTextAtSize(s, size) <= maxW) return s
  let lo = 0
  let hi = s.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (font.widthOfTextAtSize(`${s.slice(0, mid)}…`, size) <= maxW) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }
  return `${s.slice(0, lo)}…`
}

// ─── Section box with notched top tab ─────────────────────────────────────
// Draws a box from (x, y) (bottom-left) to (x+w, y+h) with a small label tab
// protruding upward from the top edge. Label rendered centered in the tab.
const TAB_H = 13
const TAB_PAD_X = 12

function drawTabbedBox(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fonts: Fonts
): void {
  const labelText = label.toUpperCase()
  const labelW = fonts.bold.widthOfTextAtSize(labelText, 7.5)
  const capW = Math.min(labelW + TAB_PAD_X, w - 8)
  const capX = x + (w - capW) / 2
  const boxTop = y + h

  // Box outline (skip the top-center segment under the tab)
  drawLine(page, x, y, x + w, y) // bottom
  drawLine(page, x, y, x, boxTop) // left
  drawLine(page, x + w, y, x + w, boxTop) // right
  drawLine(page, x, boxTop, capX, boxTop) // top-left segment
  drawLine(page, capX + capW, boxTop, x + w, boxTop) // top-right segment

  // Tab — filled rectangle on top so the label sits on a light background
  drawRect(page, capX, boxTop, capW, TAB_H, { fill: TAB_FILL })

  // Label
  drawTextCenter(page, labelText, x + w / 2, boxTop + 4, fonts.bold, 7.5)
}

// Simpler full-rect with title centered in a tiny header strip on top.
// Used for the top-strip stat tiles (LEVEL / AC / HIT POINTS / HIT DICE).
function drawHeaderBox(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  fonts: Fonts
): void {
  drawRect(page, x, y, w, h)
  const labelH = 11
  drawRect(page, x, y + h - labelH, w, labelH, { fill: TAB_FILL })
  drawLine(page, x, y + h - labelH, x + w, y + h - labelH)
  drawTextCenter(page, label.toUpperCase(), x + w / 2, y + h - labelH + 3, fonts.bold, 6.5)
}

// Labeled write-in line: underline + small caps label above the line.
// Used inside the identity block (CHARACTER NAME, BACKGROUND, etc).
function drawLabeledLine(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  fonts: Fonts,
  opts: { valueSize?: number; valueFont?: PDFFont } = {}
): void {
  drawText(page, label.toUpperCase(), x, y + 11, { size: 6.5, font: fonts.bold, color: MUTED })
  const valueSize = opts.valueSize ?? 11
  const valueFont = opts.valueFont ?? fonts.regular
  drawText(page, ellipsize(valueFont, valueSize, value || "", w - 2), x + 2, y - 1, {
    size: valueSize,
    font: valueFont,
  })
  drawLine(page, x, y - 3, x + w, y - 3, { thickness: THIN_W })
}

// ─── Top strip: identity + Level/AC/HP/HitDice tiles ──────────────────────

// A small bordered cell with a label cap on top and a centered value below.
// Used for the 2x2 secondary-stats grid (Init / Speed / Pass / Prof) and
// for AC / HP / HD tiles.
function drawStatCell(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  fonts: Fonts,
  opts: { valueSize?: number } = {}
): void {
  drawHeaderBox(page, x, y, w, h, label, fonts)
  drawTextCenter(page, value, x + w / 2, y + (h - 11) / 2 - 3, fonts.bold, opts.valueSize ?? 15)
}

function drawTopStrip(
  page: PDFPage,
  char: ComputedCharacter,
  playerName: string | undefined,
  fonts: Fonts
): number {
  const stripH = 104
  const stripBottom = PAGE_H - MARGIN - stripH

  const gap = 4

  // Widths (left → right): identity / stats-grid / AC / HP / HD
  const hdTileW = 50
  const hpTileW = 92
  const acTileW = 50
  const statsGridW = 110
  const idW = INNER_W - hdTileW - hpTileW - acTileW - statsGridW - gap * 4

  const idX = MARGIN
  const idY = stripBottom

  // ── Identity block ─────────────────────────────────────────────────────
  drawRect(page, idX, idY, idW, stripH)
  const innerPad = 9
  const innerW = idW - innerPad * 2

  // CHARACTER NAME (full width)
  drawLabeledLine(
    page,
    "Character Name",
    char.name,
    idX + innerPad,
    idY + stripH - 28,
    innerW,
    fonts,
    { valueSize: 16, valueFont: fonts.bold }
  )

  // Three paired rows below the name: BG/Class, Species/Subclass, Align/Size + Player
  const colW = (innerW - 10) / 2
  const colLeftX = idX + innerPad
  const colRightX = colLeftX + colW + 10

  const classLine = char.classes.map((c) => `${titleCase(c.class)} ${c.level}`).join(" / ")
  const subclassLine =
    char.classes
      .map((c) => (c.subclass ? titleCase(c.subclass) : null))
      .filter(Boolean)
      .join(" / ") || ""
  const speciesText = char.lineage
    ? `${titleCase(char.species)} (${titleCase(char.lineage)})`
    : titleCase(char.species ?? "")

  const rowYBg = idY + stripH - 50
  const rowYSp = idY + stripH - 71
  const rowYAlign = idY + 9

  drawLabeledLine(
    page,
    "Background",
    titleCase(char.background ?? ""),
    colLeftX,
    rowYBg,
    colW,
    fonts,
    { valueSize: 10 }
  )
  drawLabeledLine(page, "Class", classLine, colRightX, rowYBg, colW, fonts, { valueSize: 10 })

  drawLabeledLine(page, "Species", speciesText, colLeftX, rowYSp, colW, fonts, { valueSize: 10 })
  drawLabeledLine(page, "Subclass", subclassLine, colRightX, rowYSp, colW, fonts, { valueSize: 10 })

  // Bottom row: Alignment | Size | Player (three cells in the right slot)
  const sizeW = 48
  const alignW = colW
  const playerW = colW - sizeW - 6
  drawLabeledLine(
    page,
    "Alignment",
    titleCase(char.alignment ?? ""),
    colLeftX,
    rowYAlign,
    alignW,
    fonts,
    { valueSize: 9 }
  )
  drawLabeledLine(page, "Size", titleCase(char.size), colRightX, rowYAlign, sizeW, fonts, {
    valueSize: 9,
  })
  if (playerName) {
    drawLabeledLine(page, "Player", playerName, colRightX + sizeW + 6, rowYAlign, playerW, fonts, {
      valueSize: 9,
    })
  }

  // ── Stats grid 2x2 ─────────────────────────────────────────────────────
  let tileX = idX + idW + gap
  const sgX = tileX
  const sgCellGap = 3
  const sgCellW = (statsGridW - sgCellGap) / 2
  const sgCellH = (stripH - sgCellGap) / 2

  drawStatCell(
    page,
    sgX,
    idY + sgCellH + sgCellGap,
    sgCellW,
    sgCellH,
    "Initiative",
    fmtMod(char.initiative),
    fonts
  )
  drawStatCell(
    page,
    sgX + sgCellW + sgCellGap,
    idY + sgCellH + sgCellGap,
    sgCellW,
    sgCellH,
    "Speed",
    `${char.speed} ft`,
    fonts
  )
  drawStatCell(
    page,
    sgX,
    idY,
    sgCellW,
    sgCellH,
    "Passive Perception",
    String(char.passivePerception),
    fonts
  )
  drawStatCell(
    page,
    sgX + sgCellW + sgCellGap,
    idY,
    sgCellW,
    sgCellH,
    "Prof. Bonus",
    `+${char.proficiencyBonus}`,
    fonts
  )
  tileX += statsGridW + gap

  // ── ARMOR CLASS ────────────────────────────────────────────────────────
  drawHeaderBox(page, tileX, idY, acTileW, stripH, "Armor Class", fonts)
  drawTextCenter(
    page,
    String(char.armorClass),
    tileX + acTileW / 2,
    idY + stripH / 2 - 14,
    fonts.bold,
    28
  )
  tileX += acTileW + gap

  // ── HIT POINTS ─────────────────────────────────────────────────────────
  drawHeaderBox(page, tileX, idY, hpTileW, stripH, "Hit Points", fonts)
  const hpTop = idY + stripH - 11
  const hpSubH = (stripH - 11) / 2
  drawLine(page, tileX, hpTop - hpSubH, tileX + hpTileW, hpTop - hpSubH, { thickness: THIN_W })
  drawTextCenter(page, "CURRENT / MAX", tileX + hpTileW / 2, hpTop - 8, fonts.bold, 6, MUTED)
  drawTextCenter(
    page,
    `${char.currentHP} / ${char.maxHitPoints}`,
    tileX + hpTileW / 2,
    hpTop - hpSubH + 10,
    fonts.bold,
    17
  )
  drawTextCenter(page, "TEMP", tileX + hpTileW / 2, hpTop - hpSubH - 8, fonts.bold, 6, MUTED)
  drawLine(page, tileX + 10, hpTop - hpSubH - 24, tileX + hpTileW - 10, hpTop - hpSubH - 24, {
    thickness: THIN_W,
  })
  tileX += hpTileW + gap

  // ── HIT DICE — list each die as a small tile; cross out used ones ──────
  drawHeaderBox(page, tileX, idY, hdTileW, stripH, "Hit Dice", fonts)
  const usedDice: number[] = []
  const availDice: number[] = []
  const remainingHd = char.availableHitDice.slice()
  for (const d of char.hitDice) {
    const idxR = remainingHd.indexOf(d)
    if (idxR >= 0) {
      remainingHd.splice(idxR, 1)
      availDice.push(d)
    } else {
      usedDice.push(d)
    }
  }
  const allDice = [...availDice, ...usedDice]
  const usedSet = new Set<number>()
  for (let i = availDice.length; i < allDice.length; i++) usedSet.add(i)
  const dieTileW = 16
  const dieTileH = 11
  const perRow = Math.max(1, Math.floor((hdTileW - 6) / (dieTileW + 2)))
  let dieRow = 0
  let dieCol = 0
  for (let i = 0; i < allDice.length; i++) {
    const dx = tileX + 4 + dieCol * (dieTileW + 2)
    const dy = idY + stripH - 11 - 6 - (dieRow + 1) * (dieTileH + 2)
    drawRect(page, dx, dy, dieTileW, dieTileH, { thickness: THIN_W })
    drawTextCenter(page, `d${allDice[i]}`, dx + dieTileW / 2, dy + 2, fonts.regular, 7)
    if (usedSet.has(i)) {
      drawLine(page, dx + 1, dy + 1, dx + dieTileW - 1, dy + dieTileH - 1, { thickness: THIN_W })
      drawLine(page, dx + 1, dy + dieTileH - 1, dx + dieTileW - 1, dy + 1, { thickness: THIN_W })
    }
    dieCol++
    if (dieCol >= perRow) {
      dieCol = 0
      dieRow++
    }
  }

  return stripBottom
}

// ─── Left column: vertical ability cards ──────────────────────────────────

function drawAbilityCard(
  page: PDFPage,
  char: ComputedCharacter,
  ab: AbilityType,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: Fonts
): void {
  drawTabbedBox(page, x, y, w, h, ab, fonts)
  const score = char.abilityScores[ab]

  // Card is divided into two zones by a horizontal rule:
  //   top zone (≈70%): modifier + score
  //   bottom zone (≈30%): saving throw
  const saveZoneH = 18
  const ruleY = y + saveZoneH
  drawLine(page, x + 4, ruleY, x + w - 4, ruleY, { thickness: THIN_W })

  // ── Top zone: modifier (big) over score chip ────────────────────────
  const cx = x + w / 2
  const topZoneTop = y + h
  const topZoneH = topZoneTop - ruleY
  // modifier
  drawTextCenter(page, fmtMod(score.modifier), cx, ruleY + topZoneH - 24, fonts.bold, 22)
  // score chip
  const chipW = 26
  const chipH = 11
  const chipY = ruleY + 4
  drawRect(page, cx - chipW / 2, chipY, chipW, chipH, { fill: TAB_FILL, thickness: THIN_W })
  drawTextCenter(page, String(score.score), cx, chipY + 3, fonts.bold, 9)

  // ── Bottom zone: saving throw row ───────────────────────────────────
  // Centered: [○|●] +N  Save
  const savePieceLabel = "SAVE"
  const saveValue = fmtMod(score.savingThrow)
  const labelW = fonts.bold.widthOfTextAtSize(savePieceLabel, 7)
  const valueW = fonts.bold.widthOfTextAtSize(saveValue, 10)
  const discR = 2.8
  const piecesW = discR * 2 + 4 + valueW + 5 + labelW
  const startX = x + (w - piecesW) / 2
  const saveCy = y + saveZoneH / 2 - 2
  if (score.proficient) {
    drawDisc(page, startX + discR, saveCy + 3, discR)
  } else {
    drawCircleOutline(page, startX + discR, saveCy + 3, discR)
  }
  drawText(page, saveValue, startX + discR * 2 + 4, saveCy, { size: 10, font: fonts.bold })
  drawText(page, savePieceLabel, startX + discR * 2 + 4 + valueW + 5, saveCy + 1, {
    size: 7,
    font: fonts.bold,
    color: MUTED,
  })
}

function drawAbilityColumn(
  page: PDFPage,
  char: ComputedCharacter,
  x: number,
  topY: number,
  w: number,
  bottomY: number,
  fonts: Fonts
): void {
  const gap = 5
  const totalGap = gap * (Abilities.length - 1)
  const totalTabs = TAB_H * Abilities.length
  const each = (topY - bottomY - totalGap - totalTabs) / Abilities.length
  let y = topY - TAB_H - each
  for (const ab of Abilities) {
    drawAbilityCard(page, char, ab, x, y, w, each, fonts)
    y -= each + gap + TAB_H
  }
}

// ─── Right column sections ────────────────────────────────────────────────

interface RightSection {
  key: string
  label: string
  preferredH: number
  draw: (x: number, y: number, w: number, h: number) => void
}

function drawWeaponsTable(
  page: PDFPage,
  char: ComputedCharacter,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: Fonts
): void {
  drawTabbedBox(page, x, y, w, h, "Weapons", fonts)
  const innerX = x + 8
  const innerW = w - 16
  // Column widths — Atk is left as a write-in line (we don't precompute it).
  const nameW = innerW * 0.34
  const atkW = innerW * 0.16
  const dmgW = innerW * 0.3
  const noteW = innerW - nameW - atkW - dmgW

  let yy = y + h - 14
  drawText(page, "Name", innerX, yy, { size: 7, font: fonts.bold, color: MUTED })
  drawText(page, "Atk", innerX + nameW, yy, { size: 7, font: fonts.bold, color: MUTED })
  drawText(page, "Damage & Type", innerX + nameW + atkW, yy, {
    size: 7,
    font: fonts.bold,
    color: MUTED,
  })
  drawText(page, "Notes", innerX + nameW + atkW + dmgW, yy, {
    size: 7,
    font: fonts.bold,
    color: MUTED,
  })
  drawLine(page, innerX, yy - 3, innerX + innerW, yy - 3, { thickness: THIN_W })
  yy -= 12

  const rows: Array<{ name: string; dmg: string; notes: string }> = []
  for (const it of char.equippedItems.filter((it) => it.wielded)) {
    rows.push({
      name: it.name,
      dmg: it.humanReadableDamage.join(", ") || "—",
      notes: it.mastery ? titleCase(it.mastery) : "",
    })
  }

  const maxRows = Math.floor((yy - (y + 6)) / 12)
  const visibleRows = rows.slice(0, maxRows)
  for (const row of visibleRows) {
    drawText(page, ellipsize(fonts.regular, 9, row.name, nameW - 4), innerX, yy, { size: 9 })
    // Atk: write-in underline rather than a value
    drawLine(page, innerX + nameW, yy - 3, innerX + nameW + atkW - 6, yy - 3, { thickness: THIN_W })
    drawText(page, ellipsize(fonts.regular, 9, row.dmg, dmgW - 4), innerX + nameW + atkW, yy, {
      size: 9,
    })
    drawText(
      page,
      ellipsize(fonts.regular, 8, row.notes, noteW - 4),
      innerX + nameW + atkW + dmgW,
      yy,
      { size: 8, color: MUTED }
    )
    drawLine(page, innerX, yy - 3, innerX + innerW, yy - 3, { thickness: THIN_W })
    yy -= 12
  }
  // Blank write-in rows fill the remainder
  while (yy >= y + 6) {
    drawLine(page, innerX, yy - 3, innerX + innerW, yy - 3, { thickness: THIN_W })
    yy -= 12
  }
}

function drawSkillsBox(
  page: PDFPage,
  char: ComputedCharacter,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: Fonts
): void {
  drawTabbedBox(page, x, y, w, h, "Skills", fonts)
  const innerX = x + 6
  const innerY = y + 6
  const innerW = w - 12
  const innerH = h - 12

  // Two columns of 9 skills each
  const colW = innerW / 2
  const rowH = innerH / 9
  for (let i = 0; i < Skills.length; i++) {
    const sk = Skills[i] as SkillType
    const colIdx = Math.floor(i / 9)
    const rowIdx = i % 9
    const sx = innerX + colIdx * colW
    const sy = innerY + innerH - (rowIdx + 1) * rowH + 2
    const s = char.skills[sk]

    // proficiency indicator: hollow circle, filled disc if proficient, doubled disc if expert
    const cx = sx + 5
    const cy = sy + 4
    if (s.proficiency === "expert") {
      drawDisc(page, cx, cy, 3)
      drawDisc(page, cx, cy, 1.5, WHITE)
    } else if (s.proficiency === "proficient" || s.proficiency === "half") {
      drawDisc(page, cx, cy, 3)
    } else {
      drawCircleOutline(page, cx, cy, 3)
    }

    drawText(page, fmtMod(s.modifier), sx + 13, sy, { size: 9, font: fonts.bold })
    const nameAndAbil = `${titleCase(sk)} (${ab3(s.ability)})`
    drawText(page, ellipsize(fonts.regular, 8.5, nameAndAbil, colW - 36), sx + 33, sy + 1, {
      size: 8.5,
    })
  }
}

// Spellcasting box: per-class spellcasting stats (DC / Atk / Ability) followed
// by slot tiles. Each slot is a small bordered tile with "L1" / "L2" / ...
// inside; used slots get a diagonal X (same visual pattern as Hit Dice).
function drawSpellcastingBox(
  page: PDFPage,
  char: ComputedCharacter,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: Fonts
): void {
  drawTabbedBox(page, x, y, w, h, "Spellcasting", fonts)
  const innerX = x + 8
  const innerW = w - 16

  if (char.spells.length === 0) {
    drawTextCenter(page, "no spellcasting", x + w / 2, y + h / 2 - 4, fonts.regular, 9, MUTED)
    return
  }

  // Per-class stat lines at the top
  let yy = y + h - 14
  for (const sp of char.spells) {
    const className = `${titleCase(sp.class)}${char.spells.length > 1 ? "" : ""}`
    drawText(page, className, innerX, yy, { size: 9, font: fonts.bold })
    const dcLabel = "Save DC"
    const atkLabel = "Atk"
    const abLabel = "Ability"
    const xDC = innerX + 70
    const xAtk = xDC + 70
    const xAb = xAtk + 60
    drawText(page, dcLabel, xDC, yy + 1, { size: 6.5, font: fonts.bold, color: MUTED })
    drawText(page, String(sp.spellSaveDC), xDC + 38, yy, { size: 9, font: fonts.bold })
    drawText(page, atkLabel, xAtk, yy + 1, { size: 6.5, font: fonts.bold, color: MUTED })
    drawText(page, fmtMod(sp.spellAttackBonus), xAtk + 20, yy, { size: 9, font: fonts.bold })
    drawText(page, abLabel, xAb, yy + 1, { size: 6.5, font: fonts.bold, color: MUTED })
    drawText(page, ab3(sp.ability), xAb + 30, yy, { size: 9, font: fonts.bold })
    yy -= 12
  }

  // Slot tiles: one row of small tiles, grouped by level.
  // Use the same look as hit dice: bordered box with label inside, X if used.
  const totalByLvl: Record<number, number> = {}
  const availByLvl: Record<number, number> = {}
  for (const lvl of char.spellSlots) totalByLvl[lvl] = (totalByLvl[lvl] ?? 0) + 1
  for (const lvl of char.availableSpellSlots) availByLvl[lvl] = (availByLvl[lvl] ?? 0) + 1
  const levels = Object.keys(totalByLvl)
    .map(Number)
    .sort((a, b) => a - b)
  const pactByLvl: Record<number, number> = {}
  for (const lvl of char.pactMagicSlots ?? []) pactByLvl[lvl] = (pactByLvl[lvl] ?? 0) + 1
  const pactLevels = Object.keys(pactByLvl)
    .map(Number)
    .sort((a, b) => a - b)

  const slotTileW = 16
  const slotTileH = 11
  const slotGap = 2
  const groupGap = 8

  type Group = { label: string; level: number; total: number; used: number }
  const groups: Group[] = []
  for (const lvl of levels) {
    groups.push({
      label: `L${lvl}`,
      level: lvl,
      total: totalByLvl[lvl] ?? 0,
      used: (totalByLvl[lvl] ?? 0) - (availByLvl[lvl] ?? 0),
    })
  }
  for (const lvl of pactLevels) {
    groups.push({
      label: `P${lvl}`,
      level: lvl,
      total: pactByLvl[lvl] ?? 0,
      used: 0,
    })
  }

  if (groups.length === 0) return

  // Render tiles starting at the current yy, leaving 3pt below for breathing
  const slotsY = yy - slotTileH + 1
  let sx = innerX
  for (const g of groups) {
    drawText(page, g.label, sx, slotsY + 2, { size: 6.5, font: fonts.bold, color: MUTED })
    sx += 14
    for (let i = 0; i < g.total; i++) {
      drawRect(page, sx, slotsY, slotTileW, slotTileH, { thickness: THIN_W })
      drawTextCenter(page, `L${g.level}`, sx + slotTileW / 2, slotsY + 2, fonts.regular, 7)
      if (i < g.used) {
        drawLine(page, sx + 1, slotsY + 1, sx + slotTileW - 1, slotsY + slotTileH - 1, {
          thickness: THIN_W,
        })
        drawLine(page, sx + 1, slotsY + slotTileH - 1, sx + slotTileW - 1, slotsY + 1, {
          thickness: THIN_W,
        })
      }
      sx += slotTileW + slotGap
      // wrap if we run out of horizontal space
      if (sx + slotTileW > innerX + innerW) {
        sx = innerX + 14
        // (no vertical wrap support in v1 — extremely rare to need it)
        break
      }
    }
    sx += groupGap
  }
}

// Two-column list inside a tabbed box. Items split column-major: items[0..mid]
// fill the left column top-to-bottom, items[mid..] fill the right.
function drawTwoColList<T>(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  items: T[],
  renderItem: (item: T, x: number, y: number, colW: number) => void,
  bottomReservedH = 0
): void {
  const innerX = x + 8
  const innerW = w - 16
  const colGap = 8
  const colW = (innerW - colGap) / 2
  const leftX = innerX
  const rightX = innerX + colW + colGap

  const rowH = 11
  const top = y + h - 14
  const bottom = y + 6 + bottomReservedH
  const rowsPerCol = Math.max(1, Math.floor((top - bottom) / rowH))
  const capacity = rowsPerCol * 2

  const visible = items.slice(0, capacity)
  const mid = Math.ceil(visible.length / 2)
  const leftItems = visible.slice(0, mid)
  const rightItems = visible.slice(mid)

  let yy = top
  for (const it of leftItems) {
    renderItem(it, leftX, yy, colW)
    yy -= rowH
  }
  yy = top
  for (const it of rightItems) {
    renderItem(it, rightX, yy, colW)
    yy -= rowH
  }

  const overflowCount = items.length - visible.length
  if (overflowCount > 0) {
    drawText(page, `… and ${overflowCount} more`, innerX, y + 8, {
      size: 7.5,
      color: MUTED,
    })
  }
}

function drawFeaturesBox(
  page: PDFPage,
  char: ComputedCharacter,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: Fonts
): void {
  drawTabbedBox(page, x, y, w, h, "Features & Traits", fonts)

  drawTwoColList(page, x, y, w, h, char.traits, (t, ix, iy, colW) => {
    const sourceTag =
      t.source === "class" || t.source === "subclass"
        ? "C"
        : t.source === "species" || t.source === "lineage"
          ? "S"
          : t.source === "background"
            ? "B"
            : "·"
    drawText(page, sourceTag, ix, iy, { size: 7, font: fonts.bold, color: MUTED })
    drawText(page, ellipsize(fonts.regular, 9, t.name, colW - 12), ix + 10, iy, { size: 9 })
  })
}

function drawEquipmentBox(
  page: PDFPage,
  char: ComputedCharacter,
  x: number,
  y: number,
  w: number,
  h: number,
  fonts: Fonts
): void {
  drawTabbedBox(page, x, y, w, h, "Equipment", fonts)
  const innerX = x + 8
  const innerW = w - 16

  // Coins line at the very bottom
  const coinsY = y + 6
  const coins = char.coins
  const coinParts = [
    `${coins?.cp ?? 0} CP`,
    `${coins?.sp ?? 0} SP`,
    `${coins?.ep ?? 0} EP`,
    `${coins?.gp ?? 0} GP`,
    `${coins?.pp ?? 0} PP`,
  ]
  drawText(page, "Coins:", innerX, coinsY, { size: 7, font: fonts.bold, color: MUTED })
  drawText(page, coinParts.join("   ·   "), innerX + 28, coinsY, { size: 8 })
  drawLine(page, innerX, coinsY + 11, innerX + innerW, coinsY + 11, { thickness: THIN_W })

  const sorted = [...char.equippedItems].sort((a, b) => a.name.localeCompare(b.name))
  drawTwoColList(
    page,
    x,
    y,
    w,
    h,
    sorted,
    (it, ix, iy, colW) => {
      // tag: x (wielded) / w (worn) / · (carried)
      const tag = it.wielded ? "x" : it.worn ? "w" : "·"
      drawText(page, tag, ix, iy, { size: 7, font: fonts.bold, color: MUTED })
      const textW = colW - 12
      let suffix = ""
      if (it.chargeLabel) {
        const lbl = it.chargeLabel === "ammunition" ? "ammo" : "ch"
        suffix = `  (${lbl}: ${it.currentCharges})`
      }
      const name = ellipsize(fonts.regular, 9, `${it.name}${suffix}`, textW)
      drawText(page, name, ix + 10, iy, { size: 9 })
    },
    18 // reserve room at the bottom for the coins line
  )
}

// ─── Overflow pages: spells, full traits/inventory, wild shape ────────────

function startPage(doc: PDFDocument): Cursor {
  const page = doc.addPage([PAGE_W, PAGE_H])
  return { page, y: PAGE_H - MARGIN }
}

function ensureSpace(doc: PDFDocument, c: Cursor, need: number): Cursor {
  if (c.y - need < MARGIN + 16) {
    return startPage(doc)
  }
  return c
}

function drawOverflowSectionHeader(
  page: PDFPage,
  label: string,
  x: number,
  y: number,
  w: number,
  fonts: Fonts
): void {
  // Centered label between two horizontal rules
  const labelText = label.toUpperCase()
  const labelW = fonts.bold.widthOfTextAtSize(labelText, 9)
  const midGap = 6
  const ruleY = y - 4
  drawLine(page, x, ruleY, x + (w - labelW) / 2 - midGap, ruleY, { thickness: LINE_W })
  drawLine(page, x + (w + labelW) / 2 + midGap, ruleY, x + w, ruleY, { thickness: LINE_W })
  drawTextCenter(page, labelText, x + w / 2, y - 8, fonts.bold, 9)
}

function drawSpellsPages(
  doc: PDFDocument,
  cIn: Cursor,
  char: ComputedCharacter,
  fonts: Fonts
): Cursor {
  if (char.spells.length === 0) return cIn

  let c = cIn
  for (const sp of char.spells) {
    c = ensureSpace(doc, c, 40)
    drawOverflowSectionHeader(c.page, `${titleCase(sp.class)} Spells`, MARGIN, c.y, INNER_W, fonts)
    c.y -= 18

    const stats = `Save DC ${sp.spellSaveDC}   ·   Spell Attack ${fmtMod(sp.spellAttackBonus)}   ·   Casting Ability: ${ab3(sp.ability)}`
    drawText(c.page, stats, MARGIN + 4, c.y, { size: 9, color: MUTED })
    c.y -= 14

    const drawSlot = (
      slot: { spell_id: string | null; alwaysPrepared: boolean },
      isPrepared: boolean
    ) => {
      c = ensureSpace(doc, c, 12)
      drawText(c.page, "•", MARGIN + 8, c.y, { size: 9, color: MUTED })
      if (slot.spell_id) {
        const name = lookupSpellName(slot.spell_id)
        drawText(c.page, name, MARGIN + 18, c.y, {
          size: 9,
          font: isPrepared && slot.alwaysPrepared ? fonts.bold : fonts.regular,
        })
        if (slot.alwaysPrepared) {
          drawTextRight(
            c.page,
            "always prepared",
            MARGIN + INNER_W - 4,
            c.y,
            fonts.regular,
            7,
            MUTED
          )
        }
      } else {
        // empty slot: a write-in line
        drawLine(c.page, MARGIN + 18, c.y - 2, MARGIN + 180, c.y - 2, { thickness: THIN_W })
      }
      c.y -= 12
    }

    if (sp.cantripSlots.length > 0) {
      c = ensureSpace(doc, c, 14)
      drawText(c.page, "Cantrips", MARGIN + 4, c.y, { size: 8, font: fonts.bold, color: MUTED })
      c.y -= 11
      for (const s of sp.cantripSlots) drawSlot(s, false)
      c.y -= 3
    }

    if (sp.preparedSpells.length > 0) {
      c = ensureSpace(doc, c, 14)
      drawText(c.page, "Prepared / Known", MARGIN + 4, c.y, {
        size: 8,
        font: fonts.bold,
        color: MUTED,
      })
      c.y -= 11
      for (const s of sp.preparedSpells) drawSlot(s, true)
      c.y -= 3
    }

    if (sp.knownSpells && sp.knownSpells.length > 0) {
      c = ensureSpace(doc, c, 14)
      drawText(c.page, "Spellbook", MARGIN + 4, c.y, {
        size: 8,
        font: fonts.bold,
        color: MUTED,
      })
      c.y -= 11
      const names = sp.knownSpells.map(lookupSpellName).sort().join(", ")
      for (const ln of wrapLines(fonts.regular, 9, names, INNER_W - 16)) {
        c = ensureSpace(doc, c, 11)
        drawText(c.page, ln, MARGIN + 14, c.y, { size: 9 })
        c.y -= 11
      }
      c.y -= 6
    }
  }
  return c
}

function drawWildShapePage(
  doc: PDFDocument,
  cIn: Cursor,
  char: ComputedCharacter,
  fonts: Fonts
): Cursor {
  const ws = char.wildShape
  if (!ws) return cIn

  let c = ensureSpace(doc, cIn, 50)
  drawOverflowSectionHeader(c.page, "Wild Shape", MARGIN, c.y, INNER_W, fonts)
  c.y -= 18

  const summary = [
    `Uses: ${ws.usesAvailable} / ${ws.maxUses}`,
    `Max CR: ${ws.limits.maxCR}`,
    ws.knownForms !== null ? `Known forms: ${ws.beasts.length} / ${ws.knownForms}` : null,
  ].filter(Boolean) as string[]
  drawText(c.page, summary.join("   ·   "), MARGIN + 4, c.y, { size: 9 })
  c.y -= 13

  const constraints: string[] = []
  if (!ws.limits.canSwim) constraints.push("no swim speed")
  if (!ws.limits.canFly) constraints.push("no fly speed")
  if (constraints.length > 0) {
    drawText(c.page, `Form restrictions: ${constraints.join(", ")}`, MARGIN + 4, c.y, {
      size: 9,
      color: MUTED,
    })
    c.y -= 13
  }

  if (ws.beasts.length > 0) {
    drawText(c.page, "Known beasts", MARGIN + 4, c.y, {
      size: 8,
      font: fonts.bold,
      color: MUTED,
    })
    c.y -= 11
    const line = ws.beasts.map(titleCase).join(", ")
    for (const ln of wrapLines(fonts.regular, 9, line, INNER_W - 16)) {
      c = ensureSpace(doc, c, 11)
      drawText(c.page, ln, MARGIN + 14, c.y, { size: 9 })
      c.y -= 11
    }
  }

  if (ws.currentBeast && ws.ongoingTransformation) {
    c.y -= 4
    c = ensureSpace(doc, c, 14)
    drawText(
      c.page,
      `Currently transformed: ${titleCase(ws.currentBeast.name)} (HP ${ws.ongoingTransformation.currentBeastHp} / ${ws.currentBeast.hitPoints}, AC ${ws.currentBeast.ac})`,
      MARGIN + 4,
      c.y,
      { size: 9, font: fonts.bold }
    )
    c.y -= 13
  }

  c.y -= 6
  return c
}

// ─── Footers ──────────────────────────────────────────────────────────────

function drawFooters(doc: PDFDocument, char: ComputedCharacter, fonts: Fonts): void {
  const pages = doc.getPages()
  const today = new Date().toISOString().slice(0, 10)
  pages.forEach((p, i) => {
    drawText(p, `${char.name} — csheet.net`, MARGIN, 12, {
      size: 7,
      font: fonts.regular,
      color: MUTED,
    })
    drawTextRight(
      p,
      `${today} · page ${i + 1} of ${pages.length}`,
      MARGIN + INNER_W,
      12,
      fonts.regular,
      7,
      MUTED
    )
  })
}

// ─── Page 1 assembly ──────────────────────────────────────────────────────

function drawPage1(
  page: PDFPage,
  char: ComputedCharacter,
  playerName: string | undefined,
  fonts: Fonts
): void {
  const afterTopStrip = drawTopStrip(page, char, playerName, fonts)

  // Main 2-col area starts directly after the top strip.
  const mainTop = afterTopStrip - 8
  const mainBottom = MARGIN + 24 // room for footer

  const abilityColW = 92
  const colGap = 8
  const rightColX = MARGIN + abilityColW + colGap
  const rightColW = INNER_W - abilityColW - colGap

  drawAbilityColumn(page, char, MARGIN, mainTop, abilityColW, mainBottom, fonts)

  const sections: RightSection[] = [
    {
      key: "weapons",
      label: "Weapons",
      preferredH: 78,
      draw: (x, y, w, h) => drawWeaponsTable(page, char, x, y, w, h, fonts),
    },
    {
      key: "skills",
      label: "Skills",
      preferredH: 150,
      draw: (x, y, w, h) => drawSkillsBox(page, char, x, y, w, h, fonts),
    },
    {
      key: "spellcasting",
      label: "Spellcasting",
      preferredH: char.spells.length > 0 ? 56 + char.spells.length * 10 : 40,
      draw: (x, y, w, h) => drawSpellcastingBox(page, char, x, y, w, h, fonts),
    },
    {
      key: "features",
      label: "Features & Traits",
      preferredH: 96,
      draw: (x, y, w, h) => drawFeaturesBox(page, char, x, y, w, h, fonts),
    },
    {
      key: "equipment",
      label: "Equipment",
      preferredH: 104,
      draw: (x, y, w, h) => drawEquipmentBox(page, char, x, y, w, h, fonts),
    },
  ]

  const sectionGap = 4
  const totalPreferred = sections.reduce((s, sec) => s + sec.preferredH, 0)
  const totalTabs = TAB_H * sections.length
  const totalGaps = sectionGap * (sections.length - 1)
  const available = mainTop - mainBottom - totalTabs - totalGaps
  const scale = available / totalPreferred

  let y = mainTop - TAB_H
  for (const sec of sections) {
    const h = sec.preferredH * scale
    sec.draw(rightColX, y - h, rightColW, h)
    y -= h + sectionGap + TAB_H
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

async function buildCharacterPdfDoc(
  character: ComputedCharacter,
  playerName: string | undefined
): Promise<PDFDocument> {
  const doc = await PDFDocument.create()
  doc.setTitle(`${character.name} — Character Sheet`)
  doc.setProducer("csheet")
  doc.setCreator("csheet")

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fonts: Fonts = { regular, bold }

  const page1 = doc.addPage([PAGE_W, PAGE_H])
  drawPage1(page1, character, playerName, fonts)

  // Overflow pages
  let c: Cursor = { page: page1, y: MARGIN }
  // Force a new page for overflow content
  c = startPage(doc)
  const beforeOverflow = doc.getPageCount()

  c = drawWildShapePage(doc, c, character, fonts)
  c = drawSpellsPages(doc, c, character, fonts)

  // If the overflow page was added but nothing drew on it, remove it.
  if (!character.wildShape && character.spells.length === 0) {
    const overflowPageIdx = beforeOverflow - 1
    if (doc.getPages()[overflowPageIdx]) {
      doc.removePage(overflowPageIdx)
    }
  }

  drawFooters(doc, character, fonts)
  return doc
}

export async function generateCharacterPdf(
  character: ComputedCharacter,
  playerName?: string
): Promise<Uint8Array> {
  const doc = await buildCharacterPdfDoc(character, playerName)
  return doc.save()
}

export interface CampaignPdfEntry {
  character: ComputedCharacter
  playerName?: string
}

// Concatenate each character's full PDF back-to-back. A 4-character party
// with two spellcasters will run 8+ pages; that's intentional — the
// campaign PDF is a convenience print for the DM.
export async function generateCampaignPdf(entries: CampaignPdfEntry[]): Promise<Uint8Array> {
  if (entries.length === 0) {
    throw new Error("Cannot generate campaign PDF with zero characters")
  }

  const combined = await PDFDocument.create()
  for (const entry of entries) {
    const charDoc = await buildCharacterPdfDoc(entry.character, entry.playerName)
    const pageCount = charDoc.getPageCount()
    const copied = await combined.copyPages(
      charDoc,
      Array.from({ length: pageCount }, (_, i) => i)
    )
    for (const page of copied) combined.addPage(page)
  }

  return combined.save()
}
