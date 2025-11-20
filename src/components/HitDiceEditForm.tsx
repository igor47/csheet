import { HitDiceDisplay } from "@src/components/ui/HitDiceDisplay"
import type { HitDieType } from "@src/lib/dnd"
import { ignoreCheckEmptyErrors } from "@src/lib/formErrors"
import clsx from "clsx"

export interface HitDiceEditFormProps {
  characterId: string
  allHitDice: HitDieType[]
  availableHitDice: HitDieType[]
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const HitDiceEditForm = ({
  characterId,
  allHitDice,
  availableHitDice,
  values = {},
  errors = {},
}: HitDiceEditFormProps) => {
  const action =
    values?.action || (availableHitDice.length < allHitDice.length ? "restore" : "spend")
  const dieValue = values?.die_value ? parseInt(values.die_value, 10) : null
  const hpRolled = values?.hp_rolled ? parseInt(values.hp_rolled, 10) : null

  // Calculate preview dice
  const previewAvailable = [...availableHitDice]

  if (action === "restore" && dieValue) {
    // Preview: restore one die
    previewAvailable.push(dieValue as HitDieType)
  } else if (action === "spend" && dieValue) {
    // Preview: spend the selected die
    const index = previewAvailable.indexOf(dieValue as HitDieType)
    if (index !== -1) {
      previewAvailable.splice(index, 1)
    }
  }

  const showPreview = (action === "restore" || action === "spend") && dieValue

  // Get unique available die types for dropdown (for spending)
  const uniqueAvailableDice = Array.from(new Set(availableHitDice)).sort((a, b) => a - b)

  // Get unique used die types for dropdown (for restoring)
  const usedDice = [...allHitDice]
  for (const die of availableHitDice) {
    const index = usedDice.indexOf(die)
    if (index !== -1) {
      usedDice.splice(index, 1)
    }
  }
  const uniqueUsedDice = Array.from(new Set(usedDice)).sort((a, b) => a - b)

  errors = ignoreCheckEmptyErrors(values, errors)

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Edit Hit Dice</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form
          id="hitdice-edit-form"
          hx-post={`/characters/${characterId}/edit/hitdice`}
          hx-vals='{"is_check": "true"}'
          hx-trigger="change"
          hx-target="#editModalContent"
          hx-swap="morph:innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Current Hit Dice */}
          <div class="mb-3">
            <p class="mb-2">Current Hit Dice</p>
            <HitDiceDisplay allHitDice={allHitDice} availableHitDice={availableHitDice} />
          </div>

          {/* Action: Restore or Spend */}
          <div class="mb-3">
            <label class="form-label" for="action">
              Action
            </label>
            <fieldset class="btn-group w-100">
              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-restore"
                value="restore"
                checked={action === "restore"}
                disabled={uniqueUsedDice.length === 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-success" for="action-restore">
                Restore Die
              </label>

              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-spend"
                value="spend"
                checked={action === "spend"}
                disabled={availableHitDice.length === 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-danger" for="action-spend">
                Spend Hit Die
              </label>
            </fieldset>
          </div>

          {/* Restore: Die selection */}
          {action === "restore" && (
            <div class="mb-3">
              <label for="hitdice-die-value" class="form-label">
                Select Die to Restore
              </label>
              <select
                class={clsx("form-select", { "is-invalid": errors?.die_value })}
                id="hitdice-die-value"
                name="die_value"
                required
              >
                <option value="">Choose a die...</option>
                {uniqueUsedDice.map((die) => (
                  <option key={die} value={die} selected={dieValue === die}>
                    D{die}
                  </option>
                ))}
              </select>
              {errors?.die_value && <div class="invalid-feedback d-block">{errors.die_value}</div>}
            </div>
          )}

          {/* Spend: Die selection and HP rolled */}
          {action === "spend" && (
            <>
              <div class="mb-3">
                <label for="hitdice-die-value" class="form-label">
                  Select Die to Spend
                </label>
                <select
                  class={clsx("form-select", { "is-invalid": errors?.die_value })}
                  id="hitdice-die-value"
                  name="die_value"
                  required
                >
                  <option value="">Choose a die...</option>
                  {uniqueAvailableDice.map((die) => (
                    <option key={die} value={die} selected={dieValue === die}>
                      D{die}
                    </option>
                  ))}
                </select>
                {errors?.die_value && (
                  <div class="invalid-feedback d-block">{errors.die_value}</div>
                )}
              </div>

              {dieValue && (
                <div class="mb-3">
                  <label for="hitdice-hp-rolled" class="form-label">
                    HP Rolled (1-{dieValue})
                  </label>
                  <input
                    type="number"
                    class={clsx("form-control", { "is-invalid": errors?.hp_rolled })}
                    id="hitdice-hp-rolled"
                    name="hp_rolled"
                    value={values?.hp_rolled || ""}
                    min="1"
                    max={dieValue}
                    required
                    placeholder="Enter HP rolled"
                  />
                  <small class="form-text text-muted">
                    Roll D{dieValue} to determine HP restored
                  </small>
                  {errors?.hp_rolled && (
                    <div class="invalid-feedback d-block">{errors.hp_rolled}</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Preview */}
          {showPreview && (
            <div class="mb-3">
              <p class="mb-2">Preview</p>
              <HitDiceDisplay allHitDice={allHitDice} availableHitDice={previewAvailable} />
              <small class="form-text text-muted">
                {action === "restore"
                  ? `Restoring D${dieValue}`
                  : `Spending D${dieValue}${hpRolled ? ` (restoring ${hpRolled} HP)` : ""}`}
              </small>
            </div>
          )}

          {/* Note */}
          <div class="mb-3">
            <label for="hitdice-note" class="form-label">
              Note (Optional)
            </label>
            <textarea
              class="form-control"
              id="hitdice-note"
              name="note"
              rows={2}
              placeholder="Add a note about this hit dice change..."
            >
              {values?.note || ""}
            </textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="submit"
              id="hitdice-edit-submit"
              class="btn btn-primary"
              hx-vals='{"is_check": "false"}'
              hx-post={`/characters/${characterId}/edit/hitdice`}
              hx-target="#editModalContent"
              hx-swap="morph:innerHTML"
              hx-sync="closest form:replace"
            >
              Update Hit Dice
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
