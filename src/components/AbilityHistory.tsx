import type { CharAbility } from '@src/db/char_abilities';

export interface AbilityHistoryProps {
  ability: string;
  events: CharAbility[];
}

export const AbilityHistory = ({ ability, events }: AbilityHistoryProps) => {
  return (<>
    <div class="modal-header">
      <h5 class="modal-title">{ability.charAt(0).toUpperCase() + ability.slice(1)} History</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      {events.length === 0 ? (
        <p class="text-muted">No ability history found.</p>
      ) : (
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Score</th>
                <th>Proficiency</th>
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
                    <td>{event.score}</td>
                    <td>
                      {event.proficiency ? (
                        <span class="badge bg-success">Proficient</span>
                      ) : (
                        <span class="badge bg-secondary">Not Proficient</span>
                      )}
                    </td>
                    <td>{event.note || <span class="text-muted">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
  </>);
};
