import { applyDeltasWithChange } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import clsx from "clsx"
import { ModalContent } from "./ui/ModalContent"

export interface CoinsEditFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

interface CoinFieldProps {
  name: string
  label: string
  currentCoins: { pp: number; gp: number; ep: number; sp: number; cp: number }
  newCoins: { pp: number; gp: number; ep: number; sp: number; cp: number }
  values: Record<string, string>
  errors?: Record<string, string>
  makeChange: boolean
}

const CoinField = ({
  name,
  label,
  currentCoins,
  newCoins,
  values,
  errors = {},
  makeChange,
}: CoinFieldProps) => {
  const delta = values[name] ? parseInt(values[name], 10) : 0
  const currentValue = currentCoins[name as keyof typeof currentCoins]
  const newValue = newCoins[name as keyof typeof newCoins]

  // Show change if there's an explicit delta OR if the value changed due to make_change
  const valueChanged = currentValue !== newValue
  const hasExplicitDelta = delta !== 0

  return (
    <div class="col">
      <label for={name} class="form-label text-uppercase fw-medium" style="font-size: 0.85rem;">
        {label}
      </label>
      <div class="text-muted text-center mb-1" style="font-size: 0.7rem;">
        Current: {currentValue}
      </div>
      <input
        type="number"
        class={clsx("form-control form-control-lg text-center", {
          "is-invalid": errors[name],
          "border-success border-2": hasExplicitDelta && delta > 0,
          "border-danger border-2": hasExplicitDelta && delta < 0,
        })}
        id={name}
        name={name}
        value={values[name] !== undefined ? values[name] : ""}
        placeholder="0"
      />
      {errors[name] && (
        <div class="invalid-feedback d-block" style="font-size: 0.7rem;">
          {errors[name]}
        </div>
      )}
      {valueChanged && makeChange && (
        <div
          class={clsx("text-center mt-1 fw-medium", {
            "text-success": newValue > currentValue,
            "text-danger": newValue < currentValue,
            "text-muted": newValue === currentValue,
          })}
          style="font-size: 0.7rem;"
        >
          {hasExplicitDelta && (
            <>
              {delta > 0 ? "+" : ""}
              {delta} →{" "}
            </>
          )}
          New: {newValue}
        </div>
      )}
    </div>
  )
}

export const CoinsEditForm = ({ character, values = {}, errors = {} }: CoinsEditFormProps) => {
  const currentCoins = character.coins || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }

  // Check if make_change is enabled (default true)
  const makeChange = values.make_change !== "false"

  // Calculate new coins based on deltas and make_change setting
  let newCoins = { ...currentCoins }
  const deltas = {
    pp: values.pp ? parseInt(values.pp, 10) : 0,
    gp: values.gp ? parseInt(values.gp, 10) : 0,
    ep: values.ep ? parseInt(values.ep, 10) : 0,
    sp: values.sp ? parseInt(values.sp, 10) : 0,
    cp: values.cp ? parseInt(values.cp, 10) : 0,
  }

  const hasAnyDelta = Object.values(deltas).some((v) => v !== 0)

  if (hasAnyDelta && makeChange) {
    // Apply deltas with automatic change-making
    newCoins = applyDeltasWithChange(currentCoins, deltas)
  } else if (hasAnyDelta) {
    // Simple addition without conversion
    newCoins = {
      pp: currentCoins.pp + deltas.pp,
      gp: currentCoins.gp + deltas.gp,
      ep: currentCoins.ep + deltas.ep,
      sp: currentCoins.sp + deltas.sp,
      cp: currentCoins.cp + deltas.cp,
    }
  }

  return (
    <ModalContent title="Edit Coins">
      <form
        id="coins-edit-form"
        hx-post={`/characters/${character.id}/edit/coins`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        <div class="modal-body">
          <div class="alert alert-info" role="alert">
            <strong>Enter the change amount</strong> (use negative numbers for spending):
            <ul class="mb-0 mt-1">
              <li>
                To spend 50gp: enter <code>-50</code>
              </li>
              <li>
                To gain 200gp: enter <code>200</code>
              </li>
            </ul>
            <div class="form-check mt-2">
              <input
                class="form-check-input"
                type="checkbox"
                id="make_change"
                name="make_change"
                value="true"
                checked={makeChange}
              />
              <label class="form-check-label" for="make_change">
                Allow making change from larger denominations
              </label>
            </div>
          </div>

          <div class="row row-cols-5 g-3 mb-3">
            <CoinField
              name="pp"
              label="PP"
              currentCoins={currentCoins}
              newCoins={newCoins}
              values={values}
              errors={errors}
              makeChange={makeChange}
            />
            <CoinField
              name="gp"
              label="GP"
              currentCoins={currentCoins}
              newCoins={newCoins}
              values={values}
              errors={errors}
              makeChange={makeChange}
            />
            <CoinField
              name="ep"
              label="EP"
              currentCoins={currentCoins}
              newCoins={newCoins}
              values={values}
              errors={errors}
              makeChange={makeChange}
            />
            <CoinField
              name="sp"
              label="SP"
              currentCoins={currentCoins}
              newCoins={newCoins}
              values={values}
              errors={errors}
              makeChange={makeChange}
            />
            <CoinField
              name="cp"
              label="CP"
              currentCoins={currentCoins}
              newCoins={newCoins}
              values={values}
              errors={errors}
              makeChange={makeChange}
            />
          </div>

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
              placeholder="Add a note about this transaction (e.g., 'received quest reward', 'bought rope')..."
              value={values?.note || ""}
            />
          </div>

          {/* General Errors */}
          {errors?.general && (
            <div class="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/coins`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            Update Coins
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
