import type { ComputedCharacter } from '@src/services/computeCharacter';
import type { SlotsBySpellLevel } from '@src/lib/dnd';

export interface CurrentStatusProps {
  character: ComputedCharacter;
  swapOob?: boolean;
}

export const CurrentStatus = ({ character, swapOob }: CurrentStatusProps) => {
  // Calculate HP deficit
  const hpLost = character.maxHitPoints - character.currentHP;

  // Calculate hit dice used
  const hitDiceUsed = character.hitDice.length - character.availableHitDice.length;

  // Calculate spell slots used
  let spellSlotsUsed = 0;
  if (character.spellSlots && character.availableSpellSlots) {
    for (let level = 1; level <= 9; level++) {
      const total = character.spellSlots[level as keyof SlotsBySpellLevel] || 0;
      const available = character.availableSpellSlots[level as keyof SlotsBySpellLevel] || 0;
      spellSlotsUsed += (total - available);
    }
  }

  // Determine if long rest is beneficial
  const fullStatus = hpLost === 0 && hitDiceUsed === 0 && spellSlotsUsed === 0;

  // Build status message
  const statusParts: string[] = [];

  if (hpLost > 0) {
    statusParts.push(`down ${hpLost} of ${character.maxHitPoints} hit points`);
  }

  if (hitDiceUsed > 0) {
    statusParts.push(`${hitDiceUsed} of ${character.hitDice.length} hit dice used`);
  }

  if (spellSlotsUsed > 0) {
    const totalSlots = Object.values(character.spellSlots || {}).reduce((sum, val) => sum + val, 0);
    statusParts.push(`${spellSlotsUsed} of ${totalSlots} spell slots used`);
  }

  const statusMessage = fullStatus ?
    "You are at full health with all spell slots and hit dice available."
    : `You are ${statusParts.join(', ')}.`

  return (
    <div class="card shadow-sm mb-3" id="current-status-card" hx-swap-oob={swapOob && 'true'}>
      <div class="card-header">
        <h5 class="mb-0">Current Status</h5>
      </div>
      <div class="card-body">
        <p class="mb-3">{statusMessage}</p>
        <button
          type="button"
          class="btn btn-primary w-100"
          disabled={fullStatus}
          hx-post={`/characters/${character.id}/longrest`}
          hx-target="#current-status-card"
          hx-swap="outerHTML"
          hx-confirm="Are you ready to take a long rest? This will require at least 8 in-game hours of downtime."
        >
          <i class="bi bi-moon-stars me-2"></i>
          Take Long Rest
        </button>
        {fullStatus && (
          <small class="text-muted d-block mt-2">
            No rest needed - all resources are available
          </small>
        )}
      </div>
    </div>
  );
};
