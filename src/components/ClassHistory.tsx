import type { CharLevel } from "@src/db/char_levels"
import { toTitleCase } from "@src/lib/strings"

export interface ClassHistoryProps {
  levels: CharLevel[]
}

export const ClassHistory = ({ levels }: ClassHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Class History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {levels.length === 0 ? (
          <p class="text-muted">No level history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Level</th>
                  <th>Subclass</th>
                  <th>HP Roll</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level) => (
                  <tr key={level.id}>
                    <td>
                      <small class="text-muted">
                        {new Date(level.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>{toTitleCase(level.class)}</td>
                    <td>{level.level}</td>
                    <td>
                      {level.subclass ? (
                        toTitleCase(level.subclass)
                      ) : (
                        <span class="text-muted">—</span>
                      )}
                    </td>
                    <td>{level.hit_die_roll}</td>
                    <td>{level.note || <span class="text-muted">—</span>}</td>
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
