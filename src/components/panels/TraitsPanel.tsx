import type { CharTrait } from "@src/db/char_traits"
import { toTitleCase } from "@src/lib/strings"
import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface TraitsPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
}

interface TraitBadgesProps {
  trait: CharTrait
}

const TraitBadges = ({ trait }: TraitBadgesProps) => {
  return (
    <div class="d-flex gap-1">
      {trait.source_detail && (
        <span class="badge bg-secondary">{toTitleCase(trait.source_detail)}</span>
      )}
      {trait.level && <span class="badge bg-primary">Level {trait.level}</span>}
    </div>
  )
}

interface TraitItemProps {
  trait: CharTrait
}

const TraitItem = ({ trait }: TraitItemProps) => {
  return (
    <li class="list-group-item">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <div class="fw-semibold text-capitalize">{trait.name}</div>
        <TraitBadges trait={trait} />
      </div>
      <p class="mb-0 text-muted small">{trait.description}</p>
      {trait.note && <p class="mb-0 text-muted fst-italic small mt-1">{trait.note}</p>}
    </li>
  )
}

interface TraitGroupProps {
  source: string
  traits: CharTrait[] | undefined
}

const TraitGroup = ({ source, traits }: TraitGroupProps) => {
  if (!traits || traits.length === 0) {
    return null
  }

  return (
    <div class="mb-3">
      <h6 class="text-muted small mb-2">{toTitleCase(source)} Traits</h6>
      <ul class="list-group list-group-flush">
        {traits.map((trait) => (
          <TraitItem trait={trait} />
        ))}
      </ul>
    </div>
  )
}

export const TraitsPanel = ({ character, swapOob }: TraitsPanelProps) => {
  const traits = character.traits

  // Group traits by source for organized display
  const traitsBySource: Record<string, CharTrait[]> = {
    species: [],
    lineage: [],
    background: [],
    class: [],
    subclass: [],
    custom: [],
  }

  for (const trait of traits) {
    const sourceArray = traitsBySource[trait.source]
    if (sourceArray) {
      sourceArray.push(trait)
    }
  }

  return (
    <div class="accordion-body" id="traits-panel" hx-swap-oob={swapOob && "true"}>
      {traits.length === 0 ? (
        <p class="text-muted">No traits yet.</p>
      ) : (
        <>
          <TraitGroup source="species" traits={traitsBySource.species} />
          <TraitGroup source="lineage" traits={traitsBySource.lineage} />
          <TraitGroup source="background" traits={traitsBySource.background} />
          <TraitGroup source="class" traits={traitsBySource.class} />
          <TraitGroup source="subclass" traits={traitsBySource.subclass} />
          <TraitGroup source="custom" traits={traitsBySource.custom} />
        </>
      )}

      {/* Edit and History buttons */}
      <div class="d-flex gap-2 mt-3">
        <button
          type="button"
          class="btn btn-sm btn-outline-primary"
          hx-get={`/characters/${character.id}/edit/trait`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
        >
          <i class="bi bi-plus-circle"></i> Add Custom Trait
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          hx-get={`/characters/${character.id}/history/traits`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
          data-bs-toggle="modal"
          data-bs-target="#editModal"
        >
          <i class="bi bi-clock-history"></i> History
        </button>
      </div>
    </div>
  )
}
