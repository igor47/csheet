import clsx from 'clsx';

import { Select } from '@src/components/ui/Select';
import { Classes, ClassNames } from '@src/lib/dnd';
import { toTitleCase } from '@src/lib/strings';

import type { CharLevel } from '@src/db/char_levels';

export interface ClassEditFormProps {
  characterId: string;
  currentClassLevel: CharLevel | null;  // null = multiclassing to new class
  values?: Record<string, string>;
  errors?: Record<string, string>;
}

export const ClassEditForm = ({ characterId, currentClassLevel, values, errors }: ClassEditFormProps) => {
  const selectedClass = values?.class ? Classes.find(c => c.name === values.class) : null;
  const subclasses = selectedClass?.subclasses || [];

  const level = values?.level ? parseInt(values.level) : 1;

  // Check if this class already has levels (continuing) or is new (multiclassing)
  const isFirstLevelInClass = currentClassLevel === null;

  // Show subclass dropdown if we're at the subclass selection level
  const showSubclass = subclasses.length > 0 && level === selectedClass!.subclassLevel;
  let subclassPlh;
  if (showSubclass) {
    subclassPlh = 'Select a subclass';
  } else if (selectedClass) {
    if (level < selectedClass.subclassLevel) {
      subclassPlh = `Subclasses available at level ${selectedClass.subclassLevel}`;
    } else {
      subclassPlh = 'Subclass has already been selected for this class';
    }
  } else {
    subclassPlh = 'Select a class first';
  }

  const hitDieMax = selectedClass?.hitDie || 12;
  const hitDieAvg = Math.ceil(hitDieMax / 2);

  // First level in any class = max hit die (disabled input)
  const hitDieReadonly = isFirstLevelInClass;
  const hitDieValue = isFirstLevelInClass
    ? hitDieMax.toString()
    : (values?.hit_die_roll || hitDieAvg).toString();
  const hitDieHelpText = isFirstLevelInClass
    ? "First level in this class grants maximum hit die"
    : `Roll D${selectedClass?.hitDie} to determine HP gained (or use the average: ${hitDieAvg})`;

  return (<>
    <div class="modal-header">
      <h5 class="modal-title">Add Level</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <form
        id="class-edit-form"
        hx-post={`/characters/${characterId}/edit/class/check`}
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        <div class="mb-3">
          <label for="class" class="form-label">Class</label>
          <Select
            name="class"
            id="class"
            options={ClassNames.map((cls) => (
              { value: cls, label: toTitleCase(cls) }
            ))}
            placeholder="Select a class"
            required
            error={errors?.class}
            value={values?.class}
          />
        </div>

        <div class="mb-3">
          <label for="level" class="form-label">Level</label>
          <input
            type="number"
            class={clsx('form-control', 'bg-secondary-subtle', 'text-muted', { 'is-invalid': errors?.level })}
            id="level"
            name="level"
            value={isFirstLevelInClass ? '1' : (values?.level || '')}
            readonly
          />
          <small class="form-text text-muted">
            Level is automatically calculated based on your current progress
          </small>
          {errors?.level && <div class="invalid-feedback d-block">{errors.level}</div>}
        </div>

        <div class="mb-3">
          <label for="subclass" class="form-label">Subclass</label>
          <Select
            name="subclass"
            id="subclass"
            options={subclasses.map((subcls) => (
              { value: subcls, label: toTitleCase(subcls) }
            ))}
            placeholder={subclassPlh}
            error={errors?.subclass}
            value={values?.subclass}
            disabled={!showSubclass}
            required={showSubclass}
          />
        </div>

        <div class="mb-3">
          <label for="hit_die_roll" class="form-label">Hit Die Roll (1-{hitDieMax})</label>
          <input
            type="number"
            class={clsx('form-control', {
              'bg-secondary-subtle text-muted': hitDieReadonly,
              'is-invalid': errors?.hit_die_roll
            })}
            id="hit_die_roll"
            name="hit_die_roll"
            value={hitDieValue}
            min="1"
            max={hitDieMax}
            required
            readonly={hitDieReadonly}
          />
          <small class="form-text text-muted">
            {hitDieHelpText}
          </small>
          {errors?.hit_die_roll && <div class="invalid-feedback d-block">{errors.hit_die_roll}</div>}
        </div>

        <div class="mb-3">
          <label for="note" class="form-label">Note (Optional)</label>
          <textarea
            class="form-control"
            id="note"
            name="note"
            rows={2}
            placeholder="Add a note about this level-up..."
            value={values?.note || ''}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${characterId}/edit/class`}
            hx-target="#editModalContent"
          >
            Add Level
          </button>
        </div>
      </form>
    </div>
  </>);
};
