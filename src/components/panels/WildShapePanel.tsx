import { LabeledValue } from "@src/components/ui/LabeledValue"
import { getBeastById } from "@src/lib/dnd/beasts"
import { formatCR } from "@src/lib/dnd/wildShape"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

export interface WildShapePanelProps {
  character: ComputedCharacter
  swapOob?: boolean
  isReadOnly?: boolean
}

/**
 * Get restrictions text for display
 */
function getRestrictionsText(canFly: boolean, canSwim: boolean): string {
  if (canFly && canSwim) return "None"
  if (!canFly && !canSwim) return "No fly or swim"
  if (!canFly) return "No fly"
  return "No swim"
}

export const WildShapePanel = ({ character, swapOob, isReadOnly = false }: WildShapePanelProps) => {
  // This panel should only be rendered when character.wildShape is not null
  // but we check here for safety
  if (!character.wildShape) {
    return null
  }

  const { limits, knownForms, beasts, maxUses, usesAvailable, ongoingTransformation } =
    character.wildShape
  const isSrd52 = knownForms !== null

  // Get beast data for each seen/known beast
  const beastsData = beasts
    .map((beastId) => {
      const beast = getBeastById(character.ruleset, beastId)
      if (!beast) return null

      // Check if beast can be transformed into
      const hasFly = !!beast.speed.fly
      const hasSwim = !!beast.speed.swim
      const canTransform =
        beast.cr <= limits.maxCR && (!hasFly || limits.canFly) && (!hasSwim || limits.canSwim)

      return { beast, canTransform }
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Sort by CR, then name
      if (a!.beast.cr !== b!.beast.cr) return a!.beast.cr - b!.beast.cr
      return a!.beast.name.localeCompare(b!.beast.name)
    })

  const formatBeastSpeed = (beast: NonNullable<(typeof beastsData)[0]>["beast"]) => {
    const parts: string[] = []
    if (beast.speed.walk) parts.push(`${beast.speed.walk}`)
    if (beast.speed.swim) parts.push(`swim ${beast.speed.swim}`)
    if (beast.speed.fly) parts.push(`fly ${beast.speed.fly}`)
    if (beast.speed.climb) parts.push(`climb ${beast.speed.climb}`)
    return parts.join(", ")
  }

  // Determine header and route based on ruleset
  const headerText = isSrd52 ? `Known Forms (${beasts.length}/${knownForms!})` : "Seen Beasts"
  const editRoute = isSrd52 ? "prepbeast" : "seenbeasts"
  const addLabel = isSrd52 ? "Add known form" : "Add seen beast"
  // For SRD 5.2, disable add button if character can't learn forms yet (level < 2)
  const canLearnForms = !isSrd52 || (knownForms !== null && knownForms > 0)
  const emptyMessage = isSrd52
    ? "No beast forms known yet. Learn beast forms during a long rest."
    : "No beasts recorded yet. Add beasts you've seen to use with Wild Shape."

  // Get ongoing transformation beast name
  const ongoingBeastName = ongoingTransformation
    ? getBeastById(character.ruleset, ongoingTransformation.beastId)?.name || "Unknown Beast"
    : null

  // Check if transform buttons should be shown (uses available and no ongoing transformation)
  const canShowTransformButtons = usesAvailable > 0 && !ongoingTransformation

  return (
    <div
      class="accordion-body"
      id="wildshape-panel"
      {...(swapOob ? { "hx-swap-oob": "true" } : {})}
    >
      {/* Wild Shape Status Row - 4 columns on md+, wraps on smaller */}
      <div class="row g-2 mb-3">
        <div class="col-3">
          <LabeledValue label="Max CR" value={formatCR(limits.maxCR)} />
        </div>
        <div class="col-3">
          <LabeledValue label="Uses / Total" value={`${usesAvailable}/${maxUses}`} />
        </div>
        <div class="col-6">
          <LabeledValue
            label="Restrictions"
            value={getRestrictionsText(limits.canFly, limits.canSwim)}
          />
        </div>
      </div>

      <div class="row g-2 mb-3 p-2 align-items-center">
        <div class="col-3 text-center">Current Form</div>
        <div class="col-5 text-center">
          {ongoingTransformation ? (
            <a
              href={`/beasts/${ongoingTransformation.beastId}`}
              hx-get={`/beasts/${ongoingTransformation.beastId}?ruleset=${character.ruleset}`}
              hx-target="#detailModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#detailModal"
              class="fw-bold text-decoration-none"
            >
              {ongoingBeastName}
            </a>
          ) : (
            <span class="text-muted">None</span>
          )}
        </div>
        <div class="col-4 text-center">
          {!isReadOnly && (
            <div class="d-flex gap-1 justify-content-center">
              {ongoingTransformation ? (
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger border"
                  aria-label="End transformation"
                  title="End transformation"
                  hx-post={`/characters/${character.id}/wildshape/end`}
                  hx-target="#wildshape-panel"
                  hx-swap="innerHTML"
                  hx-confirm={`End ${ongoingBeastName} transformation?`}
                >
                  <i class="bi bi-x-lg me-1"></i>
                  End
                </button>
              ) : (
                <button
                  type="button"
                  class={clsx(
                    "btn btn-sm btn-outline-success border",
                    !canShowTransformButtons && "disabled"
                  )}
                  aria-label="Transform"
                  title={canShowTransformButtons ? "Transform" : "No uses available"}
                  disabled={!canShowTransformButtons}
                  {...(canShowTransformButtons
                    ? {
                        "hx-get": `/characters/${character.id}/wildshape/activate`,
                        "hx-target": "#detailModalContent",
                        "hx-swap": "innerHTML",
                        "data-bs-toggle": "modal",
                        "data-bs-target": "#detailModal",
                      }
                    : {})}
                >
                  <i class="bi bi-arrow-repeat me-1"></i>
                  Transform
                </button>
              )}
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary border"
                aria-label="Wild shape history"
                title="Wild shape history"
                hx-get={`/characters/${character.id}/history/wildshape`}
                hx-target="#detailModalContent"
                hx-swap="innerHTML"
                data-bs-toggle="modal"
                data-bs-target="#detailModal"
              >
                <i class="bi bi-clock-history"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">{headerText}</h6>
        {!isReadOnly && (
          <div class="d-flex gap-1">
            <button
              type="button"
              class={clsx(
                "btn btn-sm btn-outline-secondary border p-1",
                !canLearnForms && "disabled"
              )}
              style="width: 24px; height: 24px; line-height: 1;"
              aria-label={addLabel}
              title={canLearnForms ? addLabel : "Gain Wild Shape at level 2 to learn beast forms"}
              disabled={!canLearnForms}
              {...(canLearnForms
                ? {
                    "hx-get": `/characters/${character.id}/edit/${editRoute}`,
                    "hx-target": "#detailModalContent",
                    "hx-swap": "innerHTML",
                    "data-bs-toggle": "modal",
                    "data-bs-target": "#detailModal",
                  }
                : {})}
            >
              <i class="bi bi-plus"></i>
            </button>
            {isSrd52 && (
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary border p-1"
                style="width: 24px; height: 24px; line-height: 1;"
                aria-label="View known forms history"
                title="View known forms history"
                hx-get={`/characters/${character.id}/history/beast-prep-history`}
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
      {beastsData.length > 0 ? (
        <div class="table-responsive">
          <table class="table table-sm table-hover small">
            <thead>
              <tr>
                <th>Beast</th>
                <th>CR</th>
                <th>Size</th>
                <th>Speed</th>
                {!isReadOnly && <th style="width: 40px;">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {beastsData.map((data) => {
                if (!data) return null
                const { beast, canTransform } = data

                return (
                  <tr class={clsx({ "text-muted": !canTransform })}>
                    <td>
                      <a
                        href={`/beasts/${beast.id}`}
                        hx-get={`/beasts/${beast.id}?ruleset=${character.ruleset}`}
                        hx-target="#detailModalContent"
                        hx-swap="innerHTML"
                        data-bs-toggle="modal"
                        data-bs-target="#detailModal"
                        class={clsx("text-decoration-none", {
                          "text-muted": !canTransform,
                        })}
                      >
                        {beast.name}
                      </a>
                      {!canTransform && (
                        <i
                          class="bi bi-exclamation-triangle ms-1 text-warning"
                          title="Cannot transform: CR or movement type exceeds current limits"
                        ></i>
                      )}
                    </td>
                    <td>{formatCR(beast.cr)}</td>
                    <td class="text-capitalize">{beast.size}</td>
                    <td>{formatBeastSpeed(beast)}</td>
                    {!isReadOnly && (
                      <td>
                        {canTransform && canShowTransformButtons && (
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-success border p-0"
                            style="width: 24px; height: 24px; line-height: 1;"
                            aria-label="Transform into beast"
                            title="Transform"
                            hx-get={`/characters/${character.id}/wildshape/activate?beast_id=${beast.id}`}
                            hx-target="#detailModalContent"
                            hx-swap="innerHTML"
                            data-bs-toggle="modal"
                            data-bs-target="#detailModal"
                          >
                            <i class="bi bi-arrow-repeat"></i>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p class="text-muted small">{emptyMessage}</p>
      )}
    </div>
  )
}
