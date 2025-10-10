import type { CharSpellLearned } from '@src/db/char_spells_learned';
import { spells } from '@src/lib/dnd/spells';

export interface SpellbookHistoryProps {
  events: CharSpellLearned[];
}

export const SpellbookHistory = ({ events }: SpellbookHistoryProps) => {
  return (<>
    <div class="modal-header">
      <h5 class="modal-title">Spellbook History</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      {events.length === 0 ? (
        <p class="text-muted">No spellbook history found.</p>
      ) : (
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Spell</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const spell = spells.find(s => s.id === event.spell_id);
                const spellName = spell ? spell.name : `Unknown (${event.spell_id})`;

                return (
                  <tr key={event.id}>
                    <td>
                      <small class="text-muted">
                        {new Date(event.created_at).toLocaleDateString()}
                      </small>
                    </td>
                    <td>{spellName}</td>
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
