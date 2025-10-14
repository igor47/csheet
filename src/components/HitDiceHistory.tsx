import type { CharHitDice } from "@src/db/char_hit_dice"

export interface HitDiceHistoryProps {
  events: CharHitDice[]
}

export const HitDiceHistory = ({ events }: HitDiceHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Hit Dice History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No hit dice history found.</p>
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
                  const eventDescription =
                    event.action === "use"
                      ? `Spent D${event.die_value}`
                      : `Restored D${event.die_value}`

                  return (
                    <tr key={event.id}>
                      <td>
                        <small class="text-muted">
                          {new Date(event.created_at).toLocaleDateString()}
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
