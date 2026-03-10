import type { CharTrait } from "@src/db/char_traits"
import type { BeastTrait } from "@src/lib/dnd/beasts"
import { toTitleCase } from "@src/lib/strings"
import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface TraitsPanelProps {
  character: ComputedCharacter
  swapOob?: boolean
  isReadOnly?: boolean
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

interface BeastTraitItemProps {
  trait: BeastTrait
}

const BeastTraitItem = ({ trait }: BeastTraitItemProps) => {
  return (
    <li class="list-group-item list-group-item-warning">
      <div class="fw-semibold text-capitalize">{trait.name}</div>
      <p class="mb-0 text-muted small">{trait.description}</p>
    </li>
  )
}

interface BeastTraitGroupProps {
  beastName: string
  traits: BeastTrait[]
}

const BeastTraitGroup = ({ beastName, traits }: BeastTraitGroupProps) => {
  if (traits.length === 0) {
    return null
  }

  return (
    <div class="mb-3">
      <h6 class="text-muted small mb-2">Beast Traits ({beastName})</h6>
      <ul class="list-group list-group-flush">
        {traits.map((trait) => (
          <BeastTraitItem trait={trait} />
        ))}
      </ul>
    </div>
  )
}

export const TraitsPanel = ({ character, swapOob, isReadOnly = false }: TraitsPanelProps) => {
  const traits = character.traits
  const beast = character.wildShape?.currentBeast
  const beastTraits = beast?.traits ?? []

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
    <div class="accordion-body" id="traits-panel" {...(swapOob && { "hx-swap-oob": "true" })}>
      {!isReadOnly && (
        <div class="d-flex justify-content-end gap-2 mb-3">
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            hx-get={`/characters/${character.id}/edit/trait`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-plus-circle"></i> Add Custom Trait
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${character.id}/history/traits`}
            hx-target="#detailModalContent"
            hx-swap="innerHTML"
            data-bs-toggle="modal"
            data-bs-target="#detailModal"
          >
            <i class="bi bi-clock-history"></i> History
          </button>
        </div>
      )}

      {/* Beast traits at top when transformed */}
      {beast && beastTraits.length > 0 && (
        <BeastTraitGroup beastName={beast.name} traits={beastTraits} />
      )}

      {traits.length === 0 && !beast ? (
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
    </div>
  )
}
