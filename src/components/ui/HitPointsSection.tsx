import { HitPointsBar } from "./HitPointsBar"

interface HitPointsRowProps {
  label: string
  labelSize?: "normal" | "small"
  currentHP: number
  maxHP: number
  characterId: string
  showEditButton?: boolean
  showHistoryButton?: boolean
  isReadOnly?: boolean
}

const HitPointsRow = ({
  label,
  labelSize = "normal",
  currentHP,
  maxHP,
  characterId,
  showEditButton = false,
  showHistoryButton = false,
  isReadOnly = false,
}: HitPointsRowProps) => {
  const showButtons = !isReadOnly && (showEditButton || showHistoryButton)
  const labelStyle = labelSize === "small" ? { fontSize: "0.7rem" } : {}

  return (
    <div class="row g-2 h-auto mt-2">
      <div class={showButtons ? "col-10 col-md-2" : "col-12 col-md-2"}>
        <div class="text-muted small text-center" style={labelStyle}>
          {label}
        </div>
      </div>
      <div class={showButtons ? "col-10 col-md-8" : "col-12 col-md-10"}>
        <HitPointsBar currentHP={currentHP} maxHitPoints={maxHP} />
      </div>
      {showButtons && (
        <div class="col-2 d-flex gap-1 align-items-center">
          {showEditButton && (
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary border p-1"
              style="width: 24px; height: 24px; line-height: 1;"
              aria-label="edit hit points"
              title="edit hit points"
              hx-get={`/characters/${characterId}/edit/hitpoints`}
              hx-target="#detailModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#detailModal"
            >
              <i class="bi bi-pencil"></i>
            </button>
          )}
          {showHistoryButton && (
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary border p-1"
              style="width: 24px; height: 24px; line-height: 1;"
              aria-label="hit points history"
              title="hit points history"
              hx-get={`/characters/${characterId}/history/hitpoints`}
              hx-target="#detailModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#detailModal"
            >
              <i class="bi bi-clock-history"></i>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export interface HitPointsSectionProps {
  characterId: string
  currentHP: number
  maxHP: number
  isReadOnly?: boolean
  // Beast transformation props
  isTransformed?: boolean
  beastName?: string
  currentBeastHP?: number
  maxBeastHP?: number
}

export const HitPointsSection = ({
  characterId,
  currentHP,
  maxHP,
  isReadOnly = false,
  isTransformed = false,
  beastName,
  currentBeastHP = 0,
  maxBeastHP = 0,
}: HitPointsSectionProps) => {
  if (isTransformed) {
    return (
      <>
        <HitPointsRow
          label="Beast HP"
          currentHP={currentBeastHP}
          maxHP={maxBeastHP}
          characterId={characterId}
          showEditButton={true}
          showHistoryButton={true}
          isReadOnly={isReadOnly}
        />
        <HitPointsRow
          label="Your HP"
          labelSize="small"
          currentHP={currentHP}
          maxHP={maxHP}
          characterId={characterId}
          isReadOnly={isReadOnly}
        />
      </>
    )
  }

  return (
    <HitPointsRow
      label="Hit Points"
      currentHP={currentHP}
      maxHP={maxHP}
      characterId={characterId}
      showEditButton={true}
      showHistoryButton={true}
      isReadOnly={isReadOnly}
    />
  )
}
