import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"
import { ModalForm, ModalFormSubmit } from "./ui/ModalForm"

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
  const availSpellSlots = character.availableSpellSlots
  const usedSpellSlots = [...character.spellSlots]
  for (const slot of availSpellSlots) {
    const index = usedSpellSlots.indexOf(slot)
    if (index !== -1) {
      usedSpellSlots.splice(index, 1)
    }
  }

  // Parse selected arcane slots from values (array field)
  const selectedArcaneSlots: number[] = []
  const arcaneSlotsValue = values["arcane_slots[]"]
  if (arcaneSlotsValue && Array.isArray(arcaneSlotsValue)) {
    selectedArcaneSlots.push(...arcaneSlotsValue.map((v) => Number.parseInt(v, 10)))
  }

  // Calculate currently selected slot levels total
  const selectedSlotLevelsTotal = selectedArcaneSlots.reduce((sum, level) => sum + level, 0)

  // Calculate remaining capacity for Arcane Recovery
  const maxArcaneRecoveryLevelRemaining = maxArcaneRecoveryLevel - selectedSlotLevelsTotal

  // Parse selected dice from values (object array field parsed from dot notation)
  const selectedDice: Array<{ die: number; roll: string; use: boolean }> = []
  if (values.dice && typeof values.dice === "object") {
    for (const d of Object.values(values.dice) as Record<string, string>[]) {
      selectedDice.push({
        die: Number.parseInt(d.die || "", 10),
        roll: String(d.roll || ""),
        use: d.use === "true",
      })
    }
  } else {
    for (const die of character.availableHitDice) {
      selectedDice.push({
        die: die,
        roll: "",
        use: false,
      })
    }
  }

  return (
    <ModalContent title="Take a Short Rest">
      <ModalForm id="short-rest-form" endpoint={`/characters/${character.id}/rest/short`}>
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
              {selectedDice.map((die, index) => {
                const dieError = errors[`dice.${index}.die`]
                const rollError = errors[`dice.${index}.roll`]

                return (
                  <div class="mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <div class="form-check" style="min-width: 80px">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          name={`dice.${index}.use`}
                          value="true"
                          id={`dice-use-${index}`}
                          checked={die.use}
                        />
                        <label class="form-check-label" for={`dice-use-${index}`}>
                          d{die.die}
                        </label>
                        <input type="hidden" name={`dice.${index}.die`} value={die.die} />
                      </div>
                      <div class="input-group input-group-sm" style="max-width: 140px">
                        <span class="input-group-text">Roll:</span>
                        <input
                          type="number"
                          class={`form-control ${rollError ? "is-invalid" : ""}`}
                          name={`dice.${index}.roll`}
                          id={`dice-roll-${index}`}
                          min="1"
                          max={die.die}
                          value={die.roll}
                          placeholder="roll"
                          disabled={!die.use}
                        />
                      </div>
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
          {hasArcaneRecovery && usedSpellSlots.length > 0 && (
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
                  {usedSpellSlots.map((level) => {
                    const isChecked = selectedArcaneSlots.includes(level)
                    if (isChecked) {
                      selectedArcaneSlots.splice(selectedArcaneSlots.indexOf(level), 1)
                    }
                    const isDisabled = !isChecked && level > maxArcaneRecoveryLevelRemaining

                    return (
                      <div class="form-check" key={level}>
                        <input
                          class="form-check-input"
                          type="checkbox"
                          name="arcane_slots[]"
                          value={level}
                          id={`arcane-slot-${level}`}
                          disabled={isDisabled}
                          checked={isChecked}
                        />
                        <label
                          class={`form-check-label ${isDisabled ? "text-muted" : ""}`}
                          for={`arcane-slot-${level}`}
                        >
                          Level {level} slot
                        </label>
                      </div>
                    )
                  })}
                  <small class="text-muted d-block mt-2">
                    Selected: {selectedSlotLevelsTotal} / {maxArcaneRecoveryLevel} slot levels
                  </small>
                  {errors["arcane_slots[]"] && (
                    <div class="invalid-feedback d-block">{errors["arcane_slots[]"]}</div>
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
          <ModalFormSubmit endpoint={`/characters/${character.id}/rest/short`}>
            <i class="bi bi-cup-hot me-2"></i>
            Complete Short Rest
          </ModalFormSubmit>
        </div>
      </ModalForm>
    </ModalContent>
  )
}
