import { HitPointsBar } from "@src/components/ui/HitPointsBar"
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
  values,
  errors,
}: HitPointsEditFormProps) => {
  const action = values?.action || (currentHP >= maxHitPoints ? "lose" : "restore")
  const amount = values?.amount ? parseInt(values.amount) : 0

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

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Edit Hit Points</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form
          id="hp-edit-form"
          hx-post={`/characters/${characterId}/edit/hitpoints/check`}
          hx-trigger="change delay:300ms"
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Current HP */}
          <div class="mb-3">
            <label class="form-label">Current Hit Points</label>
            <HitPointsBar currentHP={currentHP} maxHitPoints={maxHitPoints} />
          </div>

          {/* Action: Restore or Lose */}
          <div class="mb-3">
            <label class="form-label">Action</label>
            <div class="btn-group w-100" role="group">
              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-restore"
                value="restore"
                checked={action === "restore"}
                disabled={currentHP >= maxHitPoints}
                autocomplete="off"
              />
              <label class="btn btn-outline-success" for="action-restore">
                Restore Hit Points
              </label>

              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-lose"
                value="lose"
                checked={action === "lose"}
                disabled={currentHP <= 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-danger" for="action-lose">
                Lose Hit Points
              </label>
            </div>
          </div>

          {/* Amount */}
          <div class="mb-3">
            <label for="amount" class="form-label">
              Amount
            </label>
            <input
              type="number"
              class={clsx("form-control", { "is-invalid": errors?.amount })}
              id="amount"
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
              <label class="form-label">Preview</label>
              <HitPointsBar currentHP={previewHP} maxHitPoints={maxHitPoints} />
              <small class="form-text text-muted">
                {action === "restore" ? "Restoring" : "Losing"} {amount} HP: {currentHP} →{" "}
                {previewHP}
              </small>
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
              placeholder="Add a note about this HP change..."
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
              hx-post={`/characters/${characterId}/edit/hitpoints`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
            >
              Update Hit Points
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
