import type { ProficiencyLevel, SkillType } from "@src/lib/dnd"
import { SkillAbilities, Skills } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"

export interface SkillEditFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const SkillEditForm = ({ character, values = {}, errors }: SkillEditFormProps) => {
  const skill = values.skill as SkillType | undefined
  if (!skill || !Skills.includes(skill)) {
    return (
      <ModalContent title="Error">
        <div class="alert alert-danger mb-0">Invalid skill specified.</div>
      </ModalContent>
    )
  }

  const skillScore = character.skills[skill]
  const ability = SkillAbilities[skill]
  const abilityAbbr = ability.slice(0, 3).toUpperCase()
  const abilityModifier = character.abilityScores[ability].modifier
  const proficiencyBonus = character.proficiencyBonus
  const currentModifier = skillScore.modifier
  const currentProficiency = skillScore.proficiency

  const proficiency = (values.proficiency as ProficiencyLevel) || currentProficiency
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  const getProficiencyIcon = (prof: ProficiencyLevel): string => {
    switch (prof) {
      case "none":
        return "bi-circle"
      case "half":
        return "bi-circle-half"
      case "proficient":
        return "bi-circle-fill"
      case "expert":
        return "bi-brightness-high-fill"
    }
  }

  // Calculate new modifier for preview
  let newModifier: number | undefined
  if (values?.proficiency !== currentProficiency) {
    const proficiency = values.proficiency
    switch (proficiency) {
      case "none":
        newModifier = abilityModifier
        break
      case "half":
        newModifier = abilityModifier + Math.floor(proficiencyBonus / 2)
        break
      case "proficient":
        newModifier = abilityModifier + proficiencyBonus
        break
      case "expert":
        newModifier = abilityModifier + proficiencyBonus * 2
        break
    }
  }

  const showPreview = newModifier !== undefined && proficiency !== currentProficiency

  return (
    <ModalContent title={`Edit ${skill.charAt(0).toUpperCase() + skill.slice(1)}`}>
      <form
        id="skill-edit-form"
        hx-post={`/characters/${character.id}/edit/${skill}`}
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation modal-body"
        novalidate
      >
        {/* is_check field */}
        <input type="hidden" name="is_check" value="true" />
        {/* skill field */}
        <input type="hidden" name="skill" value={skill} />

        {/* Current Skill Display */}
        <div class="mb-3">
          <p class="form-label">Current</p>
          <div class="border rounded p-2">
            <div class="d-flex align-items-center gap-2">
              <i
                class={`bi ${getProficiencyIcon(currentProficiency)} text-muted`}
                style="width: 24px; font-size: 1.2rem;"
              ></i>
              <span class="badge bg-secondary text-uppercase" style="width: 50px;">
                {abilityAbbr}
              </span>
              <span class="flex-grow-1 text-capitalize fw-medium">{skill}</span>
              <span class="badge text-bg-info fs-6">{formatModifier(currentModifier)}</span>
            </div>
          </div>
        </div>

        {/* Proficiency Level Radio Buttons */}
        <div class="mb-3">
          <label class="form-label" for="proficiency">
            Proficiency Level
          </label>
          <fieldset class="btn-group w-100">
            <input
              type="radio"
              class="btn-check"
              name="proficiency"
              id="prof-none"
              value="none"
              checked={proficiency === "none"}
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
              checked={proficiency === "half"}
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
              checked={proficiency === "proficient"}
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
              checked={proficiency === "expert"}
              autocomplete="off"
            />
            <label class="btn btn-outline-success" for="prof-expert">
              <i class="bi bi-brightness-high-fill"></i> Expert
            </label>
          </fieldset>
          {errors?.proficiency && <div class="invalid-feedback d-block">{errors.proficiency}</div>}
        </div>

        {/* Preview */}
        {showPreview && newModifier !== undefined && (
          <div class="mb-3">
            <p class="form-label">Preview</p>
            <div class="border rounded p-2">
              <div class="d-flex align-items-center gap-2">
                <i
                  class={`bi ${getProficiencyIcon(proficiency)} text-muted`}
                  style="width: 24px; font-size: 1.2rem;"
                ></i>
                <span class="badge bg-secondary text-uppercase" style="width: 50px;">
                  {abilityAbbr}
                </span>
                <span class="flex-grow-1 text-capitalize fw-medium">{skill}</span>
                <span class="badge text-bg-info fs-6">{formatModifier(newModifier)}</span>
              </div>
            </div>
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
            placeholder="Add a note about this skill change..."
            value={values?.note || ""}
          />
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/${skill}`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            Update Skill
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
