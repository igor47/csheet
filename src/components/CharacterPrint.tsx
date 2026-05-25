import { Abilities, type AbilityType, type ProficiencyLevel, Skills } from "@src/lib/dnd"
import { spells as allSpells } from "@src/lib/dnd/spells"
import type { CharacterClass, ComputedCharacter, SkillScore } from "@src/services/computeCharacter"
import type { Child } from "hono/jsx"

// ---- Helpers ----

const fmt = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

const classString = (classes: CharacterClass[]) =>
  classes.map((c) => `${c.class.charAt(0).toUpperCase() + c.class.slice(1)} ${c.level}`).join(" / ")

function groupHitDice(dice: number[]): string {
  const counts = new Map<number, number>()
  for (const d of dice) counts.set(d, (counts.get(d) ?? 0) + 1)
  return Array.from(counts.entries())
    .map(([die, count]) => `${count}d${die}`)
    .join(", ")
}

function groupSlots(slots: number[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const s of slots) map.set(s, (map.get(s) ?? 0) + 1)
  return map
}

// ---- Inline CSS ----

export const PRINT_STYLES = `
@page { size: letter portrait; margin: 0.5in; }
* { box-sizing: border-box; }
body {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 9pt;
  color: #1a1a1a;
  background: white;
  margin: 0;
  padding: 0;
}

/* Screen preview */
@media screen {
  body { background: #aaa; }
  .print-sheet {
    background: white;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in;
    box-shadow: 0 2px 14px rgba(0,0,0,0.45);
    min-height: 11in;
  }
}

/* Action bar — hidden on print */
.action-bar {
  background: #f0f0f0;
  border-bottom: 1px solid #ccc;
  padding: 8px 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
}
.action-bar button {
  background: #222;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 13px;
}
.action-bar a { color: #555; text-decoration: none; }
@media print { .action-bar { display: none !important; } }

/* Header */
.sheet-header {
  border-bottom: 2pt solid #1a1a1a;
  padding-bottom: 5pt;
  margin-bottom: 7pt;
}
.char-name {
  font-size: 18pt;
  font-weight: bold;
  margin: 0 0 4pt 0;
  letter-spacing: -0.3pt;
}
.char-meta { display: flex; flex-wrap: wrap; gap: 0 14pt; }
.char-meta-item { display: flex; flex-direction: column; }
.char-meta-label {
  font-size: 5.5pt;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #666;
}
.char-meta-value {
  font-size: 8pt;
  font-weight: bold;
  text-transform: capitalize;
}

/* Two-column body */
.sheet-body {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: 8pt;
}

/* Sections */
.section {
  border: 0.75pt solid #888;
  border-radius: 3pt;
  margin-bottom: 5pt;
  padding: 3pt 5pt;
  break-inside: avoid;
  page-break-inside: avoid;
}
.section-title {
  font-size: 5.5pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #444;
  border-bottom: 0.5pt solid #bbb;
  padding-bottom: 2pt;
  margin: 0 0 3pt 0;
}

/* Abilities */
.abilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4pt;
}
.ability-box {
  border: 0.75pt solid #555;
  border-radius: 3pt;
  padding: 3pt;
  text-align: center;
  break-inside: avoid;
  page-break-inside: avoid;
}
.ability-name {
  font-size: 6pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 0.5pt solid #ccc;
  padding-bottom: 1.5pt;
  margin-bottom: 2pt;
  color: #222;
}
.ability-modifier {
  font-size: 16pt;
  font-weight: bold;
  line-height: 1;
  margin: 1pt 0;
}
.ability-score {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20pt;
  height: 20pt;
  border: 1.25pt solid #444;
  border-radius: 50%;
  font-size: 7.5pt;
  font-weight: bold;
  margin: 1.5pt auto;
}
.ability-save {
  font-size: 6pt;
  color: #555;
}
.ability-save b { font-size: 6.5pt; }

/* Proficiency dot */
.prof-dot {
  display: inline-block;
  width: 7pt;
  height: 7pt;
  border-radius: 50%;
  border: 0.75pt solid #555;
  flex-shrink: 0;
  vertical-align: middle;
}
.prof-dot.half {
  background: linear-gradient(to right, #444 50%, transparent 50%);
}
.prof-dot.proficient {
  background: #222;
  border-color: #111;
}
.prof-dot.expert {
  background: #222;
  border-color: #111;
  border-radius: 0;
  clip-path: polygon(50% 0%, 63% 34%, 98% 35%, 70% 57%, 80% 91%, 50% 70%, 20% 91%, 30% 57%, 2% 35%, 37% 34%);
}

/* Saving throws */
.save-row {
  display: flex;
  align-items: center;
  gap: 4pt;
  padding: 1.5pt 0;
  border-bottom: 0.5pt solid #eee;
  font-size: 7.5pt;
}
.save-name { flex: 1; text-transform: capitalize; }
.save-mod { font-weight: bold; min-width: 16pt; text-align: right; }

/* Skills */
.skill-row {
  display: flex;
  align-items: center;
  gap: 3pt;
  padding: 1.5pt 0;
  border-bottom: 0.5pt solid #eee;
  font-size: 7pt;
}
.skill-ability {
  font-size: 5.5pt;
  color: #888;
  width: 18pt;
  text-align: center;
}
.skill-name { flex: 1; text-transform: capitalize; }
.skill-mod { font-weight: bold; min-width: 16pt; text-align: right; }

/* Combat row */
.combat-row { display: flex; gap: 5pt; margin-bottom: 5pt; }
.combat-box {
  flex: 1;
  border: 0.75pt solid #666;
  border-radius: 3pt;
  text-align: center;
  padding: 4pt 2pt;
  break-inside: avoid;
}
.combat-value { font-size: 14pt; font-weight: bold; line-height: 1.1; }
.combat-label { font-size: 5.5pt; text-transform: uppercase; letter-spacing: 0.06em; color: #555; }

/* HP */
.hp-row { display: flex; gap: 5pt; margin-bottom: 5pt; }
.hp-box {
  flex: 1;
  border: 0.75pt solid #666;
  border-radius: 3pt;
  text-align: center;
  padding: 4pt 2pt;
}
.hp-value { font-size: 17pt; font-weight: bold; line-height: 1; }
.hp-label { font-size: 5.5pt; text-transform: uppercase; color: #555; letter-spacing: 0.05em; }

/* Items */
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5pt 0;
  border-bottom: 0.5pt solid #eee;
  font-size: 7.5pt;
  gap: 4pt;
}
.item-name { font-weight: 600; flex: 1; }
.item-detail { color: #555; font-size: 6.5pt; text-align: right; }

/* Coins */
.coin-row { display: flex; gap: 8pt; padding-top: 3pt; }
.coin-item { text-align: center; }
.coin-value { font-weight: bold; font-size: 8.5pt; }
.coin-label { font-size: 5.5pt; text-transform: uppercase; color: #666; }

/* Page 2 */
.page-2 { break-before: page; page-break-before: always; }
.traits-grid { columns: 2; column-gap: 12pt; }
.trait-item { break-inside: avoid; page-break-inside: avoid; margin-bottom: 6pt; }
.trait-source { font-size: 5.5pt; text-transform: uppercase; color: #888; letter-spacing: 0.08em; }
.trait-name { font-weight: bold; font-size: 8pt; text-transform: capitalize; }
.trait-note { font-size: 6.5pt; color: #555; font-style: italic; }
.trait-desc { font-size: 7pt; color: #333; margin-top: 1pt; white-space: pre-wrap; word-break: break-word; }

/* Spells */
.spell-class-row {
  display: flex;
  gap: 8pt;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 5pt;
}
.spell-stat {
  text-align: center;
  border: 0.75pt solid #666;
  border-radius: 3pt;
  padding: 2pt 6pt;
}
.spell-stat-value { font-size: 11pt; font-weight: bold; line-height: 1.1; }
.spell-stat-label { font-size: 5.5pt; text-transform: uppercase; color: #555; }
.spell-class-name {
  font-size: 9pt;
  font-weight: bold;
  text-transform: capitalize;
  flex: 1;
}
.spell-slots-row { display: flex; flex-wrap: wrap; gap: 3pt; margin-bottom: 5pt; }
.spell-slot {
  width: 18pt;
  height: 18pt;
  border: 0.75pt solid #444;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 6pt;
  font-weight: bold;
}
.spell-slot.used { background: #333; color: white; border-color: #111; }
.spell-list { columns: 2; column-gap: 10pt; margin-bottom: 8pt; }
.spell-item {
  display: flex;
  justify-content: space-between;
  font-size: 7.5pt;
  padding: 1pt 0;
  border-bottom: 0.5pt solid #eee;
  break-inside: avoid;
}
.spell-level { font-size: 6pt; color: #777; }
`

// ---- Sub-components ----

const PrintProfDot = ({ level }: { level: ProficiencyLevel }) => (
  <span class={`prof-dot ${level}`} />
)

const PrintAbilityBox = ({
  name,
  score,
  modifier,
  savingThrow,
  proficient,
}: {
  name: AbilityType
  score: number
  modifier: number
  savingThrow: number
  proficient: boolean
}) => (
  <div class="ability-box">
    <div class="ability-name">{name.slice(0, 3).toUpperCase()}</div>
    <div class="ability-modifier">{fmt(modifier)}</div>
    <div class="ability-score">{score}</div>
    <div class="ability-save">
      save: <b>{fmt(savingThrow)}</b>
      {proficient && " ●"}
    </div>
  </div>
)

const PrintSkillRow = ({ skill, skillScore }: { skill: string; skillScore: SkillScore }) => (
  <div class="skill-row">
    <PrintProfDot level={skillScore.proficiency} />
    <span class="skill-ability">{skillScore.ability.slice(0, 3).toUpperCase()}</span>
    <span class="skill-name">{skill}</span>
    <span class="skill-mod">{fmt(skillScore.modifier)}</span>
  </div>
)

const PrintSection = ({ title, children }: { title: string; children?: Child | Child[] }) => (
  <div class="section">
    <div class="section-title">{title}</div>
    {children}
  </div>
)

// ---- Page 1 columns ----

const LeftColumn = ({ character }: { character: ComputedCharacter }) => (
  <div>
    <PrintSection title="Ability Scores">
      <div class="abilities-grid">
        {Abilities.map((ability) => {
          const ab = character.abilityScores[ability]
          return (
            <PrintAbilityBox
              name={ability}
              score={ab.score}
              modifier={ab.modifier}
              savingThrow={ab.savingThrow}
              proficient={ab.proficient}
            />
          )
        })}
      </div>
    </PrintSection>

    <PrintSection title="Saving Throws">
      {Abilities.map((ability) => {
        const ab = character.abilityScores[ability]
        return (
          <div class="save-row">
            <PrintProfDot level={ab.proficient ? "proficient" : "none"} />
            <span class="save-name">{ability}</span>
            <span class="save-mod">{fmt(ab.savingThrow)}</span>
          </div>
        )
      })}
    </PrintSection>

    <PrintSection title="Skills">
      {Skills.map((skill) => (
        <PrintSkillRow skill={skill} skillScore={character.skills[skill]} />
      ))}
    </PrintSection>
  </div>
)

const RightColumn = ({ character }: { character: ComputedCharacter }) => {
  const weapons = character.equippedItems.filter((i) => i.wielded && i.damage.length > 0)
  const equipment = character.equippedItems.filter((i) => !weapons.includes(i))
  const coins = character.coins ?? { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }
  const totalHitDice = groupHitDice(character.hitDice)
  const availHitDice = groupHitDice(character.availableHitDice)

  return (
    <div>
      {/* Combat stats */}
      <div class="combat-row">
        <div class="combat-box">
          <div class="combat-value">{character.armorClass}</div>
          <div class="combat-label">Armor Class</div>
        </div>
        <div class="combat-box">
          <div class="combat-value">{fmt(character.initiative)}</div>
          <div class="combat-label">Initiative</div>
        </div>
        <div class="combat-box">
          <div class="combat-value">{character.speed}</div>
          <div class="combat-label">Speed (ft)</div>
        </div>
      </div>

      {/* HP */}
      <div class="hp-row">
        <div class="hp-box">
          <div class="hp-value">{character.currentHP}</div>
          <div class="hp-label">Current HP</div>
        </div>
        <div class="hp-box">
          <div class="hp-value">{character.maxHitPoints}</div>
          <div class="hp-label">Max HP</div>
        </div>
      </div>

      {/* Hit Dice + Passive Perception */}
      <div style="display:flex;gap:5pt;margin-bottom:5pt;">
        <div class="combat-box" style="flex:2">
          <div class="combat-value" style="font-size:10pt;">
            {availHitDice || "—"} / {totalHitDice || "—"}
          </div>
          <div class="combat-label">Hit Dice (available / total)</div>
        </div>
        <div class="combat-box" style="flex:1">
          <div class="combat-value">{character.passivePerception}</div>
          <div class="combat-label">Passive Perception</div>
        </div>
      </div>

      {/* Weapons */}
      {weapons.length > 0 && (
        <PrintSection title="Weapons">
          {weapons.map((w) => (
            <div class="item-row">
              <span class="item-name">{w.name}</span>
              <span class="item-detail">{w.humanReadableDamage.join(", ")}</span>
            </div>
          ))}
        </PrintSection>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <PrintSection title="Equipment">
          {equipment.map((item) => (
            <div class="item-row">
              <span class="item-name">{item.name}</span>
              <span class="item-detail">
                {item.worn ? "worn" : item.wielded ? "wielded" : ""}
                {item.currentCharges > 0 ? ` (${item.currentCharges} ${item.chargeLabel})` : ""}
              </span>
            </div>
          ))}
        </PrintSection>
      )}

      {/* Coins */}
      <PrintSection title="Coins">
        <div class="coin-row">
          {coins.pp > 0 && (
            <div class="coin-item">
              <div class="coin-value">{coins.pp}</div>
              <div class="coin-label">PP</div>
            </div>
          )}
          <div class="coin-item">
            <div class="coin-value">{coins.gp}</div>
            <div class="coin-label">GP</div>
          </div>
          {coins.ep > 0 && (
            <div class="coin-item">
              <div class="coin-value">{coins.ep}</div>
              <div class="coin-label">EP</div>
            </div>
          )}
          <div class="coin-item">
            <div class="coin-value">{coins.sp}</div>
            <div class="coin-label">SP</div>
          </div>
          <div class="coin-item">
            <div class="coin-value">{coins.cp}</div>
            <div class="coin-label">CP</div>
          </div>
        </div>
      </PrintSection>
    </div>
  )
}

// ---- Page 2: Traits ----

const TraitsPage = ({ character }: { character: ComputedCharacter }) => {
  const hasSpells = character.spells.length > 0
  const totalSlots = groupSlots(character.spellSlots)
  const availSlots = groupSlots(character.availableSpellSlots)
  const pactSlots = character.pactMagicSlots ? groupSlots(character.pactMagicSlots) : null

  return (
    <div class="page-2">
      <PrintSection title="Traits & Features">
        <div class="traits-grid">
          {character.traits.map((t) => (
            <div class="trait-item">
              <div class="trait-source">
                {t.source}
                {t.source_detail ? ` · ${t.source_detail}` : ""}
                {t.level ? ` (level ${t.level})` : ""}
              </div>
              <div class="trait-name">{t.name}</div>
              {t.note && <div class="trait-note">{t.note}</div>}
              <div class="trait-desc">{t.description}</div>
            </div>
          ))}
        </div>
      </PrintSection>

      {hasSpells && (
        <PrintSection title="Spells">
          {/* Per-class spellcasting stats */}
          {character.spells.map((spellInfo) => {
            const cantrips = spellInfo.cantripSlots
              .filter((s) => s.spell_id)
              .map((s) => allSpells.find((sp) => sp.id === s.spell_id))
              .filter(Boolean)
            const prepared = spellInfo.preparedSpells
              .filter((s) => s.spell_id)
              .map((s) => allSpells.find((sp) => sp.id === s.spell_id))
              .filter(Boolean)

            return (
              <div style="margin-bottom:8pt;">
                <div class="spell-class-row">
                  <span class="spell-class-name">{spellInfo.class} Spells</span>
                  <div class="spell-stat">
                    <div class="spell-stat-value">{fmt(spellInfo.spellAttackBonus)}</div>
                    <div class="spell-stat-label">Spell Attack</div>
                  </div>
                  <div class="spell-stat">
                    <div class="spell-stat-value">{spellInfo.spellSaveDC}</div>
                    <div class="spell-stat-label">Save DC</div>
                  </div>
                </div>

                {/* Spell slots for this section (shown once under first class) */}
                {character.spells.indexOf(spellInfo) === 0 && totalSlots.size > 0 && (
                  <div style="margin-bottom:5pt;">
                    <div class="section-title" style="margin-bottom:3pt;">
                      Spell Slots
                    </div>
                    <div class="spell-slots-row">
                      {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => {
                        const total = totalSlots.get(level) ?? 0
                        const avail = availSlots.get(level) ?? 0
                        if (total === 0) return null
                        return Array.from({ length: total }, (_, i) => (
                          <div class={`spell-slot${i >= avail ? " used" : ""}`}>L{level}</div>
                        ))
                      })}
                    </div>
                  </div>
                )}

                {/* Pact magic slots */}
                {pactSlots && pactSlots.size > 0 && character.spells.indexOf(spellInfo) === 0 && (
                  <div style="margin-bottom:5pt;">
                    <div class="section-title" style="margin-bottom:3pt;">
                      Pact Magic Slots
                    </div>
                    <div class="spell-slots-row">
                      {Array.from(pactSlots.entries()).map(([level, count]) =>
                        Array.from({ length: count }, () => <div class="spell-slot">L{level}</div>)
                      )}
                    </div>
                  </div>
                )}

                {/* Cantrips + prepared spells */}
                {(cantrips.length > 0 || prepared.length > 0) && (
                  <div class="spell-list">
                    {cantrips.map((spell) => (
                      <div class="spell-item">
                        <span>{spell!.name}</span>
                        <span class="spell-level">Cantrip</span>
                      </div>
                    ))}
                    {prepared.map((spell) => (
                      <div class="spell-item">
                        <span>{spell!.name}</span>
                        <span class="spell-level">Lv {spell!.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </PrintSection>
      )}
    </div>
  )
}

// ---- Full sheet body (exported for CampaignPrint reuse) ----

export const CharacterSheetBody = ({ character }: { character: ComputedCharacter }) => {
  const meta = character.lineage ? `${character.species} (${character.lineage})` : character.species

  return (
    <>
      <div class="sheet-header">
        <div class="char-name">{character.name}</div>
        <div class="char-meta">
          <div class="char-meta-item">
            <span class="char-meta-label">Class &amp; Level</span>
            <span class="char-meta-value">{classString(character.classes)}</span>
          </div>
          {character.species && (
            <div class="char-meta-item">
              <span class="char-meta-label">Species</span>
              <span class="char-meta-value">{meta}</span>
            </div>
          )}
          {character.background && (
            <div class="char-meta-item">
              <span class="char-meta-label">Background</span>
              <span class="char-meta-value">{character.background}</span>
            </div>
          )}
          {character.alignment && (
            <div class="char-meta-item">
              <span class="char-meta-label">Alignment</span>
              <span class="char-meta-value">{character.alignment}</span>
            </div>
          )}
          <div class="char-meta-item">
            <span class="char-meta-label">Proficiency Bonus</span>
            <span class="char-meta-value">{fmt(character.proficiencyBonus)}</span>
          </div>
          <div class="char-meta-item">
            <span class="char-meta-label">Size</span>
            <span class="char-meta-value">{character.size}</span>
          </div>
        </div>
      </div>

      <div class="sheet-body">
        <LeftColumn character={character} />
        <RightColumn character={character} />
      </div>

      <TraitsPage character={character} />
    </>
  )
}

// ---- Standalone page ----

export const CharacterPrint = ({ character }: { character: ComputedCharacter }) => (
  <html lang="en">
    <head>
      <title>{character.name} — Character Sheet</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: fully controlled CSS string, not user input */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
    </head>
    <body>
      <div class="action-bar">
        <button type="button" onclick="window.print()">
          Print / Save as PDF
        </button>
        <a href={`/characters/${character.id}`}>← Back to character sheet</a>
      </div>
      <div class="print-sheet">
        <CharacterSheetBody character={character} />
      </div>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: fully controlled script string, not user input */}
      <script dangerouslySetInnerHTML={{ __html: "window.print()" }} />
    </body>
  </html>
)
