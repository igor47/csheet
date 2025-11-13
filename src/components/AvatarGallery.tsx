import type { ComputedCharacter } from "@src/services/computeCharacter"
import { AvatarDisplay } from "./AvatarDisplay"
import { ModalContent } from "./ui/ModalContent"

export interface AvatarGalleryProps {
  character: ComputedCharacter
}

export const AvatarGallery = ({ character }: AvatarGalleryProps) => {
  const hasAvatars = character.avatars.length > 0

  return (
    <ModalContent title="Avatar Gallery">
      <div class="modal-body">
        {!hasAvatars && (
          <div class="text-center text-muted py-4">
            <p>No avatars uploaded yet.</p>
          </div>
        )}

        {hasAvatars && (
          <div class="row g-3">
            {character.avatars.map((avatar, index) => (
              <div class="col-6 col-md-4" key={avatar.id}>
                <div class="card">
                  <div class="card-body p-2">
                    {/* Avatar preview - click to open lightbox */}
                    <AvatarDisplay
                      character={character}
                      avatarIndex={index}
                      mode="clickable-lightbox"
                      className="rounded"
                    />

                    {/* Action buttons */}
                    <div class="d-flex gap-1 flex-column mt-2">
                      {/* Primary button/badge */}
                      {avatar.is_primary ? (
                        <div class="btn btn-sm btn-primary disabled">
                          <i class="bi bi-star-fill"></i> Primary
                        </div>
                      ) : (
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          hx-post={`/characters/${character.id}/avatars/${avatar.id}/set-primary`}
                          hx-target="#editModalContent"
                          hx-swap="innerHTML"
                        >
                          <i class="bi bi-star"></i> Primary
                        </button>
                      )}

                      {/* Crop button */}
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        hx-get={`/characters/${character.id}/avatars/${index}/crop-editor`}
                        hx-target="#editModalContent"
                        hx-swap="innerHTML"
                      >
                        <i class="bi bi-crop"></i> Crop
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        hx-delete={`/characters/${character.id}/avatars/${avatar.id}`}
                        hx-target="closest .modal-body"
                        hx-swap="outerHTML"
                        hx-confirm="Are you sure you want to delete this avatar?"
                      >
                        <i class="bi bi-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-primary"
          hx-get={`/characters/${character.id}/edit/avatar`}
          hx-target="#editModalContent"
          hx-swap="innerHTML"
        >
          <i class="bi bi-upload"></i> Upload New Avatar
        </button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Close
        </button>
      </div>
    </ModalContent>
  )
}
