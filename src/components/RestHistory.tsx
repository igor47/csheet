import type { CharRest, ShortRestDetails } from "@src/db/char_rests"

export interface RestHistoryProps {
  events: CharRest[]
}

function formatRestSummary(event: CharRest): string {
  const parts: string[] = []

  if (event.hp_restored > 0) {
    parts.push(`+${event.hp_restored} HP`)
  }

  if (event.hit_dice_spent > 0) {
    parts.push(`${event.hit_dice_spent} HD spent`)
  }

  if (event.hit_dice_restored > 0) {
    parts.push(`${event.hit_dice_restored} HD restored`)
  }

  if (event.spell_slots_restored > 0) {
    parts.push(`${event.spell_slots_restored} slots restored`)
  }

  // Add dice roll details for short rests
  if (event.rest_type === "short" && event.details) {
    const details = event.details as ShortRestDetails
    if (details.diceRolls && details.diceRolls.length > 0) {
      const rollDetails = details.diceRolls
        .map((r) => `d${r.die}: ${r.roll}+${r.modifier}`)
        .join(", ")
      parts.push(`(${rollDetails})`)
    }
    if (details.arcaneRecoveryUsed) {
      parts.push("Arcane Recovery")
    }
  }

  return parts.length > 0 ? parts.join(", ") : "No changes"
}

export const RestHistory = ({ events }: RestHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Rest History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No rest history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Summary</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <small class="text-muted">
                        {new Date(event.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {event.rest_type === "short" ? (
                        <span title="Short Rest">
                          <i class="bi bi-cup-hot text-primary me-1"></i>
                          Short
                        </span>
                      ) : (
                        <span title="Long Rest">
                          <i class="bi bi-moon-stars text-primary me-1"></i>
                          Long
                        </span>
                      )}
                    </td>
                    <td>{formatRestSummary(event)}</td>
                    <td>{event.note || <span class="text-muted">-</span>}</td>
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
