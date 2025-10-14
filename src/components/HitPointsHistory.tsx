import { toTitleCase } from "@src/lib/strings"

export type HPHistoryEvent = {
  date: Date
  type: "delta" | "level"
  // For delta events:
  delta?: number
  note?: string
  // For level events:
  class?: string
  level?: number
  hitDieRoll?: number
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
                {events.map((event, idx) => {
                  let eventDescription = ""
                  if (event.type === "delta") {
                    const delta = event.delta || 0
                    if (delta > 0) {
                      eventDescription = `Restored ${delta} HP`
                    } else {
                      eventDescription = `Lost ${Math.abs(delta)} HP`
                    }
                  } else {
                    eventDescription = `Gained ${event.hitDieRoll} max HP (${toTitleCase(event.class || "")} ${event.level})`
                  }

                  return (
                    <tr key={idx}>
                      <td>
                        <small class="text-muted">
                          {new Date(event.date).toLocaleDateString()}
                        </small>
                      </td>
                      <td>{eventDescription}</td>
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
