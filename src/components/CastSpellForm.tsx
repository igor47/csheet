import { SpellDetail } from "@src/components/SpellDetail"
import { spells } from "@src/lib/dnd/spells"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"
import { Select } from "./ui/Select"

export interface CastSpellFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const CastSpellForm = ({ character, values = {}, errors = {} }: CastSpellFormProps) => {
  const spell = spells.find((s) => s.id === values.spell_id)
  const title = spell ? `Cast ${spell.name}` : "Cast Spell"

  if (!spell) {
    return (
      <ModalContent title="Spell Not Found">
        <div class="alert alert-danger">Spell not found</div>
      </ModalContent>
    )
  }

  const isKnown = character.spells.some((s) => s.knownSpells?.some((ks) => ks === spell.id))
  const isPrepared = character.spells.some(
    (s) =>
      s.preparedSpells.some((ps) => ps.spell_id === spell.id) ||
      s.cantripSlots.some((cs) => cs.spell_id === spell.id)
  )
  const hasSpellSlots = character.availableSpellSlots?.some((slot) => slot >= spell.level)
  const isCantrip = spell.level === 0
  const asRitual = values.as_ritual === "true"

  // Check if character has spell prepared
  if (!isPrepared && !isKnown) {
    return (
      <ModalContent title="Cannot Cast">
        <div class="alert alert-danger">
          {character.name} cannot cast {spell.name}
        </div>
      </ModalContent>
    )
  }

  // For slot selection
  const slotLevelCounts: Record<number, { level: number; available: number; total: number }> = {}
  for (let level = 1; level <= 9; level++) {
    slotLevelCounts[level] = { level, available: 0, total: 0 }
  }
  for (const level of character.spellSlots || []) {
    slotLevelCounts[level]!.total += 1
  }
  for (const level of character.availableSpellSlots || []) {
    slotLevelCounts[level]!.available += 1
  }
  const slotOptions = Object.values(slotLevelCounts)
    .filter((s) => s.level >= spell.level && s.available > 0)
    .map((sl) => ({
      value: sl.level.toString(),
      label: `Level ${sl.level} (${sl.available}/${sl.total} available)`,
    }))

  // Default slot_level to spell level if not set
  if (!values.slot_level && !isCantrip && !asRitual) {
    for (let level = spell.level; level <= 9; level++) {
      if (slotLevelCounts[level]!.available > 0) {
        values.slot_level = level.toString()
        break
      }
    }
  }

  return (
    <ModalContent title={title}>
      <div class="modal-body">
        {/* Warning Banner */}
        <div class="alert alert-info mb-3">
          <i class="bi bi-info-circle me-2"></i>
          <strong>Note:</strong> This only tracks spell slot usage. Remember to manually apply spell
          effects (e.g., heal damage, apply conditions).
        </div>

        {/* Spell Details */}
        <SpellDetail spell={spell} compact={true} class="mb-3" />

        <form
          id="cast-spell-form"
          hx-post={`/characters/${character.id}/castspell`}
          hx-vals='{"is_check": "true"}'
          hx-trigger="change"
          hx-target="#editModalContent"
          hx-swap="morph:innerHTML"
          class="needs-validation"
          novalidate
        >
          {/* Hidden fields */}
          <input type="hidden" name="spell_id" value={values.spell_id} />

          {/* Cantrip Message */}
          {isCantrip && (
            <div class="alert alert-success">
              <i class="bi bi-check-circle me-2"></i>
              Cantrips don't consume spell slots. You can cast this as many times as you like!
            </div>
          )}

          {/* Ritual Casting Option */}
          {!isCantrip && spell.ritual && (
            <div class="mb-3">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  name="as_ritual"
                  id="as_ritual"
                  value="true"
                  checked={asRitual}
                />
                <label class="form-check-label" for="as_ritual">
                  Cast as ritual (takes +10 minutes, no spell slot consumed)
                </label>
              </div>
              {errors?.as_ritual && <div class="invalid-feedback d-block">{errors.as_ritual}</div>}
            </div>
          )}

          {/* Spell Slot Selection */}
          {!isCantrip && !asRitual && (
            <div class="mb-3">
              <label class="form-label d-block" for="slot_level">
                Select Spell Slot Level
              </label>

              <Select
                name="slot_level"
                id="slot_level"
                options={slotOptions}
                placeholder="Select a spell slot level"
                required={true}
                error={errors?.slot_level}
                value={values.slot_level}
                disabled={!hasSpellSlots}
              />
              {!hasSpellSlots && (
                <small class="form-text text-muted">
                  {character.name} has no spell slots available at or above level {spell.level}.
                </small>
              )}
            </div>
          )}

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
              placeholder="Add a note about casting this spell..."
            >
              {values?.note || ""}
            </textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              hx-post={`/characters/${character.id}/castspell`}
              hx-vals='{"is_check": "false"}'
              hx-target="#editModalContent"
              hx-swap="morph:innerHTML"
            >
              <i class="bi bi-lightning-fill me-1"></i>
              Cast {spell.name}
            </button>
          </div>
        </form>
      </div>
    </ModalContent>
  )
}
