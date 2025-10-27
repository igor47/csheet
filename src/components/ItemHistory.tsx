import type { CharItemHistoryEvent } from "@src/db/char_items"

export interface ItemHistoryProps {
  events: CharItemHistoryEvent[]
}

const getActionDescription = (
  event: CharItemHistoryEvent,
  previousEvent?: CharItemHistoryEvent
): string => {
  // If this is the first event for this item (no previous event with same item_id)
  if (!previousEvent) {
    return "Acquired"
  }

  // If item was dropped
  if (event.dropped_at !== null && previousEvent.dropped_at === null) {
    return "Dropped"
  }

  // Build action description based on state changes
  const actions: string[] = []

  if (event.worn !== previousEvent.worn) {
    actions.push(event.worn ? "Wore" : "Removed")
  }

  if (event.wielded !== previousEvent.wielded) {
    actions.push(event.wielded ? "Wielded" : "Unwielded")
  }

  return actions.length > 0 ? actions.join(" & ") : "Updated"
}

export const ItemHistory = ({ events }: ItemHistoryProps) => {
  // Build a map to track previous events for each item
  const itemEventMap = new Map<string, CharItemHistoryEvent>()

  // Process events in reverse order (oldest first) to build the map
  const reversedEvents = [...events].reverse()
  const eventsWithActions = reversedEvents.map((event) => {
    const previousEvent = itemEventMap.get(event.item_id)
    const action = getActionDescription(event, previousEvent)
    itemEventMap.set(event.item_id, event)
    return { ...event, action }
  })

  // Reverse back to show newest first
  const displayEvents = eventsWithActions.reverse()

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Item History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {displayEvents.length === 0 ? (
          <p class="text-muted">No item history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Action</th>
                  <th>State</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {displayEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <small class="text-muted">
                        {new Date(event.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>{event.item_name}</td>
                    <td>
                      <span
                        class={
                          event.action === "Acquired"
                            ? "badge bg-success"
                            : event.action === "Dropped"
                              ? "badge bg-danger"
                              : "badge bg-info"
                        }
                      >
                        {event.action}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex gap-1">
                        {event.worn && <span class="badge bg-secondary">Worn</span>}
                        {event.wielded && <span class="badge bg-primary">Wielded</span>}
                        {event.dropped_at && (
                          <span
                            class="badge bg-danger"
                            title={`Dropped on ${new Date(event.dropped_at).toLocaleDateString()}`}
                          >
                            Dropped
                          </span>
                        )}
                        {!event.worn && !event.wielded && !event.dropped_at && (
                          <span class="text-muted small">In inventory</span>
                        )}
                      </div>
                    </td>
                    <td>{event.note || <span class="text-muted">—</span>}</td>
                  </tr>
                ))}
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
