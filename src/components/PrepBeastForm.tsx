import { BeastDetail } from "@src/components/BeastDetail"
import { ModalContent } from "@src/components/ui/DetailModal"
import { type Beast, getBeastById, getBeasts } from "@src/lib/dnd/beasts"
import { formatCR } from "@src/lib/dnd/wildShape"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalForm, ModalFormSubmit } from "./ui/ModalForm"

export interface PrepBeastFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

function PrepBeastFormBody({ character, values = {}, errors = {} }: PrepBeastFormProps) {
  const wildShape = character.wildShape!
  const { limits, knownForms, beasts: currentList } = wildShape
  const currentCount = currentList.length
  const atLimit = knownForms !== null && currentCount >= knownForms

  // Get all beasts for this ruleset, excluding already known
  const allBeasts = getBeasts(character.ruleset)
  const availableBeasts = allBeasts
    .filter((b) => !currentList.includes(b.id))
    .sort((a, b) => {
      if (a.cr !== b.cr) return a.cr - b.cr
      return a.name.localeCompare(b.name)
    })

  // Check if a beast can be added (meets CR/fly/swim limits)
  const canAddBeast = (beast: Beast): boolean => {
    if (beast.cr > limits.maxCR) return false
    if (beast.speed.fly && !limits.canFly) return false
    if (beast.speed.swim && !limits.canSwim) return false
    return true
  }

  // Get current known beasts for replacement dropdown
  const knownBeastsData = currentList
    .map((beastId) => getBeastById(character.ruleset, beastId))
    .filter(Boolean) as Beast[]

  const selectedBeast = values.beast_id ? getBeastById(character.ruleset, values.beast_id) : null
  const selectedBeastValid = selectedBeast ? canAddBeast(selectedBeast) : true

  const formatSpeed = (beast: Beast) => {
    const parts: string[] = []
    if (beast.speed.walk) parts.push(`${beast.speed.walk} ft.`)
    if (beast.speed.swim) parts.push(`swim ${beast.speed.swim} ft.`)
    if (beast.speed.fly) parts.push(`fly ${beast.speed.fly} ft.`)
    if (beast.speed.climb) parts.push(`climb ${beast.speed.climb} ft.`)
    return parts.join(", ")
  }

  // Filter beasts based on search query
  const searchQuery = values.beast_search
  const filteredBeasts = searchQuery
    ? availableBeasts.filter((beast) =>
        beast.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableBeasts

  const showSearchResults = searchQuery && searchQuery.trim().length > 0

  return (
    <div class="modal-body">
      <ModalForm
        id="prep-beast-form"
        endpoint={`/characters/${character.id}/edit/prepbeast`}
        trigger="input from:[name='beast_search'] changed delay:300ms, change"
      >
        {/* Form-level error */}
        {errors?._form && <div class="alert alert-danger">{errors._form}</div>}

        {/* Known Forms counter */}
        <div class="alert alert-info">
          <strong>Known Forms:</strong> {currentCount} / {knownForms}
          <span class="ms-2 badge bg-secondary">Max CR {formatCR(limits.maxCR)}</span>
          {!limits.canFly && <span class="ms-1 badge bg-warning text-dark">No flying</span>}
          {!limits.canSwim && <span class="ms-1 badge bg-warning text-dark">No swimming</span>}
        </div>

        {/* Replacement dropdown (shown when at limit) */}
        {atLimit && (
          <div class="mb-3">
            <label for="replace_beast_id" class="form-label">
              Replace existing form <span class="text-danger">*</span>
            </label>
            <select
              class={`form-select ${errors?.replace_beast_id ? "is-invalid" : ""}`}
              id="replace_beast_id"
              name="replace_beast_id"
            >
              <option value="">Select a form to replace...</option>
              {knownBeastsData.map((beast) => (
                <option value={beast.id} selected={values.replace_beast_id === beast.id}>
                  {beast.name} (CR {formatCR(beast.cr)})
                </option>
              ))}
            </select>
            {errors?.replace_beast_id && (
              <div class="invalid-feedback">{errors.replace_beast_id}</div>
            )}
            <small class="text-muted">You've reached your limit. Select a form to replace.</small>
          </div>
        )}

        {/* Beast Selection */}
        <div class="mb-3">
          <label class="form-label" for="beast_id">
            Select a beast form to learn
          </label>

          {/* Search input */}
          <input
            id="prepbeast-beast-search"
            type="text"
            class="form-control mb-2"
            name="beast_search"
            placeholder="Search beasts..."
            value={searchQuery || ""}
          />

          {/* Results count */}
          {showSearchResults && (
            <small class="text-muted d-block mb-2">
              Showing {filteredBeasts.length} of {availableBeasts.length} beasts
            </small>
          )}

          {/* Beast list */}
          {filteredBeasts.length === 0 ? (
            <div class="alert alert-info">No beasts match your search.</div>
          ) : (
            <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
              {filteredBeasts.map((beast) => {
                const canAdd = canAddBeast(beast)
                const disabledReason = !canAdd
                  ? beast.cr > limits.maxCR
                    ? `CR ${formatCR(beast.cr)} exceeds max CR ${formatCR(limits.maxCR)}`
                    : beast.speed.fly && !limits.canFly
                      ? "Cannot transform into flying creatures yet"
                      : beast.speed.swim && !limits.canSwim
                        ? "Cannot transform into swimming creatures yet"
                        : "Exceeds current limits"
                  : null

                return (
                  <div class={`form-check ${!canAdd ? "opacity-50" : ""}`}>
                    <input
                      class="form-check-input"
                      type="radio"
                      name="beast_id"
                      id={`beast-${beast.id}`}
                      value={beast.id}
                      checked={values.beast_id === beast.id}
                      disabled={!canAdd}
                    />
                    <label
                      class="form-check-label"
                      for={`beast-${beast.id}`}
                      title={disabledReason || undefined}
                    >
                      {beast.name} (CR {formatCR(beast.cr)})
                      {!canAdd && (
                        <i
                          class="bi bi-exclamation-triangle text-warning ms-1"
                          title={disabledReason || undefined}
                        ></i>
                      )}
                      <br />
                      <small class="text-muted">
                        <span class="text-capitalize">{beast.size}</span>, {beast.hitPoints} HP, AC{" "}
                        {beast.ac}, {formatSpeed(beast)}
                      </small>
                    </label>
                  </div>
                )
              })}
            </div>
          )}

          {errors?.beast_id && <div class="invalid-feedback d-block">{errors.beast_id}</div>}
        </div>

        {/* Beast Detail */}
        {selectedBeast && <BeastDetail beast={selectedBeast} compact={true} class="mb-3" />}

        {/* Validation warning */}
        {selectedBeast && !selectedBeastValid && (
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle me-1"></i>
            This beast exceeds your current Wild Shape limits and cannot be added.
          </div>
        )}

        {/* Note */}
        <div class="mb-3">
          <label for="note" class="form-label">
            Note (Optional)
          </label>
          <textarea
            class="form-control"
            id="prepbeast-note"
            name="note"
            rows={2}
            placeholder="How did you learn this form?"
          >
            {values?.note || ""}
          </textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <ModalFormSubmit
            id="prepbeast-submit"
            endpoint={`/characters/${character.id}/edit/prepbeast`}
            disabled={
              !selectedBeast || !selectedBeastValid || (atLimit && !values.replace_beast_id)
            }
          >
            {atLimit ? "Replace Form" : "Add Known Form"}
          </ModalFormSubmit>
        </div>
      </ModalForm>
    </div>
  )
}

export const PrepBeastForm = ({ character, values = {}, errors = {} }: PrepBeastFormProps) => {
  // Check if character has Wild Shape
  if (!character.wildShape) {
    return (
      <ModalContent title="Add Known Form">
        <div class="alert alert-warning">
          {character.name} does not have the Wild Shape trait and cannot learn beast forms.
        </div>
      </ModalContent>
    )
  }

  const { knownForms, beasts } = character.wildShape
  const title = knownForms !== null ? `Known Forms (${beasts.length}/${knownForms})` : "Known Forms"

  // Check if character can learn forms yet (SRD 5.2 requires level 2+)
  if (knownForms === 0) {
    return (
      <ModalContent title={title}>
        <div class="alert alert-warning">
          {character.name} cannot learn beast forms yet. Gain the Wild Shape trait at Druid level 2
          to begin learning forms.
        </div>
      </ModalContent>
    )
  }

  return (
    <ModalContent title={title}>
      <PrepBeastFormBody character={character} values={values} errors={errors} />
    </ModalContent>
  )
}
