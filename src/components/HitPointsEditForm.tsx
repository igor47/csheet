import { HitPointsBar } from "@src/components/ui/HitPointsBar"
import type { DeathSaves } from "@src/lib/dnd/deathSaves"
import { ignoreCheckEmptyErrors } from "@src/lib/formErrors"
import clsx from "clsx"
import { ModalForm, ModalFormSubmit } from "./ui/ModalForm"

export interface HitPointsEditFormProps {
  characterId: string
  currentHP: number
  maxHitPoints: number
  // Beast HP props for Wild Shape
  isTransformed?: boolean
  beastName?: string
  currentBeastHp?: number
  maxBeastHp?: number
  // Set at 0 HP
  deathSaves?: DeathSaves | null
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const HitPointsEditForm = ({
  characterId,
  currentHP,
  maxHitPoints,
  isTransformed = false,
  beastName,
  currentBeastHp = 0,
  maxBeastHp = 0,
  deathSaves = null,
  values = {},
  errors = {},
}: HitPointsEditFormProps) => {
  // When transformed, default action based on beast HP
  const defaultAction = isTransformed
    ? currentBeastHp >= maxBeastHp
      ? "lose"
      : "restore"
    : currentHP >= maxHitPoints
      ? "lose"
      : "restore"

  const action = values?.action || defaultAction
  const amount = values?.amount ? parseInt(values.amount, 10) : 0

  // Calculate preview HP (for beast when transformed, character otherwise)
  let previewHP = isTransformed ? currentBeastHp : currentHP
  const maxHP = isTransformed ? maxBeastHp : maxHitPoints
  if (amount > 0) {
    if (action === "restore") {
      previewHP = Math.min(previewHP + amount, maxHP)
    } else {
      previewHP = Math.max(previewHP - amount, 0)
    }
  }

  const isDead = deathSaves?.status === "dead"
  const atZero = !isTransformed && currentHP <= 0

  // What the damage does to the character at or past 0 HP
  let dyingPreview: string | null = null
  if (!isTransformed && action === "lose" && amount > 0) {
    const remaining = amount - Math.max(currentHP, 0)
    if (remaining >= maxHitPoints) {
      dyingPreview = "Massive damage: the character dies outright"
    } else if (atZero) {
      dyingPreview =
        values?.critical === "on" || values?.critical === "true"
          ? "Two death save failures (critical hit)"
          : "One death save failure"
    } else if (remaining >= 0) {
      dyingPreview = "Drops to 0 HP: unconscious and dying"
    }
  }

  const showPreview = amount > 0 && !errors?.amount
  errors = ignoreCheckEmptyErrors(values, errors)

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">
          {isTransformed ? `Edit ${beastName} Hit Points` : "Edit Hit Points"}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <ModalForm id="hp-edit-form" endpoint={`/characters/${characterId}/edit/hitpoints`}>
          {/* Beast HP indicator when transformed */}
          {isTransformed && (
            <div class="alert alert-info mb-3">
              <i class="bi bi-info-circle me-2"></i>
              You are transformed into <strong>{beastName}</strong>. Damage will be applied to beast
              HP first.
            </div>
          )}

          {isDead && (
            <div class="alert alert-dark mb-3">
              <i class="bi bi-heartbreak me-2"></i>
              This character is dead, and can't regain hit points until restored to life.
            </div>
          )}
          {atZero && !isDead && (
            <div class="alert alert-danger mb-3">
              <i class="bi bi-exclamation-triangle me-2"></i>
              At 0 HP and {deathSaves?.status === "stable" ? "stable" : "dying"}. Healing brings the
              character back; damage causes a death save failure, and damage of at least{" "}
              {maxHitPoints} kills outright.
            </div>
          )}

          {/* Current HP - show beast HP when transformed */}
          <div class="mb-3">
            <p class="mb-2">{isTransformed ? `${beastName} Hit Points` : "Current Hit Points"}</p>
            <HitPointsBar
              currentHP={isTransformed ? currentBeastHp : currentHP}
              maxHitPoints={isTransformed ? maxBeastHp : maxHitPoints}
            />
          </div>

          {/* Show character HP reference when transformed */}
          {isTransformed && (
            <div class="mb-3">
              <p class="mb-2 text-muted small">Character Hit Points (receives overflow damage)</p>
              <HitPointsBar currentHP={currentHP} maxHitPoints={maxHitPoints} />
            </div>
          )}

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
                disabled={isTransformed ? currentBeastHp >= maxBeastHp : currentHP >= maxHitPoints}
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
                disabled={isTransformed ? currentBeastHp <= 0 : isDead}
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

          {/* Critical hits only matter at 0 HP, where they cause two death save failures */}
          {atZero && !isDead && (
            <div class="mb-3 form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="hitpoints-critical"
                name="critical"
                checked={values?.critical === "on" || values?.critical === "true"}
              />
              <label class="form-check-label" for="hitpoints-critical">
                Damage is from a critical hit (two death save failures)
              </label>
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div class="mb-3">
              <p class="mb-2">Preview</p>
              <HitPointsBar currentHP={previewHP} maxHitPoints={maxHP} />
              <small class="form-text text-muted">
                {action === "restore" ? "Restoring" : "Losing"} {amount} HP:{" "}
                {isTransformed ? currentBeastHp : currentHP} → {previewHP}
                {isTransformed &&
                  action === "lose" &&
                  amount > currentBeastHp &&
                  ` (${amount - currentBeastHp} overflow to character)`}
              </small>
              {dyingPreview && (
                <div class="small text-danger fw-bold" id="hitpoints-dying-preview">
                  {dyingPreview}
                </div>
              )}
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
            <ModalFormSubmit endpoint={`/characters/${characterId}/edit/hitpoints`}>
              Update Hit Points
            </ModalFormSubmit>
          </div>
        </ModalForm>
      </div>
    </>
  )
}
