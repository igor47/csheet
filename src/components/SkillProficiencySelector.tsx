import type { ClassNameType } from "@src/lib/dnd"
import { Skills, type SkillType } from "@src/lib/dnd"
import { getRuleset, type RulesetId } from "@src/lib/dnd/rulesets"
import { toTitleCase } from "@src/lib/strings"
import clsx from "clsx"

interface SkillProficiencySelectorProps {
  values?: Record<string, string>
  selectedClass?: ClassNameType
  selectedBackground?: string
  rulesetId: RulesetId
  errors?: Record<string, string>
}

export const SkillProficiencySelector = ({
  values,
  selectedClass,
  selectedBackground,
  rulesetId,
  errors,
}: SkillProficiencySelectorProps) => {
  // Don't show if no class selected
  if (!selectedClass) {
    return null
  }

  const ruleset = getRuleset(rulesetId)
  const classDef = ruleset.classes[selectedClass]
  const skillChoices = classDef.skillChoices

  // Get background-granted skills
  const backgroundSkills: SkillType[] = []
  if (selectedBackground) {
    const background = ruleset.backgrounds[selectedBackground]
    if (background?.skillProficiencies) {
      backgroundSkills.push(...background.skillProficiencies)
    }
  }

  // Parse current selections from form
  const selectedSkills: SkillType[] = []
  for (const skill of skillChoices.from) {
    const fieldName = `class_proficiency_${skill.replace(/\s+/g, "_")}`
    if (values?.[fieldName] === "on" || values?.[fieldName] === "true") {
      selectedSkills.push(skill)
    }
  }

  const selectedCount = selectedSkills.length

  return (
    <div class="mb-3">
      <div class="form-label">Skill Proficiencies</div>

      {/* Display general error if present */}
      {errors?.class_skills && <div class="alert alert-danger mb-3">{errors.class_skills}</div>}

      {/* Background-granted skills */}
      {backgroundSkills.length > 0 && (
        <div class="alert alert-light mb-3">
          <h6 class="mb-2">From Background ({toTitleCase(selectedBackground || "")})</h6>
          <ul class="mb-0">
            {backgroundSkills.map((skill) => (
              <li class="text-capitalize">{skill}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Class skill choices */}
      <div class="card">
        <div class="card-body p-3">
          <h6 class="mb-3">
            Choose {skillChoices.choose} from {toTitleCase(selectedClass)} skills
          </h6>

          <div class="row g-2 mb-3">
            {skillChoices.from.map((skill) => {
              const isFromBackground = backgroundSkills.includes(skill)
              const fieldName = `class_proficiency_${skill.replace(/\s+/g, "_")}`
              const isSelected = selectedSkills.includes(skill)
              const hasError = errors?.[fieldName]

              return (
                <div class="col-md-6 col-12" key={skill}>
                  <div class="form-check">
                    <input
                      type="checkbox"
                      class={clsx("form-check-input", { "is-invalid": hasError })}
                      id={fieldName}
                      name={fieldName}
                      value="true"
                      checked={isSelected}
                      disabled={isFromBackground}
                    />
                    <label class="form-check-label text-capitalize" for={fieldName}>
                      {skill}
                      {isFromBackground && (
                        <span class="badge bg-secondary ms-2">From Background</span>
                      )}
                    </label>
                    {hasError && <div class="invalid-feedback d-block">{errors[fieldName]}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          <div
            class={clsx("mt-2", {
              "text-success": selectedCount === skillChoices.choose,
              "text-danger": selectedCount !== skillChoices.choose,
            })}
          >
            <strong>
              Selected: {selectedCount} / {skillChoices.choose}
            </strong>
            {selectedCount !== skillChoices.choose && (
              <span class="ms-2">(select {skillChoices.choose - selectedCount} more)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
