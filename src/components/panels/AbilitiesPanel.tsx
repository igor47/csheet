import { Abilities, type AbilityType } from "@src/lib/dnd"
import { getEffectTooltip, hasEffect } from "@src/lib/effectTooltip"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

interface AbilityBoxProps {
  ability: AbilityType
  score: number
  modifier: number
  savingThrow: number
  proficient: boolean
  hasEffect?: boolean
  effectTooltip?: string
}

const AbilityBox = ({
  ability,
  score,
  modifier,
  savingThrow,
  proficient,
  hasEffect = false,
  effectTooltip,
}: AbilityBoxProps) => {
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)
  const abilityNameClass = clsx("fw-medium text-uppercase border", {
    "bg-primary-subtle": proficient,
    "bg-dark-subtle": !proficient,
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
}

export const AbilitiesPanel = ({ character, swapOob }: AbilitiesPanelProps) => {
  return (
    <div class="accordion-body" id="abilities-panel" hx-swap-oob={swapOob && "true"}>
      <div class="d-flex justify-content-end gap-2 mb-3">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          hx-get={`/characters/${character.id}/edit/abilities`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
        >
          <i class="bi bi-pencil"></i> Edit Abilities
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          hx-get={`/characters/${character.id}/history/abilities`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
        >
          <i class="bi bi-clock-history"></i> History
        </button>
      </div>
      <div class="row row-cols-3 g-2">
        {Abilities.map((ability) => {
          const abilityScore = character.abilityScores[ability]
          return (
            <AbilityBox
              ability={ability}
              score={abilityScore.score}
              modifier={abilityScore.modifier}
              savingThrow={abilityScore.savingThrow}
              proficient={abilityScore.proficient}
              hasEffect={hasEffect(ability, character.affectedAttributes)}
              effectTooltip={getEffectTooltip(ability, character.affectedAttributes) || undefined}
            />
          )
        })}
      </div>
    </div>
  )
}
