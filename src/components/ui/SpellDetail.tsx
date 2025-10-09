import { type Spell } from '@src/lib/dnd/spells';
import { toTitleCase } from '@src/lib/strings';

export interface SpellDetailProps {
  spell: Spell;
}

export const SpellDetail = ({ spell }: SpellDetailProps) => (
  <div class="mb-3">
    <div class="card">
      <div class="card-header">
        <strong>{spell.name}</strong>
        {spell.ritual && <span class="badge bg-secondary ms-2">Ritual</span>}
      </div>
      <div class="card-body">
        <p class="text-muted mb-2">
          <em>
            {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}{' '}
            {toTitleCase(spell.school)}
          </em>
        </p>
        <p class="small">{spell.briefDescription}</p>
        {spell.description && (
          <details class="small">
            <summary>Full Description</summary>
            <p class="mt-2">{spell.description}</p>
          </details>
        )}
      </div>
    </div>
  </div>
);
