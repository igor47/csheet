import type { JSX } from "hono/jsx"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<JSX.IntrinsicElements["select"], "value"> {
  options: SelectOption[]
  placeholder?: string
  error?: string
  value?: string
  hideErrorMsg?: boolean
}

export const Select = ({
  options,
  placeholder = "Select an option",
  error,
  hideErrorMsg = false,
  value,
  class: className,
  ...props
}: SelectProps) => (
  <>
    <select class={`form-select ${error ? "is-invalid" : ""} ${className || ""}`} {...props}>
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option value={opt.value} selected={value === opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && !hideErrorMsg && <div class="invalid-feedback d-block">{error}</div>}
  </>
)
