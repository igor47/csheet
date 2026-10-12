import { DEATH_SAVES_NEEDED, type DeathSaves } from "@src/lib/dnd/deathSaves"
import clsx from "clsx"
import type { Child } from "hono/jsx"

export interface DeathSavesDisplayProps {
  characterId: string
  deathSaves: DeathSaves
  isReadOnly?: boolean
  error?: string
}

interface PipsProps {
  label: string
  count: number
  filledIcon: string
  filledClass: string
}

// Three circles, filled for each success (or failure) so far
const Pips = ({ label, count, filledIcon, filledClass }: PipsProps) => (
  <span
    class="d-inline-flex align-items-center gap-1"
    title={`${count} of ${DEATH_SAVES_NEEDED} ${label}`}
    data-death-save-pips={label}
    data-count={count}
  >
    <span class="small text-muted me-1">{label}</span>
    {Array.from({ length: DEATH_SAVES_NEEDED }, (_, i) =>
      i < count ? (
        <i class={clsx("bi", filledIcon, filledClass)} aria-hidden="true"></i>
      ) : (
        <i class="bi bi-circle text-muted" aria-hidden="true"></i>
      )
    )}
    <span class="visually-hidden">
      {count} of {DEATH_SAVES_NEEDED}
    </span>
  </span>
)

const SaveButton = ({
  characterId,
  outcome,
  class: cls,
  children,
}: {
  characterId: string
  outcome: string
  class: string
  children: Child
}) => (
  <button
    type="button"
    class={clsx("btn btn-sm", cls)}
    hx-post={`/characters/${characterId}/deathsaves`}
    hx-vals={JSON.stringify({ outcome })}
    hx-swap="none"
    hx-disabled-elt="#death-saves button"
  >
    {children}
  </button>
)

/**
 * Death saving throws for a character at 0 HP: dying (with success and failure pips and buttons
 * to record a save), stable, or dead (with a way back)
 */
export const DeathSavesDisplay = ({
  characterId,
  deathSaves,
  isReadOnly = false,
  error,
}: DeathSavesDisplayProps) => {
  const { status, successes, failures } = deathSaves

  return (
    <div class="row g-2 h-auto mt-2" id="death-saves" data-status={status}>
      <div class="col-12 col-md-2">
        <div class="text-muted small text-center">Death Saves</div>
      </div>
      <div class="col-12 col-md-10">
        <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-3">
          {status === "dying" && <span class="badge bg-danger">Dying</span>}
          {status === "stable" && <span class="badge bg-secondary">Stable</span>}
          {status === "dead" && (
            <span class="badge text-bg-light">
              <i class="bi bi-heartbreak-fill me-1"></i>Dead
            </span>
          )}

          {status === "dying" && (
            <>
              <Pips
                label="successes"
                count={successes}
                filledIcon="bi-check-circle-fill"
                filledClass="text-success"
              />
              <Pips
                label="failures"
                count={failures}
                filledIcon="bi-x-circle-fill"
                filledClass="text-danger"
              />
            </>
          )}
          {status === "stable" && (
            <span class="small text-muted">
              Unconscious at 0 HP. Regains 1 HP after 1d4 hours unless healed.
            </span>
          )}
        </div>

        {!isReadOnly && status === "dying" && (
          <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mt-2">
            <fieldset class="btn-group" aria-label="record a death saving throw">
              <SaveButton characterId={characterId} outcome="success" class="btn-outline-success">
                <i class="bi bi-check-lg me-1"></i>Success
              </SaveButton>
              <SaveButton characterId={characterId} outcome="failure" class="btn-outline-danger">
                <i class="bi bi-x-lg me-1"></i>Failure
              </SaveButton>
              <SaveButton characterId={characterId} outcome="nat1" class="btn-outline-danger">
                Nat 1
              </SaveButton>
              <SaveButton characterId={characterId} outcome="nat20" class="btn-outline-success">
                Nat 20
              </SaveButton>
            </fieldset>
            <SaveButton
              characterId={characterId}
              outcome="stabilized"
              class="btn-outline-secondary"
            >
              Stabilized
            </SaveButton>
          </div>
        )}

        {!isReadOnly && status === "stable" && (
          <div class="mt-2 text-center text-md-start">
            <button
              type="button"
              class="btn btn-sm btn-outline-success"
              hx-post={`/characters/${characterId}/edit/hitpoints`}
              hx-vals={JSON.stringify({
                action: "restore",
                amount: "1",
                note: "Stable: regained 1 HP after 1d4 hours",
                from_sheet: "true",
              })}
              hx-swap="none"
              hx-disabled-elt="this"
            >
              <i class="bi bi-hourglass-split me-1"></i>Regain 1 HP
            </button>
          </div>
        )}

        {!isReadOnly && status === "dead" && (
          <div class="mt-2 text-center text-md-start">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              hx-post={`/characters/${characterId}/revive`}
              hx-swap="none"
              hx-disabled-elt="this"
              title="Bring the character back with 1 HP, as Revivify does, or undo a death"
            >
              <i class="bi bi-heart-pulse me-1"></i>Restore to life
            </button>
          </div>
        )}

        {error && <div class="text-danger small mt-1 text-center text-md-start">{error}</div>}
      </div>
    </div>
  )
}
