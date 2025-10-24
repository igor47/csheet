import type { CharCoins } from "@src/db/char_coins"

export interface CoinsHistoryProps {
  events: CharCoins[]
}

export const CoinsHistory = ({ events }: CoinsHistoryProps) => {
  return (
    <>
      <div class="modal-header">
        <h5 class="modal-title">Coins History</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        {events.length === 0 ? (
          <p class="text-muted">No coin history found.</p>
        ) : (
          <div class="table-responsive">
            <table class="table table-sm table-striped">
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="text-end">PP</th>
                  <th class="text-end">GP</th>
                  <th class="text-end">EP</th>
                  <th class="text-end">SP</th>
                  <th class="text-end">CP</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  return (
                    <tr key={event.id}>
                      <td>
                        <small class="text-muted">
                          {new Date(event.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td class="text-end">{event.pp}</td>
                      <td class="text-end">{event.gp}</td>
                      <td class="text-end">{event.ep}</td>
                      <td class="text-end">{event.sp}</td>
                      <td class="text-end">{event.cp}</td>
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
