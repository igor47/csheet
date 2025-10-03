import { clsx } from 'clsx';
import type { ComputedCharacter } from '@src/services/computeCharacter';
import { Abilities, type AbilityType } from '@src/lib/dnd';

interface AbilityBoxProps {
  ability: AbilityType;
  score: number;
  savingThrow: number;
  proficient: boolean;
  characterId: string;
}

const AbilityBox = ({ ability, score, savingThrow, proficient, characterId }: AbilityBoxProps) => {
  const formatModifier = (value: number) => value >= 0 ? `+${value}` : `${value}`;
  const abilityNameClass = clsx('fw-medium text-uppercase border', {
    'bg-primary-subtle': proficient,
    'bg-dark-subtle': !proficient,
  });

  return (
    <div class="col">
      <div class="border rounded p-2 text-center position-relative" style="padding-bottom: 35px !important;">
        <div class={abilityNameClass} style="font-size: 0.7rem;">{ability}</div>
        <div class="fw-bold p-2 d-flex align-items-center justify-content-center">
          <span class="fs-3 pe-1">{formatModifier(savingThrow)}</span>
        </div>

        <div
          class="rounded-circle bg-secondary-subtle border d-flex align-items-center justify-content-center mx-auto fw-bold position-absolute start-50 translate-middle-x"
          style="width: 40px; height: 40px; font-size: 0.85rem; bottom: -10px;"
        >
          {score}
        </div>

        <div class="position-absolute d-flex flex-column gap-1" style="right: 8px; top: 30px;">
          <button
            class="btn btn-sm btn-outline-secondary border p-1"
            style="width: 24px; height: 24px; line-height: 1;"
            aria-label={`edit ${ability}`}
            title={`edit ${ability}`}
            hx-get={`/characters/${characterId}/edit/${ability}`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#editModal">
            <i class="bi bi-pencil"></i>
          </button>
          <button
            class="btn btn-sm btn-outline-secondary border p-1"
            style="width: 24px; height: 24px; line-height: 1;"
            aria-label={`${ability} history`}
            title={`${ability} history`}
            hx-get={`/characters/${characterId}/history/${ability}`}
            hx-target="#editModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#editModal">
            <i class="bi bi-journals"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

interface AbilitiesPanelProps {
  character: ComputedCharacter;
}

export const AbilitiesPanel = ({ character }: AbilitiesPanelProps) => {
  return (
    <div class="accordion-body">
      <div class="row row-cols-3 g-2">
        {Abilities.map(ability => {
          const abilityScore = character.abilityScores[ability];
          return (
            <AbilityBox
              ability={ability}
              score={abilityScore.score}
              savingThrow={abilityScore.savingThrow}
              proficient={abilityScore.proficient}
              characterId={character.id}
            />
          );
        })}
      </div>
    </div>
  );
}
