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
  currentValue: number
  values: Record<string, string>
  errors?: Record<string, string>
}

const CoinField = ({ name, label, currentValue, values, errors = {} }: CoinFieldProps) => {
  const value = values[name] ? parseInt(values[name], 10) : currentValue
  const changed = value !== currentValue

  return (
    <div class="col">
      <label for={name} class="form-label text-uppercase fw-medium" style="font-size: 0.85rem;">
        {label}
      </label>
      <input
        type="number"
        class={clsx("form-control form-control-lg text-center", {
          "is-invalid": errors[name],
          "border-primary border-2": changed,
        })}
        id={name}
        name={name}
        value={values[name] !== undefined ? values[name] : currentValue}
        min="0"
        required
      />
      {errors[name] && (
        <div class="invalid-feedback d-block" style="font-size: 0.7rem;">
          {errors[name]}
        </div>
      )}
      {changed && (
        <div class="text-primary text-center mt-1" style="font-size: 0.7rem;">
          {currentValue} → {value}
        </div>
      )}
    </div>
  )
}

export const CoinsEditForm = ({ character, values = {}, errors = {} }: CoinsEditFormProps) => {
  const currentCoins = character.coins || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 }

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
          <div class="row row-cols-5 g-3 mb-3">
            <CoinField
              name="pp"
              label="PP"
              currentValue={currentCoins.pp}
              values={values}
              errors={errors}
            />
            <CoinField
              name="gp"
              label="GP"
              currentValue={currentCoins.gp}
              values={values}
              errors={errors}
            />
            <CoinField
              name="ep"
              label="EP"
              currentValue={currentCoins.ep}
              values={values}
              errors={errors}
            />
            <CoinField
              name="sp"
              label="SP"
              currentValue={currentCoins.sp}
              values={values}
              errors={errors}
            />
            <CoinField
              name="cp"
              label="CP"
              currentValue={currentCoins.cp}
              values={values}
              errors={errors}
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
