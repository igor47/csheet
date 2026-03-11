import { clsx } from "clsx"

export interface LabeledValueProps {
  label: string
  value: string | number
  className?: string
  hasEffect?: boolean
  effectTooltip?: string
  fromBeast?: boolean
  beastTooltip?: string
}

export const LabeledValue = ({
  label,
  value,
  className = "",
  hasEffect = false,
  effectTooltip,
  fromBeast = false,
  beastTooltip,
}: LabeledValueProps) => {
  const tooltipAttrs =
    hasEffect && effectTooltip
      ? { "data-bs-toggle": "tooltip", "data-bs-placement": "top", title: effectTooltip }
      : fromBeast && beastTooltip
        ? { "data-bs-toggle": "tooltip", "data-bs-placement": "top", title: beastTooltip }
        : {}

  return (
    <div
      class={clsx("position-relative border rounded p-2 pt-4 h-100", className, {
        "border-primary border-2": hasEffect,
        "bg-warning-subtle border-warning": fromBeast,
      })}
      {...tooltipAttrs}
    >
      <div class="position-absolute top-0 start-0 ms-2 mt-1 small text-muted">{label}</div>
      <div class="text-end">{value}</div>
    </div>
  )
}
