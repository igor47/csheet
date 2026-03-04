import { getBeastById } from "@src/lib/dnd/beasts"
import { formatCR } from "@src/lib/dnd/wildShape"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import { clsx } from "clsx"

export interface WildShapePanelProps {
  character: ComputedCharacter
  swapOob?: boolean
  isReadOnly?: boolean
}

export const WildShapePanel = ({ character, swapOob, isReadOnly = false }: WildShapePanelProps) => {
  // This panel should only be rendered when character.wildShape is not null
  // but we check here for safety
  if (!character.wildShape) {
    return null
  }

  const { limits, knownForms, beasts } = character.wildShape
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

  return (
    <div
      class="accordion-body"
      id="wildshape-panel"
      {...(swapOob ? { "hx-swap-oob": "true" } : {})}
    >
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">
          {headerText}
          <span class="badge bg-secondary ms-2" title="Wild Shape">
            Max CR {formatCR(limits.maxCR)}
          </span>
        </h6>
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
