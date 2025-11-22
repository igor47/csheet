import type { Child } from "hono/jsx"

// DetailModal wrapper component
export interface DetailModalProps {
  size?: "sm" | "lg" | "xl" | "fullscreen"
  children?: Child
}

export const DetailModal = ({ size, children }: DetailModalProps) => {
  const dialogClass = size ? `modal-dialog modal-${size}` : "modal-dialog"

  return (
    <div class="modal fade" id="detailModal" tabindex={-1} aria-hidden="true">
      <div class={dialogClass}>
        <div class="modal-content" id="detailModalContent">
          {children}
        </div>
      </div>
    </div>
  )
}

// ModalContent component (header + children)
export interface ModalContentProps {
  title: string | Child
  children?: Child
}

export const ModalContent = ({ title, children }: ModalContentProps) => {
  return (
    <>
      <div class="modal-header">
        {typeof title === "string" ? <h5 class="modal-title">{title}</h5> : title}
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      {children}
    </>
  )
}

// Helper component for modal body
export interface ModalBodyProps {
  children: Child
}

export const ModalBody = ({ children }: ModalBodyProps) => {
  return <div class="modal-body">{children}</div>
}

// Helper component for modal footer
export interface ModalFooterProps {
  children: Child
}

export const ModalFooter = ({ children }: ModalFooterProps) => {
  return <div class="modal-footer">{children}</div>
}
