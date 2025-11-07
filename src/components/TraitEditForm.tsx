import { ModalContent } from "@src/components/ui/ModalContent"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

export interface TraitEditFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const TraitEditForm = ({ character, values, errors }: TraitEditFormProps) => {
  return (
    <ModalContent title="Add Custom Trait">
      <form
        hx-post={`/characters/${character.id}/edit/trait`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="modal-body needs-validation"
      >
        <div class="mb-3">
          <label for="name" class="form-label">
            Trait Name
          </label>
          <input
            type="text"
            class={clsx("form-control", { "is-invalid": errors?.name })}
            id="name"
            name="name"
            value={values?.name || ""}
            required
            placeholder="Enter trait name"
          />
          {errors?.name && <div class="invalid-feedback d-block">{errors.name}</div>}
        </div>

        <div class="mb-3">
          <label for="description" class="form-label">
            Description
          </label>
          <textarea
            class={clsx("form-control", { "is-invalid": errors?.description })}
            id="description"
            name="description"
            rows={4}
            required
            placeholder="Describe the trait's effects"
          >
            {values?.description || ""}
          </textarea>
          {errors?.description && <div class="invalid-feedback d-block">{errors.description}</div>}
        </div>

        <div class="mb-3">
          <label for="note" class="form-label">
            Note (Optional)
          </label>
          <input
            type="text"
            class={clsx("form-control", { "is-invalid": errors?.note })}
            id="note"
            name="note"
            value={values?.note || ""}
            placeholder="Additional notes or context"
          />
          {errors?.note && <div class="invalid-feedback d-block">{errors.note}</div>}
          <div class="form-text">Add any additional context or reminders about this trait</div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/trait`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
          >
            Add Trait
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
