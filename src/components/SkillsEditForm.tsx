import type { ProficiencyLevel, SkillType } from "@src/lib/dnd"
import { ProficiencyLevels, SkillAbilities, Skills } from "@src/lib/dnd"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import clsx from "clsx"
import { ModalContent } from "./ui/ModalContent"

export interface SkillsEditFormProps {
  character: ComputedCharacter
  values?: Record<string, string>
  errors?: Record<string, string>
}

interface SkillEditRowProps {
  skill: SkillType
  character: ComputedCharacter
  values: Record<string, string>
  errors?: Record<string, string>
}

const SkillEditRow = ({ skill, character, values, errors = {} }: SkillEditRowProps) => {
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  // Sanitize skill name for form fields (replace spaces with underscores)
  const sanitizedSkill = skill.replace(/\s+/g, "_")
  const proficiencyFieldName = `${sanitizedSkill}_proficiency`

  const skillData = character.skills[skill]
  const currentProficiency = skillData.proficiency
  const currentModifier = skillData.modifier

  const ability = SkillAbilities[skill]
  const abilityAbbr = ability.slice(0, 3).toUpperCase()
  const abilityModifier = character.abilityScores[ability].modifier
  const proficiencyBonus = character.proficiencyBonus

  // If proficiencyFieldName exists in values, use it; otherwise use current
  const newProficiency: ProficiencyLevel =
    proficiencyFieldName in values
      ? (values[proficiencyFieldName] as ProficiencyLevel)
      : currentProficiency

  const changed = newProficiency !== currentProficiency

  // Calculate new modifier for preview
  const calculateModifier = (proficiency: ProficiencyLevel): number => {
    switch (proficiency) {
      case "none":
        return abilityModifier
      case "half":
        return abilityModifier + Math.floor(proficiencyBonus / 2)
      case "proficient":
        return abilityModifier + proficiencyBonus
      case "expert":
        return abilityModifier + proficiencyBonus * 2
    }
  }

  const newModifier = calculateModifier(newProficiency)

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

  // Capitalize skill name
  const skillDisplay = skill.charAt(0).toUpperCase() + skill.slice(1)

  return (
    <div
      class={clsx("row align-items-center border border-2 rounded py-2 px-1 px-md-3 mb-2", {
        "border-primary": changed,
      })}
    >
      {/* Skill Column */}
      <div class="col-4">
        <div class="d-flex align-items-center gap-2">
          <span
            class="badge bg-secondary text-uppercase d-none d-md-inline"
            style="width: 40px; font-size: 0.7rem;"
          >
            {abilityAbbr}
          </span>
          <span class="text-capitalize fw-medium">{skillDisplay}</span>
        </div>
      </div>

      {/* Modifier Column */}
      <div class="col-4">
        <div class="d-flex align-items-center gap-2">
          <span class="badge text-bg-secondary">{formatModifier(currentModifier)}</span>
          {changed && (
            <>
              <i class="bi bi-arrow-right text-muted" style="font-size: 0.8rem;"></i>
              <span class="badge text-bg-primary">{formatModifier(newModifier)}</span>
            </>
          )}
        </div>
      </div>

      {/* Proficiency Column */}
      <div class="col-4 p-0">
        <fieldset class="btn-group btn-group-sm">
          {ProficiencyLevels.map((level) => (
            <>
              <input
                type="radio"
                class="btn-check"
                name={proficiencyFieldName}
                id={`${proficiencyFieldName}_${level}`}
                value={level}
                checked={newProficiency === level}
                autocomplete="off"
              />
              <label
                class={clsx("btn", {
                  "btn-outline-secondary": level === "none" || level === "half",
                  "btn-outline-primary": level === "proficient",
                  "btn-outline-success": level === "expert",
                })}
                for={`${proficiencyFieldName}_${level}`}
                style="font-size: 0.7rem;"
                title={level}
              >
                <i class={clsx("bi", getProficiencyIcon(level))}></i>
              </label>
            </>
          ))}
        </fieldset>
        {errors[proficiencyFieldName] && (
          <div class="invalid-feedback d-block mt-1" style="font-size: 0.75rem;">
            {errors[proficiencyFieldName]}
          </div>
        )}
      </div>
    </div>
  )
}

export const SkillsEditForm = ({ character, values = {}, errors = {} }: SkillsEditFormProps) => {
  return (
    <ModalContent title="Edit Skills">
      <form
        id="skills-edit-form"
        hx-post={`/characters/${character.id}/edit/skills`}
        hx-vals='{"is_check": "true"}'
        hx-trigger="change delay:300ms"
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        class="needs-validation"
        novalidate
      >
        <div class="modal-body">
          {/* Header Row */}
          <div class="row fw-bold text-muted mb-2 px-1 px-md-3" style="font-size: 0.85rem;">
            <div class="col-4">Skill</div>
            <div class="col-4">Modifier</div>
            <div class="col-4 p-0">Proficiency</div>
          </div>

          {/* Skill Rows */}
          <div class="mb-3">
            {Skills.map((skill) => (
              <SkillEditRow skill={skill} character={character} values={values} errors={errors} />
            ))}
          </div>

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
              placeholder="Add a note about these skill changes..."
              value={values?.note || ""}
            />
          </div>

          {/* General Errors */}
          {errors?.general && (
            <div class="alert alert-danger" role="alert">
              {errors.general}
            </div>
          )}
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            hx-post={`/characters/${character.id}/edit/skills`}
            hx-vals='{"is_check": "false"}'
            hx-target="#editModalContent"
            hx-swap="innerHTML"
          >
            Update Skills
          </button>
        </div>
      </form>
    </ModalContent>
  )
}
