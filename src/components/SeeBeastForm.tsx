import { BeastDetail } from "@src/components/BeastDetail"
import { BeastPicker } from "@src/components/ui/BeastPicker"
import { ModalContent } from "@src/components/ui/DetailModal"
import { getBeastById, getBeasts } from "@src/lib/dnd/beasts"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalForm, ModalFormSubmit } from "./ui/ModalForm"

export interface SeeBeastFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

function SeeBeastFormBody({ character, values = {}, errors = {} }: SeeBeastFormProps) {
  // Get current seen beasts
  const currentList = character.seenBeasts || []

  // Get all beasts for this ruleset, excluding already seen
  const availableBeasts = getBeasts(character.ruleset)
    .filter((b) => !currentList.includes(b.id))
    .sort((a, b) => {
      if (a.cr !== b.cr) return a.cr - b.cr
      return a.name.localeCompare(b.name)
    })

  const selectedBeast = values.beast_id ? getBeastById(character.ruleset, values.beast_id) : null

  return (
    <div class="modal-body">
      <ModalForm
        id="see-beast-form"
        endpoint={`/characters/${character.id}/edit/seenbeasts`}
        trigger="input from:[name='beast_search'] changed delay:300ms, change"
      >
        {/* Form-level error */}
        {errors?._form && <div class="alert alert-danger">{errors._form}</div>}

        {/* Beast Selection */}
        <BeastPicker
          beasts={availableBeasts}
          selectedBeastId={values.beast_id}
          label="Select a beast you have seen"
          error={errors?.beast_id}
          emptyMessage="No beasts available to add."
          searchQuery={values.beast_search}
        />

        {/* Beast Detail */}
        {selectedBeast && <BeastDetail beast={selectedBeast} compact={true} class="mb-3" />}

        {/* Note */}
        <div class="mb-3">
          <label for="note" class="form-label">
            Note (Optional)
          </label>
          <textarea
            class="form-control"
            id="seebeast-note"
            name="note"
            rows={2}
            placeholder="Where or how did you encounter this beast?"
          >
            {values?.note || ""}
          </textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <ModalFormSubmit
            id="seebeast-submit"
            endpoint={`/characters/${character.id}/edit/seenbeasts`}
            disabled={!selectedBeast}
          >
            Add Seen Beast
          </ModalFormSubmit>
        </div>
      </ModalForm>
    </div>
  )
}

export const SeeBeastForm = ({ character, values = {}, errors = {} }: SeeBeastFormProps) => {
  // Check if character has Wild Shape
  const hasWildShape = character.seenBeasts !== null

  if (!hasWildShape) {
    return (
      <ModalContent title="Add Seen Beast">
        <div class="alert alert-warning">
          {character.name} does not have the Wild Shape trait and cannot record seen beasts.
        </div>
      </ModalContent>
    )
  }

  return (
    <ModalContent title="Add Seen Beast">
      <SeeBeastFormBody character={character} values={values} errors={errors} />
    </ModalContent>
  )
}
