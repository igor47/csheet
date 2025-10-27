import { type ProficiencyLevel, Skills, type SkillType } from "@src/lib/dnd"
import { getEffectTooltip, hasEffect } from "@src/lib/effectTooltip"
import type { ComputedCharacter, SkillScore } from "@src/services/computeCharacter"
import { clsx } from "clsx"

interface SkillRowProps {
  skill: SkillType
  skillScore: SkillScore
  hasEffect?: boolean
  effectTooltip?: string
}

const SkillRow = ({ skill, skillScore, hasEffect = false, effectTooltip }: SkillRowProps) => {
  const formatModifier = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

  const getProficiencyIcon = (proficiency: ProficiencyLevel): string => {
    switch (proficiency) {
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

  const abilityAbbr = skillScore.ability.slice(0, 3).toUpperCase()

  const tooltipAttrs =
    hasEffect && effectTooltip
      ? { "data-bs-toggle": "tooltip", "data-bs-placement": "top", title: effectTooltip }
      : {}

  return (
    <div
      class={clsx("list-group-item d-flex align-items-center gap-2 py-1 px-2", {
        "border-primary border-2": hasEffect,
      })}
      {...tooltipAttrs}
    >
      <i
        class={`bi ${getProficiencyIcon(skillScore.proficiency)} text-muted`}
        style="width: 16px;"
      ></i>
      <span class="badge bg-secondary text-uppercase" style="width: 40px; font-size: 0.7rem;">
        {abilityAbbr}
      </span>
      <span class="flex-grow-1 text-capitalize">{skill}</span>
      <span class="badge text-bg-info">{formatModifier(skillScore.modifier)}</span>
    </div>
  )
}

interface SkillsPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
}

export const SkillsPanel = ({ character, swapOob }: SkillsPanelProps) => {
  return (
    <div class="accordion-body" id="skills-panel" hx-swap-oob={swapOob && "true"}>
      <div class="d-flex justify-content-end gap-2 mb-3">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          hx-get={`/characters/${character.id}/edit/skills`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
        >
          <i class="bi bi-pencil"></i> Edit Skills
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          hx-get={`/characters/${character.id}/history/skills`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
        >
          <i class="bi bi-clock-history"></i> History
        </button>
      </div>
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <div class="list-group small">
            {Skills.map((skill) => (
              <SkillRow
                skill={skill}
                skillScore={character.skills[skill]}
                hasEffect={hasEffect(skill, character.affectedAttributes)}
                effectTooltip={getEffectTooltip(skill, character.affectedAttributes) || undefined}
              />
            ))}
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="form-label small text-muted">Tool & Weapon Proficiencies</div>
          <textarea class="form-control form-control-sm" rows={6}>
            Longswords, Shortbows, Thieves' Tools, Herbalism Kit
          </textarea>
        </div>
      </div>
    </div>
  )
}
