import type { HitDieType } from "@src/lib/dnd"
import clsx from "clsx"

export interface HitDiceDisplayProps {
  allHitDice: HitDieType[]
  availableHitDice: HitDieType[]
}

export const HitDiceDisplay = ({ allHitDice, availableHitDice }: HitDiceDisplayProps) => {
  // Track which hit dice are used
  const hitDice: { value: number; used: boolean }[] = allHitDice.map((die) => ({
    value: die,
    used: true,
  }))
  for (const die of availableHitDice) {
    const index = hitDice.findIndex((d) => d.value === die && d.used)
    if (index !== -1) {
      hitDice[index]!.used = false
    }
  }

  return (
    <div class="d-flex justify-content-center flex-wrap gap-1">
      {hitDice.map(({ value, used }) => (
        <div
          class={clsx("position-relative", "border", "rounded", "px-2", "py-1", "small", {
            "bg-success-subtle": !used,
            "bg-danger-subtle": used,
          })}
          style="min-width: 50px; text-align: center;"
        >
          D{value}
          {used && (
            <i
              class={clsx(
                "bi",
                "bi-x-lg",
                "position-absolute",
                "top-50",
                "start-50",
                "translate-middle"
              )}
              style="font-size: 1.5rem; opacity: 0.7; z-index: 1; pointer-events: none;"
            ></i>
          )}
        </div>
      ))}
    </div>
  )
}
