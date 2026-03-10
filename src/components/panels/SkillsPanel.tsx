import { type ProficiencyLevel, Skills, type SkillType } from "@src/lib/dnd"
import { getEffectTooltip, hasEffect } from "@src/lib/effectTooltip"
import type { ComputedCharacter, SkillScore } from "@src/services/computeCharacter"
import { clsx } from "clsx"

interface SkillRowProps {
  skill: SkillType
  skillScore: SkillScore
  hasEffect?: boolean
  effectTooltip?: string
  fromBeast?: boolean
}

const SkillRow = ({
  skill,
  skillScore,
  hasEffect = false,
  effectTooltip,
  fromBeast = false,
}: SkillRowProps) => {
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
      : fromBeast
        ? { "data-bs-toggle": "tooltip", "data-bs-placement": "top", title: "Using beast skill" }
        : {}

  return (
    <div
      class={clsx("list-group-item d-flex align-items-center gap-2 py-1 px-2", {
        "border-primary border-2": hasEffect,
        "list-group-item-warning": fromBeast,
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
      <span class={clsx("badge", fromBeast ? "text-bg-warning" : "text-bg-info")}>
        {formatModifier(skillScore.modifier)}
      </span>
    </div>
  )
}

interface SkillsPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
  isReadOnly?: boolean
}

export const SkillsPanel = ({ character, swapOob, isReadOnly = false }: SkillsPanelProps) => {
  const beast = character.wildShape?.currentBeast
  const beastSkills = beast?.skills || {}

  // Build display skills, using higher of character or beast modifier
  const displaySkills: Record<SkillType, SkillScore & { fromBeast: boolean }> = {} as Record<
    SkillType,
    SkillScore & { fromBeast: boolean }
  >

  for (const skill of Skills) {
    const charSkill = character.skills[skill]
    // Beast skills are stored as lowercase, skill names are lowercase in Skills array
    const beastBonus = beastSkills[skill]

    if (beastBonus !== undefined && beastBonus > charSkill.modifier) {
      displaySkills[skill] = {
        ...charSkill,
        modifier: beastBonus,
        fromBeast: true,
      }
    } else {
      displaySkills[skill] = {
        ...charSkill,
        fromBeast: false,
      }
    }
  }

  return (
    <div class="accordion-body" id="skills-panel" {...(swapOob && { "hx-swap-oob": "true" })}>
      {beast && (
        <div class="alert alert-warning py-2 mb-3">
          <small>
            <i class="bi bi-info-circle me-1"></i>
            Skills highlighted in yellow use <strong>{beast.name}</strong>'s higher bonus.
          </small>
        </div>
      )}
      {!isReadOnly && (
        <div class="d-flex justify-content-end gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/edit/skills`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-pencil"></i> Edit Skills
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/history/skills`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-clock-history"></i> History
          </button>
        </div>
      )}
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <div class="list-group small">
            {Skills.map((skill) => {
              const skillInfo = displaySkills[skill]
              return (
                <SkillRow
                  skill={skill}
                  skillScore={skillInfo}
                  hasEffect={!skillInfo.fromBeast && hasEffect(skill, character.affectedAttributes)}
                  effectTooltip={
                    !skillInfo.fromBeast
                      ? getEffectTooltip(skill, character.affectedAttributes) || undefined
                      : undefined
                  }
                  fromBeast={skillInfo.fromBeast}
                />
              )
            })}
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
