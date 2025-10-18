import { SpellSlotsDisplay } from "@src/components/ui/SpellSlotsDisplay"
import type { SpellLevelType, SpellSlotsType } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import clsx from "clsx"

export interface SpellSlotsEditFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const SpellSlotsEditForm = ({ character, values, errors }: SpellSlotsEditFormProps) => {
  const allSlots = character.spellSlots
  const availableSlots = character.availableSpellSlots
  // Determine default action based on current state
  let defaultAction = "use"
  if (allSlots && availableSlots) {
    let hasUsedSlots = false
    for (let level = 1; level <= 9; level++) {
      const total = allSlots[level as keyof SpellSlotsType] || 0
      const available = availableSlots[level as keyof SpellSlotsType] || 0
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
  const slotLevel = values?.slot_level ? (parseInt(values.slot_level, 10) as SpellLevelType) : null

  // Calculate preview slots
  const previewAvailable = [...availableSlots]

  // Preview: use one slot
  if (action === "use" && slotLevel) {
    const idx = previewAvailable.indexOf(slotLevel)
    if (idx !== -1) previewAvailable.splice(idx, 1)

    // Preview: restore one slot
  } else if (action === "restore" && slotLevel) {
    const currentCount = previewAvailable.filter((lvl) => lvl === slotLevel).length
    const maxCount = allSlots.filter((lvl) => lvl === slotLevel).length
    if (currentCount < maxCount) previewAvailable.push(slotLevel)
  }

  const showPreview = (action === "use" || action === "restore") && slotLevel

  // Get available slot levels for dropdowns
  const availableLevels: { value: SpellLevelType; label: string }[] = []
  const usedLevels: { value: SpellLevelType; label: string }[] = []

  for (let level = 1; level <= 9; level++) {
    const lvlMax = allSlots.filter((lvl) => lvl === level).length
    const available = availableSlots.filter((lvl) => lvl === level).length
    if (available > 0) {
      availableLevels.push({
        value: level as SpellLevelType,
        label: `Level ${level} (${available} available)`,
      })
    }
    if (available < lvlMax) {
      usedLevels.push({
        value: level as SpellLevelType,
        label: `Level ${level} (${lvlMax - available} of ${lvlMax} used)`,
      })
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
          hx-post={`/characters/${character.id}/edit/spellslots`}
          hx-vals='{"is_check": "true"}'
          hx-trigger="change delay:300ms"
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Current Spell Slots */}
          <div class="mb-3">
            <div class="form-label">Current Spell Slots</div>
            <SpellSlotsDisplay allSlots={allSlots} availableSlots={availableSlots} />
          </div>

          {/* Action: Use or Restore */}
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
            </fieldset>
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
                {availableLevels.map(({ value, label }) => (
                  <option key={value} value={value} selected={slotLevel === value}>
                    {label}
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
                {usedLevels.map(({ value, label }) => (
                  <option key={value} value={value} selected={slotLevel === value}>
                    {label}
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
              <div class="form-label">Preview</div>
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
              hx-post={`/characters/${character.id}/edit/spellslots`}
              hx-vals='{"is_check": "false"}'
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
