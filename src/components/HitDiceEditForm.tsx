import clsx from 'clsx';
import { HitDiceDisplay } from '@src/components/ui/HitDiceDisplay';
import type { HitDieType } from '@src/lib/dnd';

export interface HitDiceEditFormProps {
  characterId: string;
  allHitDice: HitDieType[];
  availableHitDice: HitDieType[];
  values?: Record<string, string>;
  errors?: Record<string, string>;
}

export const HitDiceEditForm = ({ characterId, allHitDice, availableHitDice, values, errors }: HitDiceEditFormProps) => {
  const action = values?.action || (availableHitDice.length < allHitDice.length ? 'restore' : 'spend');
  const dieValue = values?.die_value ? parseInt(values.die_value) : null;
  const hpRolled = values?.hp_rolled ? parseInt(values.hp_rolled) : null;

  // Calculate preview dice
  let previewAvailable = [...availableHitDice];
  let restoredCount = 0;
  if (action === 'restore') {
    // Long rest restores half of total dice (rounded down)
    const maxRestoration = Math.floor(allHitDice.length / 2);
    const currentlyUsed = allHitDice.length - availableHitDice.length;
    const toRestore = Math.min(maxRestoration, currentlyUsed);

    // Find used dice to restore (same logic as service)
    const usedDice = [...allHitDice];
    for (const die of availableHitDice) {
      const index = usedDice.indexOf(die);
      if (index !== -1) {
        usedDice.splice(index, 1);
      }
    }

    // Sort largest-first
    usedDice.sort((a, b) => b - a);

    // Preview: restore dice
    for (let i = 0; i < toRestore; i++) {
      if (usedDice[i]) {
        previewAvailable.push(usedDice[i]);
        restoredCount++;
      }
    }
  } else if (action === 'spend' && dieValue) {
    // Preview: spend the selected die
    const index = previewAvailable.indexOf(dieValue as HitDieType);
    if (index !== -1) {
      previewAvailable.splice(index, 1);
    }
  }

  const showPreview = (action === 'restore' && availableHitDice.length < allHitDice.length) || (action === 'spend' && dieValue);

  // Get unique available die types for dropdown
  const uniqueAvailableDice = Array.from(new Set(availableHitDice)).sort((a, b) => a - b);

  return (<>
    <div class="modal-header">
      <h5 class="modal-title">Edit Hit Dice</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <form
        id="hitdice-edit-form"
        hx-post={`/characters/${characterId}/edit/hitdice/check`}
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        {/* Current Hit Dice */}
        <div class="mb-3">
          <label class="form-label">Current Hit Dice</label>
          <HitDiceDisplay allHitDice={allHitDice} availableHitDice={availableHitDice} />
        </div>

        {/* Action: Long Rest or Spend */}
        <div class="mb-3">
          <label class="form-label">Action</label>
          <div class="btn-group w-100" role="group">
            <input
              type="radio"
              class="btn-check"
              name="action"
              id="action-restore"
              value="restore"
              checked={action === 'restore'}
              disabled={availableHitDice.length >= allHitDice.length}
              autocomplete="off"
            />
            <label class="btn btn-outline-success" for="action-restore">
              Long Rest (Restore Dice)
            </label>

            <input
              type="radio"
              class="btn-check"
              name="action"
              id="action-spend"
              value="spend"
              checked={action === 'spend'}
              disabled={availableHitDice.length === 0}
              autocomplete="off"
            />
            <label class="btn btn-outline-danger" for="action-spend">
              Spend Hit Die
            </label>
          </div>
        </div>

        {/* Spend: Die selection and HP rolled */}
        {action === 'spend' && (
          <>
            <div class="mb-3">
              <label for="die_value" class="form-label">Select Die to Spend</label>
              <select
                class={clsx('form-select', { 'is-invalid': errors?.die_value })}
                id="die_value"
                name="die_value"
                required
              >
                <option value="">Choose a die...</option>
                {uniqueAvailableDice.map(die => (
                  <option key={die} value={die} selected={dieValue === die}>
                    D{die}
                  </option>
                ))}
              </select>
              {errors?.die_value && <div class="invalid-feedback d-block">{errors.die_value}</div>}
            </div>

            {dieValue && (
              <div class="mb-3">
                <label for="hp_rolled" class="form-label">HP Rolled (1-{dieValue})</label>
                <input
                  type="number"
                  class={clsx('form-control', { 'is-invalid': errors?.hp_rolled })}
                  id="hp_rolled"
                  name="hp_rolled"
                  value={values?.hp_rolled || ''}
                  min="1"
                  max={dieValue}
                  required
                  placeholder="Enter HP rolled"
                />
                <small class="form-text text-muted">
                  Roll D{dieValue} to determine HP restored
                </small>
                {errors?.hp_rolled && <div class="invalid-feedback d-block">{errors.hp_rolled}</div>}
              </div>
            )}
          </>
        )}

        {/* Preview */}
        {showPreview && (
          <div class="mb-3">
            <label class="form-label">Preview</label>
            <HitDiceDisplay allHitDice={allHitDice} availableHitDice={previewAvailable} />
            <small class="form-text text-muted">
              {action === 'restore'
                ? `Long rest will restore ${restoredCount} hit dice`
                : `Spending D${dieValue}${hpRolled ? ` (restoring ${hpRolled} HP)` : ''}`
              }
            </small>
          </div>
        )}

        {/* Note */}
        <div class="mb-3">
          <label for="note" class="form-label">Note (Optional)</label>
          <textarea
            class="form-control"
            id="note"
            name="note"
            rows={2}
            placeholder="Add a note about this hit dice change..."
            value={values?.note || ''}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${characterId}/edit/hitdice`}
            hx-target="#character-info"
            hx-swap="outerHTML"
          >
            Update Hit Dice
          </button>
        </div>
      </form>
    </div>
  </>);
};
