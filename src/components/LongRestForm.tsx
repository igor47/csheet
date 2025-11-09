import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"

export interface LongRestFormProps {
  character: ComputedCharacter
  values: Record<string, string>
  errors: Record<string, string>
}

export const LongRestForm = ({ character, values, errors }: LongRestFormProps) => {
  // Calculate what will be restored
  // HP to be restored
  const hpLost = character.maxHitPoints - character.currentHP

  // Hit Dice to be restored
  const hitDiceCount = character.hitDice.length
  const hitDiceUsed = hitDiceCount - character.availableHitDice.length
  const hitDiceMaxRestore = Math.max(Math.floor(hitDiceCount / 2), 1)
  const hitDiceToRestore = Math.min(hitDiceMaxRestore, hitDiceUsed)

  // Calculate spell slots used
  let spellSlotsUsed = 0
  if (character.spellSlots && character.availableSpellSlots) {
    for (let level = 1; level <= 9; level++) {
      const total = character.spellSlots.filter((s) => s === level).length
      const available = character.availableSpellSlots.filter((s) => s === level).length
      spellSlotsUsed += total - available
    }
  }

  // Check if character has any classes that can change prepared spells on long rest
  const canChangePreparedSpells = character.spells.some(
    (spellInfo) => spellInfo.changePrepared === "longrest"
  )

  return (
    <ModalContent title="Take a Long Rest">
      <form
        id="long-rest-form"
        hx-post={`/characters/${character.id}/rest/long`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        <div class="modal-body">
          <p class="text-muted mb-3">
            A long rest requires at least 8 hours of downtime. You will restore HP, hit dice, and
            spell slots.
          </p>

          <h6 class="fw-bold mb-2">Resources to be Restored:</h6>
          <ul class="mb-3">
            {hpLost > 0 && (
              <li>
                <strong>Hit Points:</strong> +{hpLost} HP (to {character.maxHitPoints} max)
              </li>
            )}
            {hpLost === 0 && (
              <li>
                <strong>Hit Points:</strong> Already at maximum
              </li>
            )}

            {hitDiceToRestore > 0 && (
              <li>
                <strong>Hit Dice:</strong> Restore {hitDiceToRestore} hit{" "}
                {hitDiceToRestore === 1 ? "die" : "dice"} (half of spent, rounded down)
              </li>
            )}
            {hitDiceToRestore === 0 && hitDiceUsed > 0 && (
              <li>
                <strong>Hit Dice:</strong> None restored (less than half spent)
              </li>
            )}
            {hitDiceUsed === 0 && (
              <li>
                <strong>Hit Dice:</strong> All available
              </li>
            )}

            {spellSlotsUsed > 0 && (
              <li>
                <strong>Spell Slots:</strong> All {spellSlotsUsed} used slot
                {spellSlotsUsed === 1 ? "" : "s"} restored
              </li>
            )}
            {spellSlotsUsed === 0 && character.spellSlots && character.spellSlots.length > 0 && (
              <li>
                <strong>Spell Slots:</strong> All slots available
              </li>
            )}
          </ul>

          {canChangePreparedSpells && (
            <div class="alert alert-info mb-3" role="alert">
              <i class="bi bi-lightbulb me-2"></i>
              <strong>Reminder:</strong> This is your chance to change prepared spells. After
              completing the long rest, ask Reed to help you prepare new spells.
            </div>
          )}

          <div class="mb-3">
            <label for="rest-note" class="form-label">
              Note (optional)
            </label>
            <textarea
              id="rest-note"
              name="note"
              class="form-control"
              rows={2}
              placeholder="Circumstances around this long rest..."
            >
              {values.note || ""}
            </textarea>
            {errors.note && <div class="invalid-feedback d-block">{errors.note}</div>}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/rest/long`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            <i class="bi bi-moon-stars me-2"></i>
            Complete Long Rest
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
