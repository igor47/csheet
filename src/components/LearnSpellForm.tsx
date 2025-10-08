import { Select } from '@src/components/ui/Select';
import { spells, type Spell } from '@src/lib/dnd/spells';
import { type ClassNameType } from '@src/lib/dnd';
import { toTitleCase } from '@src/lib/strings';
import type { ComputedCharacter } from '@src/services/computeCharacter';

export interface LearnSpellFormProps {
  character: ComputedCharacter;
  values?: Record<string, string>;
  errors?: Record<string, string>;
}

function LearnSpellFormBody({ character, values={}, errors={}, }: LearnSpellFormProps) {
  const spellInfos = character.spells.filter(
    sc => sc.spellcastingType !== 'none' && (sc.maxSpellsKnown > 0 || sc.class === 'wizard')
  );
  const onlyOneSI = spellInfos.length === 1;
  const classOptions = spellInfos.map(si => ({
    value: si.class,
    label: toTitleCase(si.class),
  }))

  if (!(values.class && spellInfos.map(si => si.class).includes(values.class as ClassNameType))) {
    values.class = spellInfos[0]!.class;
  }

  // Initialize spell_type if not set
  if (!values.spell_type) {
    values.spell_type = 'spell';
  }

  const selectedClassName = values.class as ClassNameType;
  const selectedSI = spellInfos.find(si => si.class === selectedClassName)!;
  const isCantrip = values.spell_type === 'cantrip';
  const allowHighLevel = values.allowHighLevel === 'true';

  // Show evict spell dropdown if at max spells
  const currentList = isCantrip ? selectedSI.cantrips : selectedSI.knownSpells;
  const maxSpells = isCantrip ? selectedSI.maxCantrips : selectedSI.maxSpellsKnown;
  const isAtMaxSpells = (
    selectedSI.spellcastingType === 'known' && currentList.length >= maxSpells
  );
  const showEvictDropdown = isAtMaxSpells;
  const knownSpells = currentList.map(
    id => spells.find(s => s.id === id)
  ).filter(Boolean) as Spell[];
  const evictSpellOptions = knownSpells.map(s => ({
    value: s.id,
    label: `${s.name} (Level ${s.level === 0 ? 'Cantrip' : s.level})`,
  }));

  // figure out which spells are available to learn
  const maxSpellLevel = allowHighLevel ? 9 : selectedSI.maxSpellLevel;
  const classLevelSpells = spells.filter(
    s => s.classes.includes(selectedClassName)
      && (isCantrip ? s.level === 0 : s.level > 0 && s.level <= maxSpellLevel)
  );
  const availableSpells = classLevelSpells.filter(
    s => !currentList.includes(s.id)
  ).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.name.localeCompare(b.name);
  });
  const selectedSpell = availableSpells.find(
    s => s.id === values.spell_id
  ) || null;

  // helper text
  const actionText = selectedClassName === 'wizard' ? 'Add to Spellbook' : 'Learn';

  return (
    <div class="modal-body">
      <form
        id="learn-spell-form"
        hx-post={`/characters/${character.id}/learn-spell`}
        hx-vals='{"is_check": "true"}'
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
            required={true}
            error={errors.class}
            value={values.class}
            disabled={onlyOneSI}
          />
          {onlyOneSI && (<>
            <input type="hidden" name="class" value={values.class} />
            <small class="form-text text-muted">
              Only one spellcasting class available
            </small>
          </>)}
        </div>

        {/* Spell Type Selection */}
        <div class="mb-3">
          <div class="btn-group" role="group" aria-label="Spell Type">
            <input
              type="radio"
              class="btn-check"
              name="spell_type"
              id="spell_type_cantrip"
              value="cantrip"
              checked={values.spell_type === 'cantrip'} />
            <label class="btn btn-outline-primary" for="spell_type_cantrip">Cantrips</label>

            <input
              type="radio"
              class="btn-check"
              name="spell_type"
              id="spell_type_spell"
              value="spell"
              checked={values.spell_type === 'spell'} />
            <label class="btn btn-outline-primary" for="spell_type_spell">Spells</label>
          </div>
        </div>

        {/* Allow High-Level Spells */}
        <div class="mb-3">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              name="allowHighLevel"
              id="allowHighLevel"
              value="true"
              checked={values.allowHighLevel === 'true'}
            />
            <label class="form-check-label" for="allowHighLevel">
              Show spells above my maximum spell level
            </label>
          </div>
          {errors?.allowHighLevel && <div class="invalid-feedback d-block">{errors.allowHighLevel}</div>}
        </div>

        {/* Options when at max spells */}
        {showEvictDropdown && (
        <>
        <div class="alert alert-info">
          You are at maximum {isCantrip ? 'cantrips' : 'spells'} known ({currentList.length}/{maxSpells}).
          You can either forget a spell to learn a new one, or allow learning extra spells.
        </div>

        <div class="mb-3">
          <label for="forget_spell_id" class="form-label">Spell to Forget (Optional)</label>
          <Select
            name="forget_spell_id"
            id="forget_spell_id"
            options={evictSpellOptions}
            placeholder="Select a spell to forget"
            error={errors?.forget_spell_id}
            value={values.forget_spell_id}
          />
        </div>

        {values.forget_spell_id && (
        <>
        <div class="alert alert-info">
          A {selectedClassName} can replace one {isCantrip ? 'cantrip' : 'spell'} only while leveling up.
          Confirm that you are able to replace this {isCantrip ? 'cantrip' : 'spell'}.
        </div>

        <div class="mb-3">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              name="allowForgetting"
              id="allowForgetting"
              value="true"
              checked={values.allowForgetting === 'true'}
            />
            <label class="form-check-label" for="allowForgetting">
              Allow forgetting this spell
            </label>
          </div>
          {errors?.allowForgetting && <div class="invalid-feedback d-block">{errors.allowForgetting}</div>}
        </div>
        </>
        )}

        <div class="mb-3">
          <div class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              name="allowExtraSpells"
              id="allowExtraSpells"
              value="true"
              checked={values.allowExtraSpells === 'true'}
              disabled={!!values.forget_spell_id}
            />
            <label class="form-check-label" for="allowExtraSpells">
              Allow learning extra {isCantrip ? 'cantrips' : 'spells'} (bypass maximum)
            </label>
          </div>
          {errors?.allowExtraSpells && <div class="invalid-feedback d-block">{errors.allowExtraSpells}</div>}
        </div>
        </>
        )}

        {/* Spell Selection */}
        {availableSpells.length > 0 && (
          <div class="mb-3">
            <label class="form-label">Select Spell {actionText}</label>
            <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
              {availableSpells.map((spell) => (
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    name="spell_id"
                    id={`spell-${spell.id}`}
                    value={spell.id}
                    checked={values.spell_id === spell.id}
                  />
                  <label class="form-check-label" for={`spell-${spell.id}`}>
                    {spell.name} (Level {spell.level === 0 ? 'Cantrip' : spell.level})
                    <br />
                    <small class="text-muted">{spell.briefDescription}</small>
                  </label>
                </div>
              ))}
            </div>
            {errors?.spell_id && <div class="invalid-feedback d-block">{errors.spell_id}</div>}
          </div>
        )}

        {availableSpells.length === 0 && (
          <div class="alert alert-warning">
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
            hx-post={`/characters/${character.id}/learn-spell`}
            hx-vals='{}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
            disabled={!selectedSpell}
          >
            {showEvictDropdown ? 'Replace Spell' : 'Learn Spell'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const LearnSpellForm = ({
  character,
  values = {},
  errors = {},
}: LearnSpellFormProps) => {
  const spellcastingSIs = character.spells.filter(
    si => (si.spellcastingType !== 'none')
  );
  const learnableSIs = spellcastingSIs.filter(
    si => (si.maxSpellsKnown > 0 || si.class === 'wizard')
  );

  let body;
  if (spellcastingSIs.length === 0) {
    body = (
      <div class="modal-body">
        <div class="alert alert-warning">
          {character.name} has no spellcasting classes.
        </div>
      </div>
    )
  } else if (learnableSIs.length === 0) {
    body = (
      <div class="modal-body">
        <div class="alert alert-warning">
          {character.name} cannot learn new spells.
        </div>
      </div>
    )
  } else {
    body = <LearnSpellFormBody character={character} values={values} errors={errors} />;
  }

  return (<>
    <div class="modal-header">
      <h5 class="modal-title">Learn Spell</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    {body}
  </>);
};
