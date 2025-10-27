import { ModalContent } from "@src/components/ui/ModalContent"
import { Select } from "@src/components/ui/Select"
import type { ItemEffect } from "@src/db/item_effects"
import { ItemEffectOps, ItemEffectTargets } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { EquippedComputedItem } from "@src/services/computeCharacterItems"
import { clsx } from "clsx"

export interface ItemEffectsEditorProps {
  character: ComputedCharacter
  item: EquippedComputedItem
  effects: ItemEffect[]
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const ItemEffectsEditor = ({
  character,
  item,
  effects,
  values = {},
  errors = {},
}: ItemEffectsEditorProps) => {
  const selectedOp = values.op || ""
  const showValueField = selectedOp === "add" || selectedOp === "set"

  // Default to "always" (empty string) if both worn/wielded are disabled
  // Otherwise default to worn if wearable, wielded if wieldable, or always if neither
  let defaultApplies = ""
  if (item.wearable) defaultApplies = "worn"
  else if (item.wieldable) defaultApplies = "wielded"

  const selectedApplies = values.applies !== undefined ? values.applies : defaultApplies

  // Pre-compute option arrays for selects
  const targetOptions = ItemEffectTargets.map((target) => ({
    value: target,
    label: target.charAt(0).toUpperCase() + target.slice(1),
  }))

  const opOptions = ItemEffectOps.map((op) => ({
    value: op,
    label: op.charAt(0).toUpperCase() + op.slice(1),
  }))

  return (
    <ModalContent title={`Effects: ${item.name}`}>
      <div class="modal-body">
        {/* General error message */}
        {errors.general && (
          <div class="alert alert-danger" role="alert">
            {errors.general}
          </div>
        )}

        {/* Current Effects List */}
        <div class="mb-4">
          <h6 class="mb-3">Current Effects</h6>
          {effects.length === 0 ? (
            <p class="text-muted small">No effects configured.</p>
          ) : (
            <div class="list-group">
              {effects.map((effect) => (
                <div class="list-group-item d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="fw-bold text-capitalize">{effect.target}</div>
                    <div class="small text-muted">
                      <span class="text-capitalize">{effect.op}</span>
                      {effect.value !== null && <span> {effect.value}</span>}
                      {" · "}
                      <span class="text-capitalize">
                        {effect.applies === null ? "Always active" : `When ${effect.applies}`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    hx-delete={`/characters/${character.id}/items/${item.id}/effects/${effect.id}`}
                    hx-target="#editModalContent"
                    hx-swap="innerHTML"
                    hx-confirm="Are you sure you want to delete this effect?"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr />

        {/* Add New Effect Form */}
        <div>
          <h6 class="mb-3">Add New Effect</h6>
          <form
            id="add-effect-form"
            hx-post={`/characters/${character.id}/items/${item.id}/effects`}
            hx-vals='{"is_check": "true"}'
            hx-trigger="change"
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            {/* Target */}
            <div class="mb-3">
              <label for="effect-target" class="form-label">
                Target <span class="text-danger">*</span>
              </label>
              <Select
                id="effect-target"
                name="target"
                placeholder="Select target..."
                options={targetOptions}
                value={values.target}
                error={errors.target}
              />
              <div class="form-text">What attribute or skill to modify</div>
            </div>

            {/* Operation */}
            <div class="mb-3">
              <label for="effect-op" class="form-label">
                Operation <span class="text-danger">*</span>
              </label>
              <Select
                id="effect-op"
                name="op"
                placeholder="Select operation..."
                options={opOptions}
                value={values.op}
                error={errors.op}
              />
              <div class="form-text">How to modify the target</div>
            </div>

            {/* Value - only shown for add/set operations */}
            {showValueField && (
              <div class="mb-3">
                <label for="effect-value" class="form-label">
                  Value <span class="text-danger">*</span>
                </label>
                <input
                  type="number"
                  class={clsx("form-control", { "is-invalid": errors.value })}
                  id="effect-value"
                  name="value"
                  value={values.value || ""}
                  placeholder={selectedOp === "add" ? "e.g., 2 for +2" : "e.g., 15"}
                />
                {errors.value && <div class="invalid-feedback d-block">{errors.value}</div>}
                <div class="form-text">
                  {selectedOp === "add"
                    ? "Amount to add (can be negative)"
                    : "Value to set the target to"}
                </div>
              </div>
            )}

            {/* Applies - when the effect is active */}
            <fieldset class="mb-3">
              <legend class="form-label">Active When</legend>
              <div class="d-flex gap-3 flex-wrap">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="applies"
                    id="effect-applies-always"
                    value=""
                    checked={selectedApplies === ""}
                  />
                  <label class="form-check-label" for="effect-applies-always">
                    Always
                  </label>
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="applies"
                    id="effect-applies-worn"
                    value="worn"
                    checked={selectedApplies === "worn"}
                    disabled={!item.wearable}
                  />
                  <label
                    class={clsx("form-check-label", { "text-muted": !item.wearable })}
                    for="effect-applies-worn"
                  >
                    Worn
                  </label>
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="applies"
                    id="effect-applies-wielded"
                    value="wielded"
                    checked={selectedApplies === "wielded"}
                    disabled={!item.wieldable}
                  />
                  <label
                    class={clsx("form-check-label", { "text-muted": !item.wieldable })}
                    for="effect-applies-wielded"
                  >
                    Wielded
                  </label>
                </div>
              </div>
              {errors.applies && <div class="text-danger small mt-1">{errors.applies}</div>}
              {!item.wearable && !item.wieldable && (
                <div class="form-text">This item cannot be worn or wielded</div>
              )}
              {item.wearable && !item.wieldable && (
                <div class="form-text">This item can be worn but not wielded</div>
              )}
              {!item.wearable && item.wieldable && (
                <div class="form-text">This item can be wielded but not worn</div>
              )}
            </fieldset>

            {/* Submit Button */}
            <div class="d-grid">
              <button
                type="submit"
                class="btn btn-primary"
                hx-post={`/characters/${character.id}/items/${item.id}/effects`}
                hx-vals='{"is_check": "false"}'
                hx-target="#editModalContent"
                hx-swap="innerHTML"
              >
                <i class="bi bi-plus-circle"></i> Add Effect
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer with Close button */}
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </ModalContent>
  )
}
