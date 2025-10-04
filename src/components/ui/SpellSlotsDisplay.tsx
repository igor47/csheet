import clsx from 'clsx';
import type { SlotsBySpellLevel } from '@src/lib/dnd';

export interface SpellSlotsDisplayProps {
  allSlots: SlotsBySpellLevel | null;
  availableSlots: SlotsBySpellLevel | null;
}

export const SpellSlotsDisplay = ({ allSlots, availableSlots }: SpellSlotsDisplayProps) => {
  if (!allSlots) {
    return <div class="text-muted small">No spell slots</div>;
  }

  // Build array of slots with their level and availability
  const slots: { level: number, used: boolean }[] = [];

  for (let level = 1; level <= 9; level++) {
    const total = allSlots[level as keyof SlotsBySpellLevel] || 0;
    const available = availableSlots?.[level as keyof SlotsBySpellLevel] || 0;
    const used = total - available;

    // Add available slots (not used)
    for (let i = 0; i < available; i++) {
      slots.push({ level, used: false });
    }

    // Add used slots
    for (let i = 0; i < used; i++) {
      slots.push({ level, used: true });
    }
  }

  if (slots.length === 0) {
    return <div class="text-muted small">No spell slots</div>;
  }

  return (
    <div class="d-flex justify-content-center flex-wrap gap-1">
      {slots.map(({ level, used }, idx) => (
        <div
          key={idx}
          class={clsx(
            'position-relative',
            'border',
            'rounded',
            'px-2',
            'py-1',
            'small',
            { 'bg-success-subtle': !used, 'bg-danger-subtle': used }
          )}
          style="min-width: 50px; text-align: center;"
        >
          L{level}
          {used && (
            <i
              class={clsx('bi', 'bi-x-lg', 'position-absolute', 'top-50', 'start-50', 'translate-middle')}
              style="font-size: 1.5rem; opacity: 0.7; z-index: 1; pointer-events: none;"
            ></i>
          )}
        </div>
      ))}
    </div>
  );
};
