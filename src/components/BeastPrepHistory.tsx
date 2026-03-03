import type { BeastPrepEvent } from "@src/db/char_beasts_seen"
import { getBeastById } from "@src/lib/dnd/beasts"
import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface BeastPrepHistoryProps {
  events: BeastPrepEvent[]
  character: ComputedCharacter
}

export const BeastPrepHistory = ({ events, character }: BeastPrepHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Known Forms History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No beast form history found.</p>
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
                  const beast = getBeastById(character.ruleset, event.beast_id)
                  const beastName = beast?.name || event.beast_id

                  let description: string
                  if (event.action === "learn") {
                    description = `Learned ${beastName}`
                  } else {
                    const replacedWith = event.replaced_by
                      ? getBeastById(character.ruleset, event.replaced_by)?.name ||
                        event.replaced_by
                      : "unknown"
                    description = `Replaced ${beastName} with ${replacedWith}`
                  }

                  return (
                    <tr key={`${event.beast_id}-${event.action}-${idx}`}>
                      <td>
                        <small class="text-muted">{event.timestamp.toLocaleDateString()}</small>
                      </td>
                      <td>{description}</td>
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
