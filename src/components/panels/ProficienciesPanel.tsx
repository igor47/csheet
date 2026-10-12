import type { CurrentProficiency } from "@src/db/char_proficiencies"
import {
  formatProficiencyName,
  type ProficiencyKind,
  ProficiencyKindLabels,
  ProficiencyKinds,
} from "@src/lib/dnd/proficiencies"
import { toTitleCase } from "@src/lib/strings"
import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface ProficienciesPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
  isReadOnly?: boolean
}

function sourceLabel(p: CurrentProficiency): string {
  if (p.source === "custom") {
    return p.source_detail ? `Added: ${p.source_detail}` : "Added by hand"
  }
  const from = p.source_detail
    ? `From ${toTitleCase(p.source_detail)} (${p.source})`
    : `From ${p.source}`
  return p.note ? `${from}. ${p.note}` : from
}

interface ProficiencyGroupProps {
  kind: ProficiencyKind
  proficiencies: CurrentProficiency[]
}

const ProficiencyGroup = ({ kind, proficiencies }: ProficiencyGroupProps) => (
  <div class="mb-3" data-proficiency-kind={kind}>
    <h6 class="text-muted small mb-2">{ProficiencyKindLabels[kind]}</h6>
    {proficiencies.length === 0 ? (
      <span class="text-muted small">None</span>
    ) : (
      <ul class="list-unstyled d-flex flex-wrap gap-1 mb-0">
        {proficiencies.map((p) => (
          <li
            class="badge rounded-pill text-bg-light border fw-normal"
            title={sourceLabel(p)}
            data-proficiency={p.name}
          >
            {formatProficiencyName(p.name)}
          </li>
        ))}
      </ul>
    )}
  </div>
)

export const ProficienciesPanel = ({
  character,
  swapOob,
  isReadOnly = false,
}: ProficienciesPanelProps) => {
  return (
    <div
      class="accordion-body"
      id="proficiencies-panel"
      {...(swapOob && { "hx-swap-oob": "true" })}
    >
      {!isReadOnly && (
        <div class="d-flex justify-content-end gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/edit/proficiencies`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-pencil"></i> Edit Proficiencies
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/history/proficiencies`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-clock-history"></i> History
          </button>
        </div>
      )}
      {ProficiencyKinds.map((kind) => (
        <ProficiencyGroup
          kind={kind}
          proficiencies={character.proficiencies.filter((p) => p.kind === kind)}
        />
      ))}
      {!isReadOnly && (
        <p class="text-muted small mb-0" id="proficiencies-choices-hint">
          <i class="bi bi-info-circle me-1"></i>
          Proficiencies your species, background, or class let you choose (an extra language, a
          gaming set, an instrument) aren't added automatically; add them with Edit Proficiencies.
        </p>
      )}
    </div>
  )
}
