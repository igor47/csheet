import type { CharTrait } from "@src/db/char_traits"
import { toTitleCase } from "@src/lib/strings"

export interface TraitHistoryProps {
  traits: CharTrait[]
}

export const TraitHistory = ({ traits }: TraitHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Trait History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {traits.length === 0 ? (
          <p class="text-muted">No traits found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Level</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {traits.map((trait) => (
                  <tr key={trait.id}>
                    <td>
                      <small class="text-muted">
                        {new Date(trait.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>{trait.name}</td>
                    <td>
                      {trait.source_detail ? (
                        <span class="text-capitalize">{toTitleCase(trait.source_detail)}</span>
                      ) : (
                        <span class="text-capitalize text-muted">{toTitleCase(trait.source)}</span>
                      )}
                    </td>
                    <td>{trait.level || <span class="text-muted">—</span>}</td>
                    <td>{trait.note || <span class="text-muted">—</span>}</td>
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
