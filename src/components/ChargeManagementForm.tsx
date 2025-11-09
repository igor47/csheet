import type { EquippedComputedItem } from "@src/services/computeCharacterItems"
import clsx from "clsx"

export interface ChargeManagementFormProps {
  characterId: string
  item: EquippedComputedItem
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const ChargeManagementForm = ({
  characterId,
  item,
  values,
  errors,
}: ChargeManagementFormProps) => {
  const action = values?.action || "use"
  const amount = values?.amount ? parseInt(values.amount, 10) : 0
  const override = values?.override === "true"

  const chargeLabel = item.chargeLabel === "ammunition" ? "Ammunition" : "Charges"
  const currentCharges = item.currentCharges

  // Calculate preview charges
  let previewCharges = currentCharges
  if (amount > 0) {
    if (action === "add") {
      previewCharges = currentCharges + amount
    } else {
      previewCharges = Math.max(currentCharges - amount, 0)
    }
  }

  const showPreview = amount > 0 && !errors?.amount
  const isEquipped = item.worn || item.wielded

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">
          Manage {chargeLabel}: {item.name}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form
          id="charge-edit-form"
          hx-post={`/characters/${characterId}/items/${item.id}/charges`}
          hx-vals='{"is_check": "true"}'
          hx-trigger="change"
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Hidden item_id field */}
          <input type="hidden" name="item_id" value={item.id} />

          {/* Current Charges */}
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-muted">Current {chargeLabel}:</span>
              <span class="badge bg-primary fs-5">{currentCharges}</span>
            </div>
          </div>

          {/* Action: Use or Add */}
          <div class="mb-3">
            <label class="form-label" for="action">
              Action
            </label>
            <fieldset class="btn-group w-100">
              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-use"
                value="use"
                checked={action === "use"}
                disabled={currentCharges === 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-danger" for="action-use">
                Use {chargeLabel}
              </label>

              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-add"
                value="add"
                checked={action === "add"}
                autocomplete="off"
              />
              <label class="btn btn-outline-success" for="action-add">
                Add {chargeLabel}
              </label>
            </fieldset>
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

          {/* Override checkbox - only show for "use" action and not equipped */}
          {action === "use" && !isEquipped && (
            <div class="mb-3">
              <div class="form-check">
                <input
                  type="checkbox"
                  class="form-check-input"
                  id="override"
                  name="override"
                  value="true"
                  checked={override}
                />
                <label class="form-check-label" for="override">
                  Use anyway (item not equipped)
                </label>
              </div>
              {errors?.override && <div class="text-danger small mt-1">{errors.override}</div>}
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div class="mb-3">
              <div class="form-label">Preview</div>
              <div class="d-flex justify-content-between align-items-center border border-primary rounded p-2">
                <span class="text-muted">
                  {action === "add" ? "Adding" : "Using"} {amount}:
                </span>
                <span>
                  {currentCharges} → <strong>{previewCharges}</strong>
                </span>
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
              placeholder={`Add a note about this ${chargeLabel.toLowerCase()} change...`}
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
              hx-post={`/characters/${characterId}/items/${item.id}/charges`}
              hx-vals='{"is_check": "false"}'
              hx-target="#editModalContent"
              hx-swap="innerHTML"
            >
              Update {chargeLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
