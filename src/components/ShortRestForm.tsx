import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"

export interface ShortRestFormProps {
  character: ComputedCharacter
  values: Record<string, string>
  errors: Record<string, string>
}

export const ShortRestForm = ({ character, values, errors }: ShortRestFormProps) => {
  // Check if character is a Wizard (for Arcane Recovery)
  const wizardClass = character.classes.find((c) => c.class === "wizard")
  const hasArcaneRecovery = wizardClass && wizardClass.level >= 1

  // Calculate max spell slot level for Arcane Recovery (up to half wizard level, rounded up)
  const maxArcaneRecoveryLevel = wizardClass ? Math.min(5, Math.ceil(wizardClass.level / 2)) : 0

  // Calculate available spell slot levels for recovery (levels with used slots)
  const availableSlotLevelsForRecovery: number[] = []
  if (character.spellSlots && character.availableSpellSlots) {
    for (let level = 1; level <= maxArcaneRecoveryLevel; level++) {
      const total = character.spellSlots.filter((s) => s === level).length
      const available = character.availableSpellSlots.filter((s) => s === level).length
      if (available < total) {
        availableSlotLevelsForRecovery.push(level)
      }
    }
  }

  // Calculate currently selected slot levels total
  let selectedSlotLevelsTotal = 0
  for (let level = 1; level <= maxArcaneRecoveryLevel; level++) {
    if (values[`arcane_slot_${level}`] === "true") {
      selectedSlotLevelsTotal += level
    }
  }

  // Calculate remaining capacity for Arcane Recovery
  const maxArcaneRecoveryLevelRemaining = maxArcaneRecoveryLevel - selectedSlotLevelsTotal

  return (
    <ModalContent title="Take a Short Rest">
      <form
        id="short-rest-form"
        hx-post={`/characters/${character.id}/rest/short`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        <div class="modal-body">
          <p class="text-muted mb-3">
            A short rest requires at least 1 hour of downtime. You can spend hit dice to recover HP.
          </p>

          {/* Hit Dice Spending Section */}
          <h6 class="fw-bold mb-2">Spend Hit Dice</h6>
          <p class="small text-muted mb-2">
            Select hit dice to spend. Each die recovers HP equal to the roll + your Constitution
            modifier ({character.abilityScores.constitution.modifier >= 0 ? "+" : ""}
            {character.abilityScores.constitution.modifier}).
          </p>

          {character.availableHitDice.length > 0 ? (
            <div class="mb-3">
              {character.availableHitDice.map((die, index) => {
                const isChecked = values[`spend_die_${index}`] === String(die)
                const dieError = errors[`spend_die_${index}`]
                const rollError = errors[`roll_die_${index}`]
                return (
                  <div class="mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <div class="form-check" style="min-width: 60px">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          name={`spend_die_${index}`}
                          value={die}
                          id={`hitdie-${index}`}
                          checked={isChecked}
                        />
                        <label class="form-check-label" for={`hitdie-${index}`}>
                          d{die}
                        </label>
                      </div>
                      {isChecked && (
                        <div class="input-group input-group-sm" style="max-width: 120px">
                          <span class="input-group-text">Roll:</span>
                          <input
                            type="number"
                            class="form-control"
                            name={`roll_die_${index}`}
                            id={`roll-${index}`}
                            min="1"
                            max={die}
                            value={values[`roll_die_${index}`] || ""}
                            placeholder="roll"
                            required
                          />
                        </div>
                      )}
                    </div>
                    {dieError && <div class="invalid-feedback d-block">{dieError}</div>}
                    {rollError && <div class="invalid-feedback d-block">{rollError}</div>}
                  </div>
                )
              })}
              <small class="text-muted">
                Available: {character.availableHitDice.length} / {character.hitDice.length} hit dice
              </small>
            </div>
          ) : (
            <div class="alert alert-warning mb-3">
              <i class="bi bi-exclamation-triangle me-2"></i>
              No hit dice available to spend. Complete a long rest to restore hit dice.
            </div>
          )}

          {/* Arcane Recovery Section (Wizards only with used spell slots) */}
          {hasArcaneRecovery && availableSlotLevelsForRecovery.length > 0 && (
            <>
              <hr class="my-3" />
              <h6 class="fw-bold mb-2">Arcane Recovery</h6>
              <p class="small text-muted mb-2">
                As a Wizard, you can recover spell slots with a combined level up to{" "}
                {maxArcaneRecoveryLevel} (half your wizard level, rounded up). Maximum 5th level
                slots.
              </p>

              <div class="form-check mb-3">
                <input
                  class="form-check-input"
                  type="checkbox"
                  name="arcane_recovery"
                  value="true"
                  id="arcane-recovery-check"
                  checked={values.arcane_recovery === "true"}
                />
                <label class="form-check-label" for="arcane-recovery-check">
                  Use Arcane Recovery
                </label>
              </div>

              {values.arcane_recovery === "true" && (
                <div id="arcane-recovery-slots" class="mb-3">
                  <div class="form-label small">Select spell slot levels to recover:</div>
                  {Array.from({ length: maxArcaneRecoveryLevel }, (_, i) => i + 1).map((level) => {
                    // Only render if this level has used slots
                    if (!availableSlotLevelsForRecovery.includes(level)) {
                      return null
                    }

                    const isChecked = values[`arcane_slot_${level}`] === "true"
                    const isDisabled = !isChecked && level > maxArcaneRecoveryLevelRemaining

                    return (
                      <div class="form-check" key={level}>
                        <input
                          class="form-check-input"
                          type="checkbox"
                          name={`arcane_slot_${level}`}
                          value="true"
                          id={`arcane-slot-${level}`}
                          disabled={isDisabled}
                          checked={isChecked}
                        />
                        <label
                          class={`form-check-label ${isDisabled ? "text-muted" : ""}`}
                          for={`arcane-slot-${level}`}
                        >
                          Level {level} slots
                        </label>
                      </div>
                    )
                  })}
                  <small class="text-muted d-block mt-2">
                    Selected: {selectedSlotLevelsTotal} / {maxArcaneRecoveryLevel} slot levels
                  </small>
                  {errors.arcane_slots && (
                    <div class="invalid-feedback d-block">{errors.arcane_slots}</div>
                  )}
                </div>
              )}
            </>
          )}

          <hr class="my-3" />

          {/* Note field */}
          <div class="mb-3">
            <label for="rest-note" class="form-label">
              Note (optional)
            </label>
            <textarea
              id="rest-note"
              name="note"
              class="form-control"
              rows={2}
              placeholder="Why did you take a short rest?"
            >
              {values.note || ""}
            </textarea>
            {errors.note && <div class="invalid-feedback d-block">{errors.note}</div>}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/rest/short`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            <i class="bi bi-cup-hot me-2"></i>
            Complete Short Rest
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
