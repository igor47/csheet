import type { CharItemHistoryEvent } from "@src/db/char_items"
import type { ItemChargeHistoryEvent } from "@src/db/item_charges"

export interface ItemHistoryProps {
  events: CharItemHistoryEvent[]
  chargeEvents: ItemChargeHistoryEvent[]
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

export const ItemHistory = ({ events, chargeEvents }: ItemHistoryProps) => {
  // Build a map to track previous events for each item
  const itemEventMap = new Map<string, CharItemHistoryEvent>()

  // Process item events in reverse order (oldest first) to build the map
  const reversedEvents = [...events].reverse()
  const itemEventsWithActions = reversedEvents.map((event) => {
    const previousEvent = itemEventMap.get(event.item_id)
    const action = getActionDescription(event, previousEvent)
    itemEventMap.set(event.item_id, event)
    return { ...event, action }
  })

  // Combine and sort all events by date (newest first)
  const allEvents = [
    ...itemEventsWithActions.map((e) => ({ type: "item" as const, event: e, date: e.created_at })),
    ...chargeEvents.map((e) => ({ type: "charge" as const, event: e, date: e.created_at })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Item History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {allEvents.length === 0 ? (
          <p class="text-muted">No item history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {allEvents.map((entry) => {
                  if (entry.type === "charge") {
                    const chargeEvent = entry.event
                    return (
                      <tr key={`charge-${chargeEvent.id}`}>
                        <td>
                          <small class="text-muted">
                            {new Date(chargeEvent.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>{chargeEvent.item_name}</td>
                        <td>
                          <span
                            class={chargeEvent.delta > 0 ? "badge bg-success" : "badge bg-warning"}
                          >
                            {chargeEvent.delta > 0 ? "Added" : "Used"}
                          </span>
                        </td>
                        <td>
                          <span class={chargeEvent.delta > 0 ? "text-success" : "text-warning"}>
                            {chargeEvent.delta > 0 ? "+" : ""}
                            {chargeEvent.delta}
                          </span>
                        </td>
                        <td>{chargeEvent.note || <span class="text-muted">—</span>}</td>
                      </tr>
                    )
                  } else {
                    const itemEvent = entry.event
                    return (
                      <tr key={`item-${itemEvent.id}`}>
                        <td>
                          <small class="text-muted">
                            {new Date(itemEvent.created_at).toLocaleDateString()}
                          </small>
                        </td>
                        <td>{itemEvent.item_name}</td>
                        <td>
                          <span
                            class={
                              itemEvent.action === "Acquired"
                                ? "badge bg-success"
                                : itemEvent.action === "Dropped"
                                  ? "badge bg-danger"
                                  : "badge bg-info"
                            }
                          >
                            {itemEvent.action}
                          </span>
                        </td>
                        <td>
                          <div class="d-flex gap-1">
                            {itemEvent.worn && <span class="badge bg-secondary">Worn</span>}
                            {itemEvent.wielded && <span class="badge bg-primary">Wielded</span>}
                            {itemEvent.dropped_at && (
                              <span
                                class="badge bg-danger"
                                title={`Dropped on ${new Date(itemEvent.dropped_at).toLocaleDateString()}`}
                              >
                                Dropped
                              </span>
                            )}
                            {!itemEvent.worn && !itemEvent.wielded && !itemEvent.dropped_at && (
                              <span class="text-muted small">In inventory</span>
                            )}
                          </div>
                        </td>
                        <td>{itemEvent.note || <span class="text-muted">—</span>}</td>
                      </tr>
                    )
                  }
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
