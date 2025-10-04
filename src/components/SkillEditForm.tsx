import clsx from 'clsx';
import type { SkillType, ProficiencyLevel } from '@src/lib/dnd';

export interface SkillEditFormProps {
  characterId: string;
  skill: SkillType;
  abilityAbbr: string;
  currentModifier: number;
  currentProficiency: ProficiencyLevel;
  newModifier?: number;
  values?: Record<string, string>;
  errors?: Record<string, string>;
}

export const SkillEditForm = ({
  characterId,
  skill,
  abilityAbbr,
  currentModifier,
  currentProficiency,
  newModifier,
  values,
  errors
}: SkillEditFormProps) => {
  const proficiency = (values?.proficiency as ProficiencyLevel) || currentProficiency;
  const formatModifier = (value: number) => value >= 0 ? `+${value}` : `${value}`;

  const getProficiencyIcon = (prof: ProficiencyLevel): string => {
    switch (prof) {
      case 'none':
        return 'bi-circle';
      case 'half':
        return 'bi-circle-half';
      case 'proficient':
        return 'bi-circle-fill';
      case 'expert':
        return 'bi-brightness-high-fill';
    }
  };

  const showPreview = newModifier !== undefined && proficiency !== currentProficiency;

  return (<>
    <div class="modal-header">
      <h5 class="modal-title">Edit {skill.charAt(0).toUpperCase() + skill.slice(1)}</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <form
        id="skill-edit-form"
        hx-post={`/characters/${characterId}/edit/${skill}/check`}
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        {/* Current Skill Display */}
        <div class="mb-3">
          <label class="form-label">Current</label>
          <div class="border rounded p-2">
            <div class="d-flex align-items-center gap-2">
              <i class={`bi ${getProficiencyIcon(currentProficiency)} text-muted`} style="width: 24px; font-size: 1.2rem;"></i>
              <span class="badge bg-secondary text-uppercase" style="width: 50px;">{abilityAbbr}</span>
              <span class="flex-grow-1 text-capitalize fw-medium">{skill}</span>
              <span class="badge text-bg-info fs-6">{formatModifier(currentModifier)}</span>
            </div>
          </div>
        </div>

        {/* Proficiency Level Radio Buttons */}
        <div class="mb-3">
          <label class="form-label">Proficiency Level</label>
          <div class="btn-group w-100" role="group">
            <input
              type="radio"
              class="btn-check"
              name="proficiency"
              id="prof-none"
              value="none"
              checked={proficiency === 'none'}
              autocomplete="off"
            />
            <label class="btn btn-outline-secondary" for="prof-none">
              <i class="bi bi-circle"></i> None
            </label>

            <input
              type="radio"
              class="btn-check"
              name="proficiency"
              id="prof-half"
              value="half"
              checked={proficiency === 'half'}
              autocomplete="off"
            />
            <label class="btn btn-outline-secondary" for="prof-half">
              <i class="bi bi-circle-half"></i> Half
            </label>

            <input
              type="radio"
              class="btn-check"
              name="proficiency"
              id="prof-proficient"
              value="proficient"
              checked={proficiency === 'proficient'}
              autocomplete="off"
            />
            <label class="btn btn-outline-primary" for="prof-proficient">
              <i class="bi bi-circle-fill"></i> Proficient
            </label>

            <input
              type="radio"
              class="btn-check"
              name="proficiency"
              id="prof-expert"
              value="expert"
              checked={proficiency === 'expert'}
              autocomplete="off"
            />
            <label class="btn btn-outline-success" for="prof-expert">
              <i class="bi bi-brightness-high-fill"></i> Expert
            </label>
          </div>
          {errors?.proficiency && <div class="invalid-feedback d-block">{errors.proficiency}</div>}
        </div>

        {/* Preview */}
        {showPreview && newModifier !== undefined && (
          <div class="mb-3">
            <label class="form-label">Preview</label>
            <div class="border rounded p-2">
              <div class="d-flex align-items-center gap-2">
                <i class={`bi ${getProficiencyIcon(proficiency)} text-muted`} style="width: 24px; font-size: 1.2rem;"></i>
                <span class="badge bg-secondary text-uppercase" style="width: 50px;">{abilityAbbr}</span>
                <span class="flex-grow-1 text-capitalize fw-medium">{skill}</span>
                <span class="badge text-bg-info fs-6">{formatModifier(newModifier)}</span>
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
            placeholder="Add a note about this skill change..."
            value={values?.note || ''}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${characterId}/edit/${skill}`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            Update Skill
          </button>
        </div>
      </form>
    </div>
  </>);
};
