import clsx from "clsx"

export interface HitPointsBarProps {
  currentHP: number
  maxHitPoints: number
}

export const HitPointsBar = ({ currentHP, maxHitPoints }: HitPointsBarProps) => {
  const hpPercent = Math.max((currentHP / maxHitPoints) * 100, 0)
  const hpProgressCls = clsx("progress-bar", {
    "bg-success": hpPercent > 75,
    "bg-warning": hpPercent > 25 && hpPercent <= 75,
    "bg-danger": hpPercent <= 25,
  })

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
        {hpPercent > 0 && `${currentHP} / ${maxHitPoints}`}
      </div>
      {/* an empty bar has no room for the label, so show it on the track instead */}
      {hpPercent <= 0 && (
        <span class="w-100 text-center fw-bold text-danger align-self-center small">
          {currentHP} / {maxHitPoints}
        </span>
      )}
    </div>
  )
}
