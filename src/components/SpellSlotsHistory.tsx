import type { CharSpellSlot } from "@src/db/char_spell_slots"

export interface SpellSlotsHistoryProps {
  events: CharSpellSlot[]
}

export const SpellSlotsHistory = ({ events }: SpellSlotsHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Spell Slots History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No spell slot history found.</p>
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
                      ? `Used Level ${event.slot_level} slot`
                      : `Restored Level ${event.slot_level} slot`

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
