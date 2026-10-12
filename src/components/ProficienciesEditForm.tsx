import { ModalContent } from "@src/components/ui/DetailModal"
import {
  formatProficiencyName,
  type ProficiencyKind,
  ProficiencyKindLabels,
  ProficiencyKinds,
  proficiencySuggestions,
} from "@src/lib/dnd/proficiencies"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { removeFieldName } from "@src/services/updateProficiencies"
import clsx from "clsx"
import { ModalForm, ModalFormSubmit } from "./ui/ModalForm"

export interface ProficienciesEditFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

const KindSingular: Record<ProficiencyKind, string> = {
  weapon: "Weapon",
  armor: "Armor",
  tool: "Tool",
  language: "Language",
}

export const ProficienciesEditForm = ({
  character,
  values = {},
  errors = {},
}: ProficienciesEditFormProps) => {
  const endpoint = `/characters/${character.id}/edit/proficiencies`
  const addKind = (ProficiencyKinds as readonly string[]).includes(values.add_kind ?? "")
    ? (values.add_kind as ProficiencyKind)
    : "weapon"
  const suggestions = proficiencySuggestions(addKind, character.ruleset)

  return (
    <ModalContent title="Edit Proficiencies">
      <ModalForm id="proficiencies-edit-form" endpoint={endpoint}>
        <div class="modal-body">
          <h6>Add</h6>
          <div class="row g-2 mb-3">
            <div class="col-4">
              <label for="add_kind" class="form-label small text-muted">
                Kind
              </label>
              <select
                class={clsx("form-select", { "is-invalid": errors.add_kind })}
                id="add_kind"
                name="add_kind"
              >
                {ProficiencyKinds.map((kind) => (
                  <option value={kind} selected={kind === addKind}>
                    {KindSingular[kind]}
                  </option>
                ))}
              </select>
              {errors.add_kind && <div class="invalid-feedback d-block">{errors.add_kind}</div>}
            </div>
            <div class="col-8">
              <label for="add_names" class="form-label small text-muted">
                Name
              </label>
              <input
                type="text"
                class={clsx("form-control", { "is-invalid": errors.add_names })}
                id="add_names"
                name="add_names"
                list="proficiency-suggestions"
                value={values.add_names || ""}
                placeholder="e.g. longsword, or several separated by commas"
                autocomplete="off"
              />
              <datalist id="proficiency-suggestions">
                {suggestions.map((s) => (
                  <option value={s} />
                ))}
              </datalist>
              {errors.add_names && <div class="invalid-feedback d-block">{errors.add_names}</div>}
            </div>
            <div class="col-12">
              <label for="source_detail" class="form-label small text-muted">
                Source (Optional)
              </label>
              <input
                type="text"
                class="form-control"
                id="source_detail"
                name="source_detail"
                value={values.source_detail || ""}
                placeholder="e.g. Weapon Master feat"
              />
            </div>
          </div>

          <h6>Remove</h6>
          <p class="small text-muted mb-2">Check any proficiencies the character no longer has.</p>
          {ProficiencyKinds.map((kind, kindIdx) => {
            const current = character.proficiencies.filter((p) => p.kind === kind)
            if (current.length === 0) return null
            return (
              <fieldset class="mb-2">
                <legend class="small fw-semibold mb-1 fs-6">{ProficiencyKindLabels[kind]}</legend>
                <div class="d-flex flex-wrap gap-2">
                  {current.map((p, idx) => {
                    const fieldName = removeFieldName(p)
                    const id = `remove-${kindIdx}-${idx}`
                    return (
                      <div class="form-check form-check-inline me-0">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          id={id}
                          name={fieldName}
                          value="on"
                          checked={!!values[fieldName]}
                        />
                        <label
                          class={clsx("form-check-label small", {
                            "text-decoration-line-through text-danger": !!values[fieldName],
                          })}
                          for={id}
                        >
                          {formatProficiencyName(p.name)}
                        </label>
                      </div>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}
          {errors.remove && <div class="invalid-feedback d-block">{errors.remove}</div>}

          <div class="my-3">
            <label for="note" class="form-label">
              Note (Optional)
            </label>
            <textarea
              class="form-control"
              id="note"
              name="note"
              rows={2}
              placeholder="Add a note about these changes..."
            >
              {values.note || ""}
            </textarea>
          </div>

          {errors.general && (
            <div class="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <ModalFormSubmit endpoint={endpoint}>Update Proficiencies</ModalFormSubmit>
        </div>
      </ModalForm>
    </ModalContent>
  )
}
