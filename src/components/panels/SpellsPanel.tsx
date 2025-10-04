import type { ComputedCharacter } from '@src/services/computeCharacter';
import { LabeledValue } from '@src/components/ui/LabeledValue';
import { SpellSlotsDisplay } from '@src/components/ui/SpellSlotsDisplay';

export interface SpellsPanelProps {
  character: ComputedCharacter;
  swapOob?: boolean;
}

export const SpellsPanel = ({ character, swapOob }: SpellsPanelProps) => {
  const formatBonus = (value: number) => value >= 0 ? `+${value}` : `${value}`;

  return (
    <div class="accordion-body" id="spells-panel" hx-swap-oob={swapOob && 'true'}>
      {/* Spellcasting stats per class */}
      {character.spellcasting.map((stats) => (
        <div class="row g-2 h-auto">
          <div class="col-3 d-flex align-items-center justify-content-center">
            <div class="text-center text-capitalize">{stats.class} Spells</div>
          </div>
          <div class="col-4">
            <LabeledValue label="Spell Attack" value={formatBonus(stats.spellAttackBonus)} />
          </div>
          <div class="col-4">
            <LabeledValue label="Spell Save DC" value={stats.spellSaveDC} />
          </div>
        </div>
      ))}

      {/* Spell slots */}
      {character.spellSlots && (
        <div class="row g-2 h-auto mt-2 mb-2">
          <div class="col-10 col-md-2">
            <div class="text-muted small text-center">Spell Slots</div>
          </div>
          <div class="col-10 col-md-8">
            <SpellSlotsDisplay
              allSlots={character.spellSlots}
              availableSlots={character.availableSpellSlots}
            />
          </div>
          <div class="col-2 d-flex gap-1 align-items-center">
            <button
              class="btn btn-sm btn-outline-secondary border p-1"
              style="width: 24px; height: 24px; line-height: 1;"
              aria-label="Edit spell slots"
              title="Edit spell slots"
              hx-get={`/characters/${character.id}/edit/spellslots`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal">
              <i class="bi bi-pencil"></i>
            </button>
            <button
              class="btn btn-sm btn-outline-secondary border p-1"
              style="width: 24px; height: 24px; line-height: 1;"
              aria-label="Spell splot history"
              title="Spell slot history"
              hx-get={`/characters/${character.id}/history/spellslots`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
              data-bs-toggle="modal"
              data-bs-target="#editModal">
              <i class="bi bi-journals"></i>
            </button>
          </div>

        </div>
      )}

      {/* TODO: Spell list - Tabs for spell levels */}
      <ul class="nav nav-tabs small" id="spellTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#cantrips" type="button" role="tab">Cantrips</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#lvl1" type="button" role="tab">Level 1</button>
        </li>
      </ul>
      <div class="tab-content border border-top-0 rounded-bottom p-3 small">
        <div class="tab-pane fade show active" id="cantrips" role="tabpanel">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="c1" />
            <label class="form-check-label" for="c1">Mage Hand</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="c2" />
            <label class="form-check-label" for="c2">Minor Illusion</label>
          </div>
        </div>
        <div class="tab-pane fade" id="lvl1" role="tabpanel">
          <div class="list-group">
            <label class="list-group-item d-flex align-items-start">
              <input class="form-check-input me-2 mt-1" type="checkbox" />
              <div>
                <div class="fw-semibold">Shield</div>
                <div class="text-muted small">+5 AC until start of your next turn.</div>
              </div>
              <span class="badge text-bg-primary ms-auto">Reaction</span>
            </label>
            <label class="list-group-item d-flex align-items-start">
              <input class="form-check-input me-2 mt-1" type="checkbox" />
              <div>
                <div class="fw-semibold">Faerie Fire</div>
                <div class="text-muted small">Creatures outlined in light; attacks have advantage.</div>
              </div>
              <span class="badge text-bg-secondary ms-auto">Action</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
