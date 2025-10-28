import { getEffectTooltip, hasEffect } from "@src/lib/effectTooltip"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { EquippedComputedItem } from "@src/services/computeCharacterItems"
import { HitDiceDisplay } from "./ui/HitDiceDisplay"
import { HitPointsBar } from "./ui/HitPointsBar"
import { LabeledValue } from "./ui/LabeledValue"

export interface CharacterInfoProps {
  character: ComputedCharacter
  swapOob?: boolean
}

interface WieldedWeaponRowProps {
  item: EquippedComputedItem
  characterId: string
}

const WieldedWeaponRow = ({ item, characterId }: WieldedWeaponRowProps) => {
  // Use pre-computed human-readable damage
  const damageDisplay =
    item.humanReadableDamage.length > 0 ? item.humanReadableDamage.join(", ") : null

  return (
    <div class="d-flex align-items-center justify-content-between gap-2">
      <div class="d-flex flex-column">
        <button
          type="button"
          class="btn btn-link p-0 text-start fw-bold"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
          hx-get={`/characters/${characterId}/items/${item.id}`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
        >
          {item.name}
        </button>
        {damageDisplay && <span class="text-muted small d-md-none">({damageDisplay})</span>}
      </div>
      <div class="d-flex align-items-center gap-2">
        {damageDisplay && (
          <span class="text-muted small d-none d-md-inline">({damageDisplay})</span>
        )}
        {item.chargeLabel && (
          <button
            type="button"
            class="btn btn-sm btn-outline-info"
            hx-get={`/characters/${characterId}/items/${item.id}/charges`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#editModal"
          >
            <i class="bi bi-lightning-charge"></i>{" "}
            {item.chargeLabel === "ammunition" ? "Ammo" : "Charges"}
            <span class="badge bg-info ms-1">{item.currentCharges}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function numToOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  const suffix = s[(v - 20) % 10] || s[v] || (s[0] as string)
  return n + suffix
}

export const CharacterInfo = ({ character, swapOob }: CharacterInfoProps) => {
  const classStrings: string[] = []
  for (const c of character.classes) {
    const parts: string[] = []
    const level = numToOrdinal(c.level)
    parts.push(`${level}-level ${c.class}`)
    if (c.subclass) {
      parts.push(`(${c.subclass})`)
    }
    classStrings.push(parts.join(" "))
  }

  return (
    <div
      class="card shadow-sm mb-3"
      id="character-info"
      hx-swap-oob={swapOob && "true"}
      data-character-id={character.id}
    >
      <div class="card-body">
        <div class="row g-2 d-flex align-items-center">
          <div class="col-3 col-lg-2">
            <button
              id="avatar-upload-button"
              type="button"
              class="position-relative ratio ratio-1x1 rounded overflow-hidden border-0 p-0"
              tabindex={0}
              hx-get={`/characters/${character.id}/edit/avatar`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal"
            >
              <img
                id="avatar-image"
                src={
                  character.avatar_id
                    ? `/uploads/${character.avatar_id}`
                    : "/static/placeholder.png"
                }
                class="w-100 h-100"
                alt={`${character.name}'s avatar`}
                style="object-fit: cover;"
              />
              <i
                id="avatar-upload-icon"
                class="bi bi-camera-fill text-white fs-1"
                style="position: absolute; top: 100%; left: 50%; transform: translate(-50%, -35%); pointer-events: none;"
              />
            </button>
          </div>
          <div class="col-9 col-lg-10">
            <h2>{character.name}</h2>

            {/* Class - full width under name */}
            <div class="row g-0 mt-2">
              <div class="col-11">
                <LabeledValue
                  label="Class"
                  value={classStrings.join(" / ")}
                  className="text-capitalize"
                />
              </div>
              <div class="col-1 d-flex flex-column gap-1 align-items-center">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="edit class"
                  title="edit class"
                  hx-get={`/characters/${character.id}/edit/class`}
                  hx-target="#editModalContent"
                  hx-swap="innerHTML"
                  data-bs-toggle="modal"
                  data-bs-target="#editModal"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="class history"
                  title="class history"
                  hx-get={`/characters/${character.id}/history/class`}
                  hx-target="#editModalContent"
                  hx-swap="innerHTML"
                  data-bs-toggle="modal"
                  data-bs-target="#editModal"
                >
                  <i class="bi bi-clock-history"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-2">
          <div class="col">
            {/* First row: Species, Background, Size */}
            <div class="row g-2 h-auto">
              <div class="col-sm-4">
                <LabeledValue
                  label="Species"
                  value={character.lineage || character.species}
                  className="text-capitalize"
                />
              </div>

              <div class="col-sm-4">
                <LabeledValue
                  label="Background"
                  value={character.background}
                  className="text-capitalize"
                />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Size" value={character.size} className="text-capitalize" />
              </div>
            </div>

            {/* Second row: Speed, Proficiency Bonus, Armor Class */}
            <div class="row g-2 h-auto mt-1">
              <div class="col-sm-4">
                <LabeledValue
                  label="Speed"
                  value={`${character.speed} ft.`}
                  hasEffect={hasEffect("speed", character.affectedAttributes)}
                  effectTooltip={
                    getEffectTooltip("speed", character.affectedAttributes) || undefined
                  }
                />
              </div>

              <div class="col-sm-4">
                <LabeledValue label="Proficiency Bonus" value={`+${character.proficiencyBonus}`} />
              </div>

              <div class="col-sm-4">
                <LabeledValue
                  label="Passive Perception"
                  value={`${character.passivePerception}`}
                  hasEffect={hasEffect("passive perception", character.affectedAttributes)}
                  effectTooltip={
                    getEffectTooltip("passive perception", character.affectedAttributes) ||
                    undefined
                  }
                />
              </div>
            </div>

            {/* third row: AC, initiative */}
            <div class="row g-2 h-auto mt-1">
              <div class="col-sm-3 offset-sm-3">
                <LabeledValue
                  label="Armor Class"
                  value={character.armorClass}
                  hasEffect={hasEffect("ac", character.affectedAttributes)}
                  effectTooltip={getEffectTooltip("ac", character.affectedAttributes) || undefined}
                />
              </div>

              <div class="col-sm-3">
                <LabeledValue
                  label="Initiative"
                  value={
                    character.initiative >= 0
                      ? `+${character.initiative}`
                      : `${character.initiative}`
                  }
                  hasEffect={hasEffect("initiative", character.affectedAttributes)}
                  effectTooltip={
                    getEffectTooltip("initiative", character.affectedAttributes) || undefined
                  }
                />
              </div>
            </div>

            {/* Weapons in Hand */}
            {(() => {
              const wieldedWeapons = character.equippedItems.filter((item) => item.wielded)
              if (wieldedWeapons.length === 0) return null

              return (
                <div class="row g-2 h-auto mt-2">
                  <div class="col-12">
                    <div class="text-muted small mb-1">Weapons in Hand</div>
                    <div class="d-flex flex-column gap-1">
                      {wieldedWeapons.map((weapon) => (
                        <WieldedWeaponRow item={weapon} characterId={character.id} />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Hit Points Progress Bar */}
            <div class="row g-2 h-auto mt-2">
              <div class="col-10 col-md-2">
                <div class="text-muted small text-center">Hit Points</div>
              </div>
              <div class="col-10 col-md-8">
                <HitPointsBar
                  currentHP={character.currentHP}
                  maxHitPoints={character.maxHitPoints}
                />
              </div>
              <div class="col-2 d-flex gap-1 align-items-center">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="edit hit points"
                  title="edit hit points"
                  hx-get={`/characters/${character.id}/edit/hitpoints`}
                  hx-target="#editModalContent"
                  hx-swap="innerHTML"
                  data-bs-toggle="modal"
                  data-bs-target="#editModal"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="hit points history"
                  title="hit points history"
                  hx-get={`/characters/${character.id}/history/hitpoints`}
                  hx-target="#editModalContent"
                  hx-swap="innerHTML"
                  data-bs-toggle="modal"
                  data-bs-target="#editModal"
                >
                  <i class="bi bi-clock-history"></i>
                </button>
              </div>
            </div>

            {/* Hit Dice */}
            <div class="row g-2 h-auto mt-2">
              <div class="col-10 col-md-2">
                <div class="text-muted small text-center">Hit Dice</div>
              </div>
              <div class="col-10 col-md-8">
                <HitDiceDisplay
                  allHitDice={character.hitDice}
                  availableHitDice={character.availableHitDice}
                />
              </div>
              <div class="col-2 d-flex gap-1 align-items-center">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="edit hit dice"
                  title="edit hit dice"
                  hx-get={`/characters/${character.id}/edit/hitdice`}
                  hx-target="#editModalContent"
                  hx-swap="innerHTML"
                  data-bs-toggle="modal"
                  data-bs-target="#editModal"
                >
                  <i class="bi bi-pencil"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary border p-1"
                  style="width: 24px; height: 24px; line-height: 1;"
                  aria-label="hit dice history"
                  title="hit dice history"
                  hx-get={`/characters/${character.id}/history/hitdice`}
                  hx-target="#editModalContent"
                  hx-swap="innerHTML"
                  data-bs-toggle="modal"
                  data-bs-target="#editModal"
                >
                  <i class="bi bi-clock-history"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
