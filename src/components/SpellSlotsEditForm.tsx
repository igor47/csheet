import { SpellSlotsDisplay } from "@src/components/ui/SpellSlotsDisplay"
import type { SlotsBySpellLevel } from "@src/lib/dnd"
import clsx from "clsx"

export interface SpellSlotsEditFormProps {
  characterId: string
  allSlots: SlotsBySpellLevel | null
  availableSlots: SlotsBySpellLevel | null
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const SpellSlotsEditForm = ({
  characterId,
  allSlots,
  availableSlots,
  values,
  errors,
}: SpellSlotsEditFormProps) => {
  // Determine default action based on current state
  let defaultAction = "use"
  if (allSlots && availableSlots) {
    let hasUsedSlots = false
    for (let level = 1; level <= 9; level++) {
      const total = allSlots[level as keyof SlotsBySpellLevel] || 0
      const available = availableSlots[level as keyof SlotsBySpellLevel] || 0
      if (available < total) {
        hasUsedSlots = true
        break
      }
    }
    if (hasUsedSlots) {
      defaultAction = "restore"
    }
  }

  const action = values?.action || defaultAction
  const slotLevel = values?.slot_level ? parseInt(values.slot_level) : null

  // Calculate preview slots
  const previewAvailable = availableSlots ? { ...availableSlots } : {}

  if (action === "use" && slotLevel) {
    // Preview: use one slot
    const currentCount = previewAvailable[slotLevel as keyof SlotsBySpellLevel] || 0
    previewAvailable[slotLevel as keyof SlotsBySpellLevel] = Math.max(0, currentCount - 1)
  } else if (action === "restore" && slotLevel) {
    // Preview: restore one slot
    const currentCount = previewAvailable[slotLevel as keyof SlotsBySpellLevel] || 0
    const maxCount = allSlots?.[slotLevel as keyof SlotsBySpellLevel] || 0
    previewAvailable[slotLevel as keyof SlotsBySpellLevel] = Math.min(maxCount, currentCount + 1)
  }

  const showPreview = (action === "use" || action === "restore") && slotLevel

  // Get available slot levels for dropdowns
  const availableLevels: number[] = []
  const usedLevels: number[] = []

  if (allSlots && availableSlots) {
    for (let level = 1; level <= 9; level++) {
      const total = allSlots[level as keyof SlotsBySpellLevel] || 0
      const available = availableSlots[level as keyof SlotsBySpellLevel] || 0
      if (available > 0) availableLevels.push(level)
      if (available < total) usedLevels.push(level)
    }
  }

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Edit Spell Slots</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <form
          id="spellslots-edit-form"
          hx-post={`/characters/${characterId}/edit/spellslots/check`}
          hx-trigger="change delay:300ms"
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Current Spell Slots */}
          <div class="mb-3">
            <label class="form-label">Current Spell Slots</label>
            <SpellSlotsDisplay allSlots={allSlots} availableSlots={availableSlots} />
          </div>

          {/* Action: Use or Restore */}
          <div class="mb-3">
            <label class="form-label">Action</label>
            <div class="btn-group w-100" role="group">
              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-use"
                value="use"
                checked={action === "use"}
                disabled={availableLevels.length === 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-danger" for="action-use">
                Use Slot
              </label>

              <input
                type="radio"
                class="btn-check"
                name="action"
                id="action-restore"
                value="restore"
                checked={action === "restore"}
                disabled={usedLevels.length === 0}
                autocomplete="off"
              />
              <label class="btn btn-outline-success" for="action-restore">
                Restore Slot
              </label>
            </div>
          </div>

          {/* Use: Slot level selection */}
          {action === "use" && (
            <div class="mb-3">
              <label for="slot_level" class="form-label">
                Select Slot Level to Use
              </label>
              <select
                class={clsx("form-select", { "is-invalid": errors?.slot_level })}
                id="slot_level"
                name="slot_level"
                required
              >
                <option value="">Choose a slot level...</option>
                {availableLevels.map((level) => (
                  <option key={level} value={level} selected={slotLevel === level}>
                    Level {level} ({availableSlots?.[level as keyof SlotsBySpellLevel] || 0}{" "}
                    available)
                  </option>
                ))}
              </select>
              {errors?.slot_level && (
                <div class="invalid-feedback d-block">{errors.slot_level}</div>
              )}
            </div>
          )}

          {/* Restore: Slot level selection */}
          {action === "restore" && (
            <div class="mb-3">
              <label for="slot_level" class="form-label">
                Select Slot Level to Restore
              </label>
              <select
                class={clsx("form-select", { "is-invalid": errors?.slot_level })}
                id="slot_level"
                name="slot_level"
                required
              >
                <option value="">Choose a slot level...</option>
                {usedLevels.map((level) => (
                  <option key={level} value={level} selected={slotLevel === level}>
                    Level {level} (
                    {(allSlots?.[level as keyof SlotsBySpellLevel] || 0) -
                      (availableSlots?.[level as keyof SlotsBySpellLevel] || 0)}{" "}
                    used)
                  </option>
                ))}
              </select>
              {errors?.slot_level && (
                <div class="invalid-feedback d-block">{errors.slot_level}</div>
              )}
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div class="mb-3">
              <label class="form-label">Preview</label>
              <SpellSlotsDisplay allSlots={allSlots} availableSlots={previewAvailable} />
              <small class="form-text text-muted">
                {action === "use"
                  ? `Using Level ${slotLevel} spell slot`
                  : `Restoring Level ${slotLevel} spell slot`}
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
              placeholder="Add a note about this spell slot change..."
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
              hx-post={`/characters/${characterId}/edit/spellslots`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
            >
              Update Spell Slots
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
