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
              <div class="d-flex flex-wrap gap-2 mb-2">
                {character.availableHitDice.map((die, index) => (
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      name="hitdice"
                      value={die}
                      id={`hitdie-${index}`}
                    />
                    <label class="form-check-label" for={`hitdie-${index}`}>
                      d{die}
                    </label>
                  </div>
                ))}
              </div>
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

          {/* Arcane Recovery Section (Wizards only) */}
          {hasArcaneRecovery && (
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
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div class="form-check" key={level}>
                      <input
                        class="form-check-input"
                        type="checkbox"
                        name={`arcane_slot_${level}`}
                        value="true"
                        id={`arcane-slot-${level}`}
                        disabled={level > maxArcaneRecoveryLevel}
                        checked={values[`arcane_slot_${level}`] === "true"}
                      />
                      <label class="form-check-label" for={`arcane-slot-${level}`}>
                        Level {level} slot
                      </label>
                    </div>
                  ))}
                  <small class="text-muted d-block mt-2">
                    Maximum total slot levels: {maxArcaneRecoveryLevel}
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
