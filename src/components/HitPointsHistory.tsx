import { toTitleCase } from "@src/lib/strings"

export type HPHistoryEvent = {
  date: Date
  type: "delta" | "level" | "wildshape_start" | "wildshape_end" | "wildshape_damage"
  // For delta events:
  delta?: number
  note?: string
  // For level events:
  class?: string
  level?: number
  hitDieRoll?: number
  // For wild shape events:
  beastName?: string
  beastMaxHp?: number
  beastFinalHp?: number
  damageAbsorbed?: number
}

export interface HitPointsHistoryProps {
  events: HPHistoryEvent[]
}

export const HitPointsHistory = ({ events }: HitPointsHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Hit Points History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No hit points history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Event</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const renderEvent = () => {
                    switch (event.type) {
                      case "delta": {
                        const delta = event.delta || 0
                        if (delta > 0) {
                          return `Restored ${delta} HP`
                        }
                        return `Lost ${Math.abs(delta)} HP`
                      }
                      case "level":
                        return `Gained ${event.hitDieRoll} max HP (${toTitleCase(event.class || "")} ${event.level})`
                      case "wildshape_start":
                        return (
                          <>
                            <i class="bi bi-arrow-repeat me-1"></i>
                            {event.beastName} ({event.beastMaxHp} HP)
                          </>
                        )
                      case "wildshape_end":
                        return (
                          <>
                            <i class="bi bi-x-circle me-1"></i>
                            Ended {event.beastName} ({event.beastFinalHp}/{event.beastMaxHp} HP)
                          </>
                        )
                      case "wildshape_damage":
                        return (
                          <>
                            <i class="bi bi-shield me-1"></i>
                            Beast absorbed {event.damageAbsorbed} damage
                          </>
                        )
                    }
                  }

                  return (
                    <tr>
                      <td>
                        <small class="text-muted">
                          {new Date(event.date).toLocaleDateString()}
                        </small>
                      </td>
                      <td>{renderEvent()}</td>
                      <td>{event.note || <span class="text-muted">—</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </>
  )
}
