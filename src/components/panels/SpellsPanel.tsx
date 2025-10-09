import type { ComputedCharacter } from '@src/services/computeCharacter';
import { LabeledValue } from '@src/components/ui/LabeledValue';
import { SpellSlotsDisplay } from '@src/components/ui/SpellSlotsDisplay';
import { spells } from '@src/lib/dnd/spells';

export interface SpellsPanelProps {
  character: ComputedCharacter;
  swapOob?: boolean;
}

export const SpellsPanel = ({ character, swapOob }: SpellsPanelProps) => {
  const formatBonus = (value: number) => value >= 0 ? `+${value}` : `${value}`;

  return (
    <div class="accordion-body" id="spells-panel" hx-swap-oob={swapOob && 'true'}>
      {/* Spellcasting stats per class */}
      {character.spells.map((spellInfo) => {
        const spellCountText = `${spellInfo.cantripSlots.length} / ${spellInfo.preparedSpells.length}`;

        return (
          <div class="row g-2 h-auto mb-2">
            <div class="col-3 d-flex align-items-center justify-content-center">
              <div class="text-center text-capitalize">{spellInfo.class} Spells</div>
            </div>
            <div class="col-3">
              <LabeledValue label="Spell Attack" value={formatBonus(spellInfo.spellAttackBonus)} />
            </div>
            <div class="col-3">
              <LabeledValue label="Spell Save DC" value={spellInfo.spellSaveDC} />
            </div>
            <div class="col-3">
              <LabeledValue label="Cantrips/Spells" value={spellCountText} />
            </div>
          </div>
        );
      })}

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

      {/* Prepared Spells - unified table across all classes */}
      {character.spells.length > 0 && (() => {
        type SlotRow = {
          className: string;
          type: 'Cantrip' | 'Spell';
          spell_id: string | null;
          alwaysPrepared: boolean;
          slotIndex: number;
        };

        const allSlots: SlotRow[] = [];

        for (const spellInfo of character.spells) {
          // Add cantrip slots
          spellInfo.cantripSlots.forEach((slot, idx) => {
            allSlots.push({
              className: spellInfo.class,
              type: 'Cantrip',
              spell_id: slot.spell_id,
              alwaysPrepared: slot.alwaysPrepared,
              slotIndex: idx,
            });
          });

          // Add prepared spell slots
          spellInfo.preparedSpells.forEach((slot, idx) => {
            allSlots.push({
              className: spellInfo.class,
              type: 'Spell',
              spell_id: slot.spell_id,
              alwaysPrepared: slot.alwaysPrepared,
              slotIndex: idx,
            });
          });
        }

        // Sort: filled slots first, then empty
        allSlots.sort((a, b) => {
          if (a.spell_id === null && b.spell_id !== null) return 1;
          if (a.spell_id !== null && b.spell_id === null) return -1;
          // Within same empty/filled status, sort by class then type
          if (a.className !== b.className) return a.className.localeCompare(b.className);
          if (a.type !== b.type) return a.type === 'Cantrip' ? -1 : 1;
          return a.slotIndex - b.slotIndex;
        });

        return (
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Prepared Spells</h6>
              <button
                class="btn btn-sm btn-outline-secondary border p-1"
                style="width: 24px; height: 24px; line-height: 1;"
                aria-label="Spell preparation history"
                title="Spell preparation history"
                hx-get={`/characters/${character.id}/history/prepared-spells`}
                hx-target="#editModalContent"
                hx-swap="innerHTML"
                data-bs-toggle="modal"
                data-bs-target="#editModal">
                <i class="bi bi-clock-history"></i>
              </button>
            </div>
            {allSlots.length > 0 ? (
              <div class="table-responsive">
                <table class="table table-sm table-hover small">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Type</th>
                      <th>Spell</th>
                      <th style="width: 80px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSlots.map((row) => {
                      const spell = row.spell_id ? spells.find(s => s.id === row.spell_id) : null;

                      return (
                        <tr>
                          <td class="text-capitalize">{row.className}</td>
                          <td>{row.type}</td>
                          <td>
                            {spell ? (
                              <>
                                <a
                                  href="#"
                                  hx-get={`/spells/${spell.id}`}
                                  hx-target="#editModalContent"
                                  hx-swap="innerHTML"
                                  data-bs-toggle="modal"
                                  data-bs-target="#editModal"
                                  class="text-decoration-none"
                                >
                                  {spell.name}
                                </a>
                                {row.alwaysPrepared && (
                                  <span class="badge bg-secondary ms-1" title="Always prepared (e.g., domain spell)">
                                    <i class="bi bi-lock-fill"></i>
                                  </span>
                                )}
                              </>
                            ) : (
                              <span class="text-muted fst-italic">empty</span>
                            )}
                          </td>
                          <td>
                            <div class="d-flex gap-1">
                              <button
                                class="btn btn-sm btn-outline-secondary border p-0"
                                style="width: 24px; height: 24px; line-height: 1;"
                                aria-label="Edit slot"
                                title="Edit slot"
                                disabled={row.alwaysPrepared}
                                hx-get={`/characters/${character.id}/edit/prepspell?class=${row.className}&spell_type=${row.type.toLowerCase()}${row.spell_id ? `&current_spell_id=${row.spell_id}` : ''}`}
                                hx-target="#editModalContent"
                                hx-swap="innerHTML"
                                data-bs-toggle="modal"
                                data-bs-target="#editModal">
                                <i class="bi bi-pencil"></i>
                              </button>
                              {spell && (
                                <button
                                  class="btn btn-sm btn-outline-primary border p-0"
                                  style="width: 24px; height: 24px; line-height: 1;"
                                  aria-label="Cast spell"
                                  title="Cast spell"
                                  hx-post={`/characters/${character.id}/cast-spell`}
                                  hx-vals={`{"spell_id": "${spell.id}", "class": "${row.className}"}`}
                                  hx-target="#spells-panel"
                                  hx-swap="outerHTML">
                                  <i class="bi bi-lightning-fill"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="text-muted small">No spell slots available.</p>
            )}
          </div>
        );
      })()}

      {/* Wizard Spellbook */}
      {character.spells.some(si => si.knownSpells !== null) && (() => {
        const wizardInfo = character.spells.find(si => si.knownSpells !== null);
        if (!wizardInfo || !wizardInfo.knownSpells) return null;

        // Sort spells by level then name
        const sortedSpells = [...wizardInfo.knownSpells]
          .map(spellId => spells.find(s => s.id === spellId))
          .filter(Boolean)
          .sort((a, b) => {
            if (a!.level !== b!.level) return a!.level - b!.level;
            return a!.name.localeCompare(b!.name);
          });

        return (
          <div class="mt-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Spellbook</h6>
              <button
                class="btn btn-sm btn-outline-secondary border p-1"
                style="width: 24px; height: 24px; line-height: 1;"
                aria-label="Add to spellbook"
                title="Add to spellbook"
                hx-get={`/characters/${character.id}/edit/spellbook`}
                hx-target="#editModalContent"
                hx-swap="innerHTML"
                data-bs-toggle="modal"
                data-bs-target="#editModal">
                <i class="bi bi-plus"></i>
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-sm table-hover small">
                <thead>
                  <tr>
                    <th>Spell</th>
                    <th>Level</th>
                    <th>Prepared</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSpells.map((spell) => {
                    if (!spell) return null;

                    // Check if in cantrip or prepared slots
                    const isInCantripSlot = wizardInfo.cantripSlots.some(slot => slot.spell_id === spell.id);
                    const isInPreparedSlot = wizardInfo.preparedSpells.some(slot => slot.spell_id === spell.id);

                    const preparedIcon = spell.level === 0
                      ? (isInCantripSlot
                          ? <i class="bi bi-check-circle-fill text-success" title="In cantrip slot"></i>
                          : <i class="bi bi-circle text-muted" title="Not in cantrip slot"></i>)
                      : (isInPreparedSlot
                          ? <i class="bi bi-check-circle-fill text-success" title="Prepared"></i>
                          : <i class="bi bi-circle text-muted" title="Not prepared"></i>);

                    return (
                      <tr>
                        <td>
                          <a
                            href="#"
                            hx-get={`/spells/${spell.id}`}
                            hx-target="#editModalContent"
                            hx-swap="innerHTML"
                            data-bs-toggle="modal"
                            data-bs-target="#editModal"
                            class="text-decoration-none"
                          >
                            {spell.name}
                          </a>
                        </td>
                        <td>{spell.level === 0 ? 'Cantrip' : spell.level}</td>
                        <td>{preparedIcon}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
