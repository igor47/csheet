import { clsx } from 'clsx';

import { Select } from '@src/components/ui/Select';
import { SpellPicker } from '@src/components/ui/SpellPicker';
import { SpellDetail } from '@src/components/SpellDetail';
import { spells, type Spell } from '@src/lib/dnd/spells';
import { type ClassNameType } from '@src/lib/dnd';
import { toTitleCase } from '@src/lib/strings';
import type { ComputedCharacter } from '@src/services/computeCharacter';
import { ModalContent } from './ui/ModalContent';

export interface PrepareSpellFormProps {
  character: ComputedCharacter;
  values?: Record<string, string>;
  errors?: Record<string, string>;
}

function PrepareSpellFormBody({ character, values = {}, errors = {} }: PrepareSpellFormProps) {
  // Get all spellcasting classes
  const spellInfos = character.spells;
  const onlyOneClass = spellInfos.length === 1;
  const classOptions = spellInfos.map(si => ({
    value: si.class,
    label: toTitleCase(si.class),
  }));

  // Default class to first available if not set
  if (!(values.class && spellInfos.map(si => si.class).includes(values.class as ClassNameType))) {
    values.class = spellInfos[0]!.class;
  }

  // Default type to 'spell' if not set
  if (!values.spell_type) {
    values.spell_type = 'spell';
  }

  const selectedClassName = values.class as ClassNameType;
  const selectedSI = spellInfos.find(si => si.class === selectedClassName)!;
  const isCantrip = values.spell_type === 'cantrip';

  // Get current spell being replaced (if any)
  const hasOpenSlot = isCantrip ? selectedSI.cantripSlots.some(s => s.spell_id === null) : selectedSI.preparedSpells.some(s => s.spell_id === null);
  if (hasOpenSlot) {
    values.current_spell_id = '';
  }

  const currentlyPrepared = isCantrip ? selectedSI.cantripSlots.filter(s => s.spell_id !== null) : selectedSI.preparedSpells.filter(s => s.spell_id !== null);
  const replaceableIds = currentlyPrepared.filter(s => !s.alwaysPrepared).map(s => s.spell_id);
  const replaceOpts = replaceableIds.map(id => ({
    value: id!,
    label: spells.find(s => s.id === id)!.name,
  }))

  // Get all prepared spells across ALL classes to avoid duplicates
  const alreadyPreppedIds: string[] = [];
  for (const si of spellInfos) {
    const slots = isCantrip ? si.cantripSlots : si.preparedSpells;
    for (const slot of slots) {
      if (slot.spell_id !== null) {
        alreadyPreppedIds.push(slot.spell_id);
      }
    }
  }

  // Filter available spells based on class and type
  let availableSpells: Spell[];

  if (selectedSI.knownSpells !== null) {
    // Wizard
    if (isCantrip) {
      // Wizards can prepare ANY wizard cantrip (not limited to spellbook)
      availableSpells = spells
        .filter(s => s.classes.includes('wizard'))
        .filter(s => s.level === 0)
        .filter(s => !alreadyPreppedIds.includes(s.id))
        .sort((a, b) => {
          if (a.level !== b.level) return a.level - b.level;
          return a.name.localeCompare(b.name);
        });
    } else {
      // Wizards can only prepare leveled spells from their spellbook
      availableSpells = selectedSI.knownSpells
        .map(spellId => spells.find(s => s.id === spellId))
        .filter(Boolean)
        .filter(s => s!.level > 0)
        .filter(s => !alreadyPreppedIds.includes(s!.id))
        .sort((a, b) => {
          if (a!.level !== b!.level) return a!.level - b!.level;
          return a!.name.localeCompare(b!.name);
        }) as Spell[];
    }
  } else {
    // Other classes: can prepare any spell from class list
    availableSpells = spells
      .filter(s => s.classes.includes(selectedClassName))
      .filter(s => isCantrip ? s.level === 0 : (s.level > 0 && s.level <= selectedSI.maxSpellLevel))
      .filter(s => !alreadyPreppedIds.includes(s.id))
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return a.name.localeCompare(b.name);
      });
  }

  const selectedSpell = availableSpells.find(s => s.id === values.spell_id) || null;

  const slotTypeLabel = isCantrip ? 'cantrip' : 'spell';
  const actionText = values.current_spell_id ? 'Replace' : 'Prepare';

  const replaceClass = clsx("card mb-3", {
    'text-bg-warning': selectedSI.changePrepared === 'levelup',
    'text-bg-info': selectedSI.changePrepared === 'longrest',
  })
  const replaceMessage = selectedSI.changePrepared === 'levelup'
    ? `A ${selectedSI.class} can only swap a single prepared ${slotTypeLabel}s when they level up.`
    : `A ${selectedSI.class} can change prepared ${slotTypeLabel}s after a long rest.`;

  return (
    <div class="modal-body">
      <form
        id="prepare-spell-form"
        hx-post={`/characters/${character.id}/edit/prepspell`}
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
            error={errors?.class}
            value={values.class}
            disabled={onlyOneClass}
          />
          {onlyOneClass && (
            <>
              <input type="hidden" name="class" value={values.class} />
              <small class="form-text text-muted">
                Only one spellcasting class available
              </small>
            </>
          )}
          {errors?.class && (
            <div class="invalid-feedback d-block">
              {errors.class}
            </div>
          )}
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

        {/* Hidden field for current spell (if replacing) */}
        {!hasOpenSlot && (
        <>
          <div class={replaceClass}>
            <div class="card-header">No open {slotTypeLabel} slots available.</div>
            <div class="card-body">
              <h5 class="card-title">You must replace an existing {slotTypeLabel}</h5>
              <p class="card-text">{replaceMessage}</p>
            </div>
          </div>

          <div class="mb-3">
            <label for="current_spell_id" class="form-label">Replace Which {toTitleCase(slotTypeLabel)}?</label>
            <Select
              name="current_spell_id"
              id="current_spell_id"
              placeholder={`Select a ${slotTypeLabel} to replace`}
              required={true}
              error={errors?.current_spell_id}
              value={values.current_spell_id}
              options={replaceOpts}
              />
          </div>
        </>
        )}

        {/* Spell Selection */}
        <SpellPicker
          spells={availableSpells}
          selectedSpellId={values.spell_id}
          label={`Select ${toTitleCase(slotTypeLabel)} to Prepare`}
          error={errors?.spell_id}
          emptyMessage={`No ${slotTypeLabel}s available${selectedSI.knownSpells !== null && !isCantrip ? ' in your spellbook' : ''}.`}
        />

        {/* Spell Detail */}
        {selectedSpell && <SpellDetail spell={selectedSpell} compact={true} class="mb-3" />}

        {/* Note */}
        <div class="mb-3">
          <label for="note" class="form-label">Note (Optional)</label>
          <textarea
            class="form-control"
            id="note"
            name="note"
            rows={2}
            placeholder={`Add a note about ${values.current_spell_id ? 'replacing' : 'preparing'} this ${slotTypeLabel}...`}
            value={values?.note || ''}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/prepspell`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
            disabled={!selectedSpell}
          >
            {actionText} {toTitleCase(slotTypeLabel)}
          </button>
        </div>
      </form>
    </div>
  );
}

export const PrepareSpellForm = ({
  character,
  values = {},
  errors = {},
}: PrepareSpellFormProps) => {
  const spellcastingSIs = character.spells;

  if (spellcastingSIs.length === 0) {
    return (
      <ModalContent title="Prepare Spell">
        <div class="alert alert-warning">
          {character.name} has no spellcasting classes.
        </div>
      </ModalContent>
    )
  }

  return (
    <ModalContent title="Prepare Spell">
      <PrepareSpellFormBody character={character} values={values} errors={errors} />
    </ModalContent>
  )
};
