import { SpellDetail } from "@src/components/SpellDetail"
import { SpellPicker } from "@src/components/ui/SpellPicker"
import { spells } from "@src/lib/dnd/spells"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"

export interface LearnSpellFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

function LearnSpellFormBody({ character, values = {}, errors = {} }: LearnSpellFormProps) {
  const wizardSI = character.spells.find((si) => si.class === "wizard")!

  const allowHighLevel = values.allowHighLevel === "true"

  // Get current spellbook
  const currentList = wizardSI.knownSpells || []

  // Figure out which spells are available to add (only leveled spells, not cantrips)
  const maxSpellLevel = allowHighLevel ? 9 : wizardSI.maxSpellLevel
  const availableSpells = spells
    .filter((s) => s.classes.includes("wizard"))
    .filter((s) => s.level > 0 && s.level <= maxSpellLevel)
    .filter((s) => !currentList.includes(s.id))
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      return a.name.localeCompare(b.name)
    })

  const selectedSpell = availableSpells.find((s) => s.id === values.spell_id) || null

  return (
    <div class="modal-body">
      <form
        id="learn-spell-form"
        hx-post={`/characters/${character.id}/edit/spellbook`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="input from:[name='spell_search'] changed delay:300ms, change"
        hx-target="#editModalContent"
        hx-swap="morph:innerHTML"
        class="needs-validation"
        novalidate
      >
        {/* Allow High-Level Spells */}
        <div class="mb-3">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              name="allowHighLevel"
              id="allowHighLevel"
              value="true"
              checked={values.allowHighLevel === "true"}
            />
            <label class="form-check-label" for="allowHighLevel">
              Show spells above my maximum spell level
            </label>
          </div>
          {errors?.allowHighLevel && (
            <div class="invalid-feedback d-block">{errors.allowHighLevel}</div>
          )}
        </div>

        {/* Spell Selection */}
        <SpellPicker
          spells={availableSpells}
          selectedSpellId={values.spell_id}
          label="Select spell to add"
          error={errors?.spell_id}
          emptyMessage="No spells available to add to your spellbook."
          searchQuery={values.spell_search}
        />

        {/* Spell Detail */}
        {selectedSpell && <SpellDetail spell={selectedSpell} compact={true} class="mb-3" />}

        {/* Note */}
        <div class="mb-3">
          <label for="note" class="form-label">
            Note (Optional)
          </label>
          <textarea
            class="form-control"
            id="learnspell-note"
            name="note"
            rows={2}
            placeholder="Add a note about adding this spell to your spellbook..."
            value={values?.note || ""}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            id="learnspell-submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/spellbook`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="morph:innerHTML"
            disabled={!selectedSpell}
          >
            Add to Spellbook
          </button>
        </div>
      </form>
    </div>
  )
}

export const LearnSpellForm = ({ character, values = {}, errors = {} }: LearnSpellFormProps) => {
  const wizardSI = character.spells.find((si) => si.class === "wizard")

  if (!wizardSI) {
    return (
      <ModalContent title="Add to Spellbook">
        <div class="alert alert-warning">
          {character.name} is not a wizard and cannot add spells to a spellbook.
        </div>
      </ModalContent>
    )
  }

  return (
    <ModalContent title="Add to Spellbook">
      <LearnSpellFormBody character={character} values={values} errors={errors} />
    </ModalContent>
  )
}
