import type { CharAbility } from "@src/db/char_abilities"

export interface AbilityHistoryProps {
  events: CharAbility[]
}

export const AbilityHistory = ({ events }: AbilityHistoryProps) => {
  // Group events by timestamp and note to identify simultaneous changes
  const groupedEvents: Array<{ timestamp: string; note: string | null; events: CharAbility[] }> = []

  for (const event of events) {
    const timestamp = new Date(event.created_at).toISOString()
    const existing = groupedEvents.find((g) => g.timestamp === timestamp && g.note === event.note)

    if (existing) {
      existing.events.push(event)
    } else {
      groupedEvents.push({
        timestamp,
        note: event.note,
        events: [event],
      })
    }
  }

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Ability History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No ability history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ability</th>
                  <th>Score</th>
                  <th>Proficiency</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {groupedEvents.map((group) => {
                  return group.events.map((event, idx) => {
                    const isFirstInGroup = idx === 0
                    const groupSize = group.events.length

                    return (
                      <tr key={event.id} class={groupSize > 1 ? "table-active" : ""}>
                        {isFirstInGroup && groupSize > 1 ? (
                          <td rowspan={groupSize}>
                            <small class="text-muted">
                              {new Date(event.created_at).toLocaleDateString()}
                            </small>
                          </td>
                        ) : groupSize === 1 ? (
                          <td>
                            <small class="text-muted">
                              {new Date(event.created_at).toLocaleDateString()}
                            </small>
                          </td>
                        ) : null}
                        <td>
                          <span class="text-capitalize fw-medium">{event.ability}</span>
                        </td>
                        <td>{event.score}</td>
                        <td>
                          {event.proficiency ? (
                            <span class="badge bg-success">Proficient</span>
                          ) : (
                            <span class="badge bg-secondary">Not Proficient</span>
                          )}
                        </td>
                        {isFirstInGroup && groupSize > 1 ? (
                          <td rowspan={groupSize}>
                            {event.note || <span class="text-muted">—</span>}
                          </td>
                        ) : groupSize === 1 ? (
                          <td>{event.note || <span class="text-muted">—</span>}</td>
                        ) : null}
                      </tr>
                    )
                  })
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
