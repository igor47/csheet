import type { Child } from "hono/jsx"

export interface ModalFormProps {
  id: string
  endpoint: string
  trigger?: string
  swap?: string
  children: Child
}

export const ModalForm = ({
  id,
  endpoint,
  trigger = "change",
  swap = "morph:innerHTML",
  children,
}: ModalFormProps) => {
  return (
    <form
      id={id}
      hx-post={endpoint}
      hx-vals='{"is_check": "true"}'
      hx-trigger={trigger}
      hx-target="#editModalContent"
      hx-swap={swap}
      hx-ext="morph"
      class="needs-validation"
      novalidate
    >
      {children}
    </form>
  )
}

export interface ModalFormSubmitProps {
  endpoint: string
  children: Child
  disabled?: boolean
  id?: string
  swap?: string
}

export const ModalFormSubmit = ({
  endpoint,
  children,
  disabled,
  id,
  swap = "morph:innerHTML",
}: ModalFormSubmitProps) => {
  return (
    <button
      type="submit"
      id={id}
      class="btn btn-primary"
      hx-post={endpoint}
      hx-vals='{"is_check": "false"}'
      hx-target="#editModalContent"
      hx-swap={swap}
      hx-sync="closest form:replace"
      hx-ext="morph"
      disabled={disabled}
    >
      {children}
    </button>
  )
}
