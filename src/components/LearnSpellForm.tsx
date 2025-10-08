import clsx from 'clsx';
import { Select } from '@src/components/ui/Select';
import { spells, type Spell } from '@src/lib/dnd/spells';
import { Classes, type ClassNameType } from '@src/lib/dnd';
import { toTitleCase } from '@src/lib/strings';
import type { SpellInfoForClass } from '@src/services/computeSpells';

export interface LearnSpellFormProps {
  characterId: string;
  spellcastingClasses: SpellInfoForClass[];
  values?: Record<string, string>;
  errors?: Record<string, string>;
  availableSpells?: Spell[];
  currentlyKnownSpellIds?: string[];
  selectedSpell?: Spell;
  isAtMaxSpells?: boolean;
}

export const LearnSpellForm = ({
  characterId,
  spellcastingClasses,
  values,
  errors,
  availableSpells,
  currentlyKnownSpellIds,
  selectedSpell,
  isAtMaxSpells,
}: LearnSpellFormProps) => {
  const selectedClass = values?.class as ClassNameType | undefined;
  const selectedSpellId = values?.spell_id;
  const forgetSpellId = values?.forget_spell_id;

  // Check if only one class
  const onlyOneClass = spellcastingClasses.length === 1;
  const defaultClass = onlyOneClass ? spellcastingClasses[0].class : undefined;

  // Get class options
  const classOptions = spellcastingClasses.map(sc => ({
    value: sc.class,
    label: toTitleCase(sc.class),
  }));

  // Show evict spell dropdown if at max spells
  const showEvictDropdown = isAtMaxSpells && selectedClass;

  // Get currently known spells for eviction dropdown
  const knownSpellsForEviction = currentlyKnownSpellIds
    ? currentlyKnownSpellIds
        .map(id => spells.find(s => s.id === id))
        .filter(Boolean) as Spell[]
    : [];

  const evictSpellOptions = knownSpellsForEviction.map(s => ({
    value: s.id,
    label: `${s.name} (Level ${s.level === 0 ? 'Cantrip' : s.level})`,
  }));

  return (<>
    <div class="modal-header">
      <h5 class="modal-title">Learn Spell</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <form
        id="learn-spell-form"
        hx-post={`/characters/${characterId}/learn-spell/check`}
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        {/* Class Selection */}
        <div class="mb-3">
          <label for="class" class="form-label">Class</label>
          <Select
            name="class"
            id="class"
            options={classOptions}
            placeholder="Select a class"
            required
            error={errors?.class}
            value={values?.class || defaultClass}
            disabled={onlyOneClass}
          />
          {onlyOneClass && (
            <small class="form-text text-muted">
              Only one spellcasting class available
            </small>
          )}
        </div>

        {/* Evict Spell (if at max) */}
        {showEvictDropdown && (
          <div class="mb-3">
            <label for="forget_spell_id" class="form-label">Spell to Forget</label>
            <Select
              name="forget_spell_id"
              id="forget_spell_id"
              options={evictSpellOptions}
              placeholder="Select a spell to forget"
              required
              error={errors?.forget_spell_id}
              value={forgetSpellId}
            />
            <small class="form-text text-muted">
              You are at maximum spells known. Select a spell to forget in order to learn a new one.
            </small>
          </div>
        )}

        {/* Spell Selection */}
        {selectedClass && availableSpells && availableSpells.length > 0 && (
          <div class="mb-3">
            <label class="form-label">Select Spell to Learn</label>
            <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
              {availableSpells.map((spell) => (
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="spell_id"
                    id={`spell-${spell.id}`}
                    value={spell.id}
                    checked={selectedSpellId === spell.id}
                  />
                  <label class="form-check-label" for={`spell-${spell.id}`}>
                    {spell.name} (Level {spell.level === 0 ? 'Cantrip' : spell.level})
                  </label>
                </div>
              ))}
            </div>
            {errors?.spell_id && <div class="invalid-feedback d-block">{errors.spell_id}</div>}
          </div>
        )}

        {selectedClass && availableSpells && availableSpells.length === 0 && (
          <div class="alert alert-info">
            No spells available to learn for this class at your current level.
          </div>
        )}

        {/* Spell Detail (inline) */}
        {selectedSpell && (
          <div class="mb-3">
            <div class="card">
              <div class="card-header">
                <strong>{selectedSpell.name}</strong>
                {selectedSpell.ritual && <span class="badge bg-secondary ms-2">Ritual</span>}
              </div>
              <div class="card-body">
                <p class="text-muted mb-2">
                  <em>
                    {selectedSpell.level === 0 ? 'Cantrip' : `Level ${selectedSpell.level}`}{' '}
                    {toTitleCase(selectedSpell.school)}
                  </em>
                </p>
                <p class="small">{selectedSpell.briefDescription}</p>
                {selectedSpell.description && (
                  <details class="small">
                    <summary>Full Description</summary>
                    <p class="mt-2">{selectedSpell.description}</p>
                  </details>
                )}
              </div>
            </div>
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
            placeholder="Add a note about learning this spell..."
            value={values?.note || ''}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${characterId}/learn-spell`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
            disabled={!selectedSpellId}
          >
            {showEvictDropdown ? 'Replace Spell' : 'Learn Spell'}
          </button>
        </div>
      </form>
    </div>
  </>);
};
