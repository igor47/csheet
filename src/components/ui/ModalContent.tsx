import type { Child } from 'hono/jsx'

export interface ModalContentProps {
  title: string | Child,
  children?: Child,
}

export const ModalContent = ({ title, children }: ModalContentProps) => {
  return (<>
    <div class="modal-header">
      {typeof title === 'string' ? (
        <h5 class="modal-title">{title}</h5>
      ) : (
        title
      )}
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    {children}
  </>)
}
