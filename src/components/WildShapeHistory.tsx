import type { CharWildShapeUse } from "@src/db/char_wild_shape_uses"
import { getBeastById } from "@src/lib/dnd/beasts"
import type { RulesetId } from "@src/lib/dnd/rulesets"

export interface WildShapeHistoryProps {
  events: CharWildShapeUse[]
  ruleset: RulesetId
}

export const WildShapeHistory = ({ events, ruleset }: WildShapeHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Wild Shape History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No wild shape history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Beast</th>
                  <th>Final HP</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const beast = getBeastById(ruleset, event.beast_id)
                  const beastName = beast?.name || "Unknown Beast"
                  const maxHp = beast?.hitPoints ?? 0
                  const isOngoing = !event.ended_at

                  return (
                    <tr key={event.id}>
                      <td>
                        <small class="text-muted">
                          {new Date(event.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td>{beastName}</td>
                      <td>
                        {isOngoing ? (
                          <span class="badge text-bg-success">Active</span>
                        ) : (
                          <span class={event.beast_hp === 0 ? "text-danger" : ""}>
                            {event.beast_hp ?? "—"}/{maxHp}
                          </span>
                        )}
                      </td>
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
