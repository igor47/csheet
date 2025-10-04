import clsx from 'clsx';

export interface HitPointsBarProps {
  currentHP: number;
  maxHitPoints: number;
}

export const HitPointsBar = ({ currentHP, maxHitPoints }: HitPointsBarProps) => {
  const hpPercent = (currentHP / maxHitPoints) * 100;
  const hpProgressCls = clsx('progress-bar', {
    'bg-success': hpPercent > 75,
    'bg-warning': hpPercent > 25 && hpPercent <= 75,
    'bg-danger': hpPercent <= 25,
  });

  return (
    <div class="progress" style="height: 25px;">
      <div
        class={hpProgressCls}
        role="progressbar"
        style={`width: ${hpPercent}%`}
        aria-valuenow={currentHP}
        aria-valuemin="0"
        aria-valuemax={maxHitPoints}
      >
        {currentHP} / {maxHitPoints}
      </div>
    </div>
  );
};
