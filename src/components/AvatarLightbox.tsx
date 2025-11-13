import type { ComputedCharacter } from "@src/services/computeCharacter"
import { AvatarDisplay } from "./AvatarDisplay"
import { ModalContent } from "./ui/ModalContent"

export interface AvatarLightboxProps {
  character: ComputedCharacter
  currentIndex: number
}

export const AvatarLightbox = ({ character, currentIndex }: AvatarLightboxProps) => {
  const totalAvatars = character.avatars.length
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalAvatars - 1
  const nextIndex = currentIndex < totalAvatars - 1 ? currentIndex + 1 : 0
  const showNavigation = totalAvatars > 1

  return (
    <ModalContent title={`Avatar ${currentIndex + 1} of ${totalAvatars}`}>
      <div class="modal-body position-relative" style="min-height: 400px;">
        {/* Main avatar display */}
        <div class="d-flex justify-content-center align-items-center">
          <div style="max-width: 600px; width: 100%;">
            <AvatarDisplay character={character} avatarIndex={currentIndex} mode="display-only" />
          </div>
        </div>

        {/* Navigation arrows */}
        {showNavigation && (
          <>
            <button
              aria-label="Previous Avatar"
              type="button"
              class="btn btn-lg btn-dark position-absolute top-50 start-0 translate-middle-y ms-2"
              style="opacity: 0.7; z-index: 10;"
              hx-get={`/characters/${character.id}/avatars/lightbox?index=${prevIndex}`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
            >
              <i class="bi bi-chevron-left"></i>
            </button>
            <button
              aria-label="Next Avatar"
              type="button"
              class="btn btn-lg btn-dark position-absolute top-50 end-0 translate-middle-y me-2"
              style="opacity: 0.7; z-index: 10;"
              hx-get={`/characters/${character.id}/avatars/lightbox?index=${nextIndex}`}
              hx-target="#editModalContent"
              hx-swap="innerHTML"
            >
              <i class="bi bi-chevron-right"></i>
            </button>
          </>
        )}
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          hx-get={`/characters/${character.id}/avatars`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
        >
          <i class="bi bi-grid-3x3"></i> Back to Gallery
        </button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </ModalContent>
  )
}
