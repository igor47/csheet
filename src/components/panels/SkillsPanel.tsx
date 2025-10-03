import type { ComputedCharacter, SkillScore } from '@src/services/computeCharacter';
import { Skills, type SkillType, type ProficiencyLevel } from '@src/lib/dnd';

interface SkillRowProps {
  skill: SkillType;
  skillScore: SkillScore;
}

const SkillRow = ({ skill, skillScore }: SkillRowProps) => {
  const formatModifier = (value: number) => value >= 0 ? `+${value}` : `${value}`;

  const getProficiencyIcon = (proficiency: ProficiencyLevel): string => {
    switch (proficiency) {
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

  const abilityAbbr = skillScore.ability.slice(0, 3).toUpperCase();

  return (
    <div class="list-group-item d-flex align-items-center gap-2 py-1 px-2">
      <i class={`bi ${getProficiencyIcon(skillScore.proficiency)} text-muted`} style="width: 16px;"></i>
      <span class="badge bg-secondary text-uppercase" style="width: 40px; font-size: 0.7rem;">{abilityAbbr}</span>
      <span class="flex-grow-1 text-capitalize">{skill}</span>
      <span class="badge text-bg-info">{formatModifier(skillScore.modifier)}</span>
      <div class="d-flex gap-1">
        <button
          class="btn btn-sm btn-outline-secondary border p-1"
          style="width: 24px; height: 24px; line-height: 1;"
          aria-label={`edit ${skill}`}
          title={`edit ${skill}`}>
          <i class="bi bi-pencil"></i>
        </button>
        <button
          class="btn btn-sm btn-outline-secondary border p-1"
          style="width: 24px; height: 24px; line-height: 1;"
          aria-label={`${skill} history`}
          title={`${skill} history`}>
          <i class="bi bi-journals"></i>
        </button>
      </div>
    </div>
  );
};

interface SkillsPanelProps {
  character: ComputedCharacter;
}

export const SkillsPanel = ({ character }: SkillsPanelProps) => {
  return (
    <div class="accordion-body">
      <div class="row g-2">
        <div class="col-12 col-md-6">
          <div class="list-group small">
            {Skills.map(skill => (
              <SkillRow skill={skill} skillScore={character.skills[skill]} />
            ))}
          </div>
        </div>
        <div class="col-12 col-md-6">
          <label class="form-label small text-muted">Tool & Weapon Proficiencies</label>
          <textarea class="form-control form-control-sm" rows={6}>Longswords, Shortbows, Thieves' Tools, Herbalism Kit</textarea>
        </div>
      </div>
    </div>
  );
}
