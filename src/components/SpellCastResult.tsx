import { spells } from "@src/lib/dnd/spells"
import { SpellDetail } from "./SpellDetail"
import { ModalContent } from "./ui/ModalContent"

export interface SpellCastResultProps {
  message: string
  spellId: string
}

export const SpellCastResult = ({ message, spellId }: SpellCastResultProps) => {
  const spell = spells.find((s) => s.id === spellId)

  if (!spell) {
    return (
      <ModalContent title="Spell Cast">
        <div class="modal-body">
          <div class="alert alert-warning">
            Spell was cast successfully, but spell details are not available.
          </div>
          <p>{message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
            Close
          </button>
        </div>
      </ModalContent>
    )
  }

  return (
    <ModalContent title="Spell Cast Successfully!">
      <div class="modal-body">
        {/* Success message */}
        <div class="alert alert-success mb-3">
          <i class="bi bi-check-circle-fill me-2"></i>
          {message}
        </div>

        {/* Spell details with accordion */}
        <SpellDetail spell={spell} compact={true} />
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
          <i class="bi bi-check-lg me-1"></i>
          Close
        </button>
      </div>
    </ModalContent>
  )
}
