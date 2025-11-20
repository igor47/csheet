import { HitPointsBar } from "@src/components/ui/HitPointsBar"
import { ignoreCheckEmptyErrors } from "@src/lib/formErrors"
import clsx from "clsx"

export interface HitPointsEditFormProps {
  characterId: string
  currentHP: number
  maxHitPoints: number
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const HitPointsEditForm = ({
  characterId,
  currentHP,
  maxHitPoints,
  values = {},
  errors = {},
}: HitPointsEditFormProps) => {
  const action = values?.action || (currentHP >= maxHitPoints ? "lose" : "restore")
  const amount = values?.amount ? parseInt(values.amount, 10) : 0

  // Calculate preview HP
  let previewHP = currentHP
  if (amount > 0) {
    if (action === "restore") {
      previewHP = Math.min(currentHP + amount, maxHitPoints)
    } else {
      previewHP = Math.max(currentHP - amount, 0)
    }
  }

  const showPreview = amount > 0 && !errors?.amount
  errors = ignoreCheckEmptyErrors(values, errors)

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Edit Hit Points</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form
          id="hp-edit-form"
          hx-post={`/characters/${characterId}/edit/hitpoints`}
          hx-vals='{"is_check": "true"}'
          hx-trigger="change"
          hx-target="#editModalContent"
          hx-swap="morph:innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Current HP */}
          <div class="mb-3">
            <p class="mb-2">Current Hit Points</p>
            <HitPointsBar currentHP={currentHP} maxHitPoints={maxHitPoints} />
          </div>

          {/* Action: Restore or Lose */}
          <div class="mb-3">
            <label class="form-label" for="action">
              Action
            </label>
            <fieldset class="btn-group w-100">
              <input
                type="radio"
                class="btn-check"
                name="action"
                id="hitpoints-action-restore"
                value="restore"
                checked={action === "restore"}
                disabled={currentHP >= maxHitPoints}
                autocomplete="off"
              />
              <label class="btn btn-outline-success" for="hitpoints-action-restore">
                Restore Hit Points
              </label>

              <input
                type="radio"
                class="btn-check"
                name="action"
                id="hitpoints-action-lose"
                value="lose"
                checked={action === "lose"}
                disabled={currentHP <= 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-danger" for="hitpoints-action-lose">
                Lose Hit Points
              </label>
            </fieldset>
          </div>

          {/* Amount */}
          <div class="mb-3">
            <label for="hitpoints-amount" class="form-label">
              Amount
            </label>
            <input
              type="number"
              class={clsx("form-control", { "is-invalid": errors?.amount })}
              id="hitpoints-amount"
              name="amount"
              value={values?.amount || ""}
              min="1"
              required
              placeholder="Enter amount"
            />
            {errors?.amount && <div class="invalid-feedback d-block">{errors.amount}</div>}
          </div>

          {/* Preview */}
          {showPreview && (
            <div class="mb-3">
              <p class="mb-2">Preview</p>
              <HitPointsBar currentHP={previewHP} maxHitPoints={maxHitPoints} />
              <small class="form-text text-muted">
                {action === "restore" ? "Restoring" : "Losing"} {amount} HP: {currentHP} →{" "}
                {previewHP}
              </small>
            </div>
          )}

          {/* Note */}
          <div class="mb-3">
            <label for="hitpoints-note" class="form-label">
              Note (Optional)
            </label>
            <textarea
              class="form-control"
              id="hitpoints-note"
              name="note"
              rows={2}
              placeholder="Add a note about this HP change..."
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
              class="btn btn-primary"
              hx-vals='{"is_check": "false"}'
              hx-post={`/characters/${characterId}/edit/hitpoints`}
              hx-target="#editModalContent"
              hx-swap="morph:innerHTML"
            >
              Update Hit Points
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
