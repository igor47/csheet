import type { AbilityType } from "@src/lib/dnd"
import clsx from "clsx"

export interface AbilityEditFormProps {
  characterId: string
  ability: AbilityType
  currentScore: number
  currentModifier: number
  isProficient: boolean
  proficiencyBonus: number
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const AbilityEditForm = ({
  characterId,
  ability,
  currentScore,
  currentModifier,
  isProficient,
  proficiencyBonus,
  values,
  errors,
}: AbilityEditFormProps) => {
  const newScore = values?.score ? parseInt(values.score, 10) : currentScore
  const proficiencyChange = values?.proficiency_change || "none"

  // Calculate new modifier
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2)
  const newModifier = calculateModifier(newScore)
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  // Calculate new proficiency state
  let newProficient = isProficient
  if (proficiencyChange === "add") newProficient = true
  if (proficiencyChange === "remove") newProficient = false

  // Calculate preview saving throw modifier
  const newSavingThrow = newProficient ? newModifier + proficiencyBonus : newModifier
  const currentSavingThrow = isProficient ? currentModifier + proficiencyBonus : currentModifier

  const showPreview =
    (values?.score && parseInt(values.score, 10) !== currentScore) || proficiencyChange !== "none"

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Edit {ability.charAt(0).toUpperCase() + ability.slice(1)}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form
          id="ability-edit-form"
          hx-post={`/characters/${characterId}/edit/${ability}/check`}
          hx-trigger="change delay:300ms"
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Current Ability Display */}
          <div class="mb-3">
            <div class="form-label">Current</div>
            <div class="border rounded p-2 text-center" style="max-width: 150px; margin: 0 auto;">
              <div
                class={clsx("fw-medium text-uppercase border", {
                  "bg-primary-subtle": isProficient,
                  "bg-dark-subtle": !isProficient,
                })}
                style="font-size: 0.7rem;"
              >
                {ability}
              </div>
              <div class="fw-bold p-2">
                <span class="fs-4">{formatModifier(currentSavingThrow)}</span>
              </div>
              <div
                class="rounded-circle bg-secondary-subtle border d-flex align-items-center justify-content-center mx-auto fw-bold"
                style="width: 40px; height: 40px; font-size: 0.85rem;"
              >
                {currentScore}
              </div>
            </div>
          </div>

          {/* New Score Input */}
          <div class="mb-3">
            <label for="score" class="form-label">
              New Score (1-30)
            </label>
            <input
              type="number"
              class={clsx("form-control", { "is-invalid": errors?.score })}
              id="score"
              name="score"
              value={values?.score || currentScore}
              min="1"
              max="30"
              required
            />
            {errors?.score && <div class="invalid-feedback d-block">{errors.score}</div>}
          </div>

          {/* Proficiency Change */}
          <div class="mb-3">
            <label class="form-label" for="proficiency_change">
              Saving Throw Proficiency
            </label>
            <fieldset class="btn-group w-100">
              <input
                type="radio"
                class="btn-check"
                name="proficiency_change"
                id="prof-none"
                value="none"
                checked={proficiencyChange === "none"}
                autocomplete="off"
              />
              <label class="btn btn-outline-secondary" for="prof-none">
                No Change
              </label>

              {!isProficient && (
                <>
                  <input
                    type="radio"
                    class="btn-check"
                    name="proficiency_change"
                    id="prof-add"
                    value="add"
                    checked={proficiencyChange === "add"}
                    autocomplete="off"
                  />
                  <label class="btn btn-outline-success" for="prof-add">
                    Add Proficiency
                  </label>
                </>
              )}

              {isProficient && (
                <>
                  <input
                    type="radio"
                    class="btn-check"
                    name="proficiency_change"
                    id="prof-remove"
                    value="remove"
                    checked={proficiencyChange === "remove"}
                    autocomplete="off"
                  />
                  <label class="btn btn-outline-danger" for="prof-remove">
                    Remove Proficiency
                  </label>
                </>
              )}
            </fieldset>
            {errors?.proficiency_change && (
              <div class="invalid-feedback d-block">{errors.proficiency_change}</div>
            )}
          </div>

          {/* Preview */}
          {showPreview && (
            <div class="mb-3">
              <div class="form-label">Preview</div>
              <div class="border rounded p-2 text-center" style="max-width: 150px; margin: 0 auto;">
                <div
                  class={clsx("fw-medium text-uppercase border", {
                    "bg-primary-subtle": newProficient,
                    "bg-dark-subtle": !newProficient,
                  })}
                  style="font-size: 0.7rem;"
                >
                  {ability}
                </div>
                <div class="fw-bold p-2">
                  <span class="fs-4">{formatModifier(newSavingThrow)}</span>
                </div>
                <div
                  class="rounded-circle bg-secondary-subtle border d-flex align-items-center justify-content-center mx-auto fw-bold"
                  style="width: 40px; height: 40px; font-size: 0.85rem;"
                >
                  {newScore}
                </div>
              </div>
            </div>
          )}

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
              placeholder="Add a note about this ability change..."
              value={values?.note || ""}
            />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              hx-post={`/characters/${characterId}/edit/${ability}`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
            >
              Update Ability
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
