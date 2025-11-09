import { Abilities, type AbilityType } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import clsx from "clsx"
import { ModalContent } from "./ui/ModalContent"

export interface AbilitiesEditFormProps {
  character: ComputedCharacter
  values: Record<string, string>
  errors: Record<string, string>
}

interface AbilityEditBoxProps {
  ability: AbilityType
  character: ComputedCharacter
  values: Record<string, string>
  errors: Record<string, string>
}

const AbilityEditBox = ({ ability, character, values, errors }: AbilityEditBoxProps) => {
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2)
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  const scoreFieldName = `${ability}_score`
  const proficientFieldName = `${ability}_proficient`

  const abilityScore = character.abilityScores[ability]
  const currentScore = abilityScore.score
  const currentProficient = abilityScore.proficient
  const proficiencyBonus = character.proficiencyBonus

  // Parse form values (all come as strings)
  const scoreValue = values[scoreFieldName]
  const newScore = scoreValue ? parseInt(scoreValue, 10) : currentScore

  // Checkbox: if field exists in values, it's "on" (checked), otherwise it's unchecked
  const newProficient =
    proficientFieldName in values ? values[proficientFieldName] === "on" : currentProficient

  const changed = newScore !== currentScore || newProficient !== currentProficient

  return (
    <div class="col">
      <div
        class={clsx("border rounded p-2 border-2", {
          "border-primary": changed,
        })}
      >
        {/* Ability Name */}
        <div
          class={clsx("fw-medium text-uppercase text-center border mb-2", {
            "bg-primary-subtle": currentProficient,
            "bg-dark-subtle": !currentProficient,
          })}
          style="font-size: 0.7rem;"
        >
          {ability}
        </div>

        {/* Score Input */}
        <div class="mb-2">
          <label for={scoreFieldName} class="form-label form-label-sm mb-1">
            Score
          </label>
          <input
            type="number"
            class={clsx("form-control form-control-sm", {
              "is-invalid": errors[scoreFieldName],
              "border-primary": changed,
            })}
            id={scoreFieldName}
            name={scoreFieldName}
            value={values[scoreFieldName] ?? String(currentScore)}
            min="1"
            max="30"
            required
          />
          {errors[scoreFieldName] && (
            <div class="invalid-feedback d-block" style="font-size: 0.7rem;">
              {errors[scoreFieldName]}
            </div>
          )}
        </div>

        {/* Proficiency Checkbox */}
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id={proficientFieldName}
            name={proficientFieldName}
            checked={newProficient}
          />
          <label class="form-check-label" for={proficientFieldName} style="font-size: 0.8rem;">
            Proficient
          </label>
        </div>

        {/* Preview (when changed) */}
        {changed && (
          <div class="mt-2 pt-2 border-top">
            <div class="text-muted text-center" style="font-size: 0.65rem;">
              Preview
            </div>
            <div class="d-flex justify-content-around" style="font-size: 0.75rem;">
              <div class="text-center">
                <div class="text-muted" style="font-size: 0.6rem;">
                  MOD
                </div>
                <div class="fw-bold">{formatModifier(calculateModifier(newScore))}</div>
              </div>
              <div class="text-center">
                <div class="text-muted" style="font-size: 0.6rem;">
                  SAVE
                </div>
                <div class="fw-bold">
                  {formatModifier(
                    calculateModifier(newScore) + (newProficient ? proficiencyBonus : 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export const AbilitiesEditForm = ({ character, values, errors = {} }: AbilitiesEditFormProps) => {
  return (
    <ModalContent title="Edit Abilities">
      <form
        id="abilities-edit-form"
        hx-post={`/characters/${character.id}/edit/abilities`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        <div class="modal-body">
          <div class="row row-cols-3 g-3 mb-3">
            {Abilities.map((ability) => (
              <AbilityEditBox
                ability={ability}
                character={character}
                values={values}
                errors={errors}
              />
            ))}
          </div>

          {/* Note */}
          <div class="mb-3">
            <label for="note" class="form-label">
              Note (Optional)
            </label>
            <textarea
              class="form-control"
              id="note"
              name="note"
              rows={2}
              placeholder="Add a note about these ability changes..."
              value={values.note ?? ""}
            />
          </div>

          {/* General Errors */}
          {errors.general && (
            <div class="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/abilities`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            Update Abilities
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
