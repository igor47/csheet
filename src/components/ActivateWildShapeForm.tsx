import { BeastDetail } from "@src/components/BeastDetail"
import { ModalContent } from "@src/components/ui/DetailModal"
import { getBeastById } from "@src/lib/dnd/beasts"
import { formatCR } from "@src/lib/dnd/wildShape"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalForm, ModalFormSubmit } from "./ui/ModalForm"

export interface ActivateWildShapeFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const ActivateWildShapeForm = ({
  character,
  values = {},
  errors = {},
}: ActivateWildShapeFormProps) => {
  if (!character.wildShape) {
    return (
      <ModalContent title="Cannot Transform">
        <div class="modal-body">
          <div class="alert alert-danger">{character.name} cannot use Wild Shape</div>
        </div>
      </ModalContent>
    )
  }

  const { limits, usesAvailable, maxUses, beasts, ongoingTransformation } = character.wildShape

  // Get all valid beasts for the dropdown
  const validBeasts = beasts
    .map((beastId) => {
      const b = getBeastById(character.ruleset, beastId)
      if (!b) return null

      // Check if beast can be transformed into
      const hasFly = !!b.speed.fly
      const hasSwim = !!b.speed.swim
      const canTransform =
        b.cr <= limits.maxCR && (!hasFly || limits.canFly) && (!hasSwim || limits.canSwim)

      return canTransform ? b : null
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.cr !== b!.cr) return a!.cr - b!.cr
      return a!.name.localeCompare(b!.name)
    })

  // Get selected beast (from values, or default to first valid beast)
  const selectedBeastId = values.beast_id || validBeasts[0]?.id
  const beast = selectedBeastId ? getBeastById(character.ruleset, selectedBeastId) : null
  const title = beast ? `Transform into ${beast.name}` : "Wild Shape"

  if (usesAvailable <= 0) {
    return (
      <ModalContent title="No Uses Available">
        <div class="modal-body">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {character.name} has no Wild Shape uses remaining. Take a rest to recover uses.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Close
          </button>
        </div>
      </ModalContent>
    )
  }

  if (validBeasts.length === 0) {
    return (
      <ModalContent title="No Valid Beasts">
        <div class="modal-body">
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-2"></i>
            No beasts available for transformation. Add beasts that meet your current CR and
            movement restrictions.
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Close
          </button>
        </div>
      </ModalContent>
    )
  }

  // If we have a beast_id but it's invalid (not in validBeasts), show error
  if (values.beast_id && !validBeasts.some((b) => b!.id === values.beast_id)) {
    const invalidBeast = getBeastById(character.ruleset, values.beast_id)
    if (invalidBeast) {
      const hasFly = !!invalidBeast.speed.fly
      const hasSwim = !!invalidBeast.speed.swim

      return (
        <ModalContent title="Cannot Transform">
          <div class="modal-body">
            <div class="alert alert-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              {character.name} cannot transform into {invalidBeast.name}:
              <ul class="mb-0 mt-2">
                {invalidBeast.cr > limits.maxCR && (
                  <li>
                    CR {formatCR(invalidBeast.cr)} exceeds your limit of {formatCR(limits.maxCR)}
                  </li>
                )}
                {hasFly && !limits.canFly && <li>You cannot transform into flying beasts yet</li>}
                {hasSwim && !limits.canSwim && (
                  <li>You cannot transform into swimming beasts yet</li>
                )}
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Close
            </button>
          </div>
        </ModalContent>
      )
    }
  }

  return (
    <ModalContent title={title}>
      <div class="modal-body">
        {/* Form-level error */}
        {errors?._form && (
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            {errors._form}
          </div>
        )}

        {/* Ongoing transformation warning */}
        {ongoingTransformation && (
          <div class="alert alert-info mb-3">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Note:</strong> You are currently transformed. Starting a new transformation will
            automatically end your current form.
          </div>
        )}

        {/* Uses remaining indicator */}
        <div class="alert alert-secondary mb-3">
          <i class="bi bi-lightning-charge me-2"></i>
          <strong>Wild Shape Uses:</strong> {usesAvailable}/{maxUses} remaining
        </div>

        {/* Beast Details - show if we have a selected beast */}
        {beast && <BeastDetail beast={beast} compact={true} class="mb-3" />}

        <ModalForm
          id="activate-wildshape-form"
          endpoint={`/characters/${character.id}/wildshape/activate`}
        >
          {/* Beast selector */}
          <div class="mb-3">
            <label for="beast_id" class="form-label">
              {validBeasts.length > 1 ? "Select Beast:" : "Beast:"}
            </label>
            <select
              id="beast_id"
              name="beast_id"
              class={`form-select ${errors?.beast_id ? "is-invalid" : ""}`}
            >
              {validBeasts.map((b) => (
                <option value={b!.id} selected={b!.id === selectedBeastId}>
                  {b!.name} (CR {formatCR(b!.cr)})
                </option>
              ))}
            </select>
            {errors?.beast_id && <div class="invalid-feedback">{errors.beast_id}</div>}
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
              placeholder="Add a note about this transformation..."
            >
              {values?.note || ""}
            </textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <ModalFormSubmit endpoint={`/characters/${character.id}/wildshape/activate`}>
              <i class="bi bi-arrow-repeat me-1"></i>
              Transform
            </ModalFormSubmit>
          </div>
        </ModalForm>
      </div>
    </ModalContent>
  )
}
