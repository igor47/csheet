import type { CharProficiency } from "@src/db/char_proficiencies"
import { formatProficiencyName } from "@src/lib/dnd/proficiencies"
import { toTitleCase } from "@src/lib/strings"

export interface ProficienciesHistoryProps {
  events: CharProficiency[]
}

const KindLabels: Record<CharProficiency["kind"], string> = {
  weapon: "Weapon",
  armor: "Armor",
  tool: "Tool",
  language: "Language",
}

export const ProficienciesHistory = ({ events }: ProficienciesHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Proficiencies History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No proficiencies history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Change</th>
                  <th>Proficiency</th>
                  <th>Source</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr>
                    <td>
                      <small class="text-muted">
                        {new Date(event.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {event.action === "add" ? (
                        <span class="badge text-bg-success">Added</span>
                      ) : (
                        <span class="badge text-bg-danger">Removed</span>
                      )}
                    </td>
                    <td>
                      <span class="text-muted small">{KindLabels[event.kind]}:</span>{" "}
                      {formatProficiencyName(event.name)}
                    </td>
                    <td>
                      {event.source === "custom" ? (
                        event.source_detail || <span class="text-muted">Added by hand</span>
                      ) : (
                        <>
                          {event.source_detail ? toTitleCase(event.source_detail) : ""}{" "}
                          <span class="text-muted small">({event.source})</span>
                        </>
                      )}
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
