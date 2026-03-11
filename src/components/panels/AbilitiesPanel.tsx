import { Abilities, type AbilityType } from "@src/lib/dnd"
import { getEffectTooltip, hasEffect } from "@src/lib/effectTooltip"
import type { AbilityScore, ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

interface AbilityBoxProps {
  ability: AbilityType
  score: number
  modifier: number
  savingThrow: number
  proficient: boolean
  hasEffect?: boolean
  effectTooltip?: string
  fromBeast?: boolean
}

const AbilityBox = ({
  ability,
  score,
  modifier,
  savingThrow,
  proficient,
  hasEffect = false,
  effectTooltip,
  fromBeast = false,
}: AbilityBoxProps) => {
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)
  const abilityNameClass = clsx("fw-medium text-uppercase border", {
    "bg-warning-subtle": fromBeast,
    "bg-primary-subtle": !fromBeast && proficient,
    "bg-dark-subtle": !fromBeast && !proficient,
  })

  const tooltipAttrs =
    hasEffect && effectTooltip
      ? { "data-bs-toggle": "tooltip", "data-bs-placement": "top", title: effectTooltip }
      : {}

  return (
    <div class="col">
      <div
        class={clsx("border rounded p-2 text-center position-relative", {
          "border-primary border-2": hasEffect,
        })}
        style="padding-bottom: 35px !important;"
        {...tooltipAttrs}
      >
        <div class={abilityNameClass} style="font-size: 0.7rem;">
          {ability}
        </div>

        <div class="d-flex" style="height: 60px;">
          {/* Modifier (left half) */}
          <div class="flex-fill d-flex flex-column align-items-center justify-content-center border-end">
            <div class="text-muted" style="font-size: 0.65rem;">
              MOD
            </div>
            <div class="fw-bold fs-5">{formatModifier(modifier)}</div>
          </div>

          {/* Saving Throw (right half) */}
          <div class="flex-fill d-flex flex-column align-items-center justify-content-center">
            <div class="text-muted" style="font-size: 0.65rem;">
              SAVE
            </div>
            <div class="fw-bold fs-5">{formatModifier(savingThrow)}</div>
          </div>
        </div>

        <div
          class="rounded-circle bg-secondary-subtle border d-flex align-items-center justify-content-center mx-auto fw-bold position-absolute start-50 translate-middle-x"
          style="width: 40px; height: 40px; font-size: 0.85rem; bottom: -10px;"
        >
          {score}
        </div>
      </div>
    </div>
  )
}

interface AbilitiesPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
  isReadOnly?: boolean
}

export const AbilitiesPanel = ({ character, swapOob, isReadOnly = false }: AbilitiesPanelProps) => {
  const beast = character.wildShape?.currentBeast
  const physicalAbilities: AbilityType[] = ["strength", "dexterity", "constitution"]

  // Compute beast ability score if applicable
  // Per SRD 5.2: You retain your saving throw proficiencies and use your Proficiency Bonus
  const computeBeastAbility = (ability: AbilityType, beastScore: number): AbilityScore => {
    const beastMod = Math.floor((beastScore - 10) / 2)
    const charProficient = character.abilityScores[ability].proficient
    return {
      score: beastScore,
      modifier: beastMod,
      savingThrow: beastMod + (charProficient ? character.proficiencyBonus : 0),
      proficient: charProficient,
    }
  }

  // Build display abilities, using beast's physical stats when transformed
  const displayAbilities: Record<AbilityType, AbilityScore & { fromBeast: boolean }> = {} as Record<
    AbilityType,
    AbilityScore & { fromBeast: boolean }
  >

  for (const ability of Abilities) {
    const isPhysical = physicalAbilities.includes(ability)
    if (beast && isPhysical) {
      displayAbilities[ability] = {
        ...computeBeastAbility(ability, beast.abilities[ability]),
        fromBeast: true,
      }
    } else {
      displayAbilities[ability] = {
        ...character.abilityScores[ability],
        fromBeast: false,
      }
    }
  }

  return (
    <div class="accordion-body" id="abilities-panel" {...(swapOob && { "hx-swap-oob": "true" })}>
      {beast && (
        <div class="alert alert-warning py-2 mb-3">
          <small>
            <i class="bi bi-info-circle me-1"></i>
            Physical abilities (STR, DEX, CON) are from <strong>{beast.name}</strong> form.
          </small>
        </div>
      )}
      {!isReadOnly && (
        <div class="d-flex justify-content-end gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/edit/abilities`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-pencil"></i> Edit Abilities
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/history/abilities`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-clock-history"></i> History
          </button>
        </div>
      )}
      <div class="row row-cols-3 g-2">
        {Abilities.map((ability) => {
          const abilityScore = displayAbilities[ability]
          return (
            <AbilityBox
              ability={ability}
              score={abilityScore.score}
              modifier={abilityScore.modifier}
              savingThrow={abilityScore.savingThrow}
              proficient={abilityScore.proficient}
              hasEffect={
                !abilityScore.fromBeast && hasEffect(ability, character.affectedAttributes)
              }
              effectTooltip={
                !abilityScore.fromBeast
                  ? getEffectTooltip(ability, character.affectedAttributes) || undefined
                  : undefined
              }
              fromBeast={abilityScore.fromBeast}
            />
          )
        })}
      </div>
    </div>
  )
}
