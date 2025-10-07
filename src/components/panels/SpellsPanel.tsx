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
        const spellCountText = spellInfo.spellcastingType === 'prepared'
          ? `${spellInfo.preparedSpells?.length || 0}/${spellInfo.maxSpellsPrepared || 0} prepared`
          : spellInfo.spellcastingType === 'known'
          ? `${spellInfo.knownSpells?.length || 0}/${spellInfo.maxSpellsKnown || 0} known`
          : '';

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
              <LabeledValue label="Spells" value={spellCountText} />
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

      {/* Combined spell list */}
      {character.spells.length > 0 && (() => {
        // Collect all spells from all classes
        type SpellRow = {
          spellId: string;
          className: string;
          isPrepared: boolean | null; // null = N/A
        };

        const allSpellRows: SpellRow[] = [];

        for (const spellInfo of character.spells) {
          // Add cantrips
          for (const spellId of spellInfo.cantrips) {
            allSpellRows.push({
              spellId,
              className: spellInfo.class,
              isPrepared: null, // Cantrips don't need preparation
            });
          }

          // Add known spells (for known casters)
          if (spellInfo.knownSpells) {
            for (const spellId of spellInfo.knownSpells) {
              allSpellRows.push({
                spellId,
                className: spellInfo.class,
                isPrepared: null, // Known spells don't need preparation
              });
            }
          }

          // Add spellbook spells (wizard only)
          if (spellInfo.spellbookSpells) {
            for (const spellId of spellInfo.spellbookSpells) {
              const isPrepared = spellInfo.preparedSpells?.includes(spellId) || false;
              allSpellRows.push({
                spellId,
                className: spellInfo.class,
                isPrepared,
              });
            }
          }

          // Add prepared spells (for non-wizard prepared casters like cleric, druid, paladin)
          // These casters can prepare from the full class list, so we only show what's prepared
          if (spellInfo.preparedSpells && !spellInfo.spellbookSpells) {
            for (const spellId of spellInfo.preparedSpells) {
              allSpellRows.push({
                spellId,
                className: spellInfo.class,
                isPrepared: true, // These are prepared
              });
            }
          }
        }

        // Remove duplicates (same spell from different classes)
        const uniqueSpells = new Map<string, SpellRow>();
        for (const row of allSpellRows) {
          const existingRow = uniqueSpells.get(row.spellId);
          if (!existingRow) {
            uniqueSpells.set(row.spellId, row);
          } else {
            // If spell exists, combine class names
            existingRow.className = `${existingRow.className}, ${row.className}`;
            // If either instance is prepared, mark as prepared
            if (row.isPrepared === true) {
              existingRow.isPrepared = true;
            }
          }
        }

        const spellRows = Array.from(uniqueSpells.values());

        // Sort by level, then name
        spellRows.sort((a, b) => {
          const spellA = spells.find(s => s.id === a.spellId);
          const spellB = spells.find(s => s.id === b.spellId);
          if (!spellA || !spellB) return 0;

          if (spellA.level !== spellB.level) {
            return spellA.level - spellB.level;
          }
          return spellA.name.localeCompare(spellB.name);
        });

        return (
          <div class="mt-3">
            <h6 class="mb-2">Spellbook</h6>
            {spellRows.length > 0 ? (
              <div class="table-responsive">
                <table class="table table-sm table-hover small">
                  <thead>
                    <tr>
                      <th>Spell</th>
                      <th>Level</th>
                      <th>Class</th>
                      <th>Prepared</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spellRows.map((row) => {
                      const spell = spells.find(s => s.id === row.spellId);
                      if (!spell) return null;

                      const preparedIcon = row.isPrepared === null
                        ? <span class="text-muted" title="Does not require preparation">N/A</span>
                        : row.isPrepared
                        ? <i class="bi bi-check-circle-fill text-success" title="Prepared"></i>
                        : <i class="bi bi-circle text-muted" title="Not prepared"></i>;

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
                          <td class="text-capitalize">{row.className}</td>
                          <td>{preparedIcon}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p class="text-muted small">No spells learned yet.</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
