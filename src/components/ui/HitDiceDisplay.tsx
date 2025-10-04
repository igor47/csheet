import clsx from 'clsx';
import type { HitDieType } from '@src/lib/dnd';

export interface HitDiceDisplayProps {
  allHitDice: HitDieType[];
  availableHitDice: HitDieType[];
}

export const HitDiceDisplay = ({ allHitDice, availableHitDice }: HitDiceDisplayProps) => {
  // Track which hit dice are used
  const hitDice: { value: number, used: boolean }[] = allHitDice.map(die => ({ value: die, used: true }));
  for (const die of availableHitDice) {
    const index = hitDice.findIndex(d => d.value === die && d.used);
    if (index !== -1) {
      hitDice[index]!.used = false;
    }
  }

  return (
    <div class="d-flex justify-content-center">
      <ul class="list-group list-group-horizontal">
        {hitDice.map(({value, used}, idx) => {
          return (
            <li
              key={idx}
              class={clsx('list-group-item', 'position-relative', 'p-2', { 'bg-success-suble': !used, 'bg-danger-subtle': used })}
            >
              D{value}
              {used && (
                <i class={clsx('bi', 'bi-x-lg', 'position-absolute', 'top-50', 'start-50', 'translate-middle')} style="font-size: 1.5rem; opacity: 0.5;"></i>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
