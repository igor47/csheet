import type { CharacterAvatar } from "@src/db/character_avatars"
import { AvatarDisplay } from "./AvatarDisplay"
import { ModalContent } from "./ui/ModalContent"

export interface AvatarGalleryProps {
  characterId: string
  avatars: Array<CharacterAvatar & { uploadUrl: string }>
}

export const AvatarGallery = ({ characterId, avatars }: AvatarGalleryProps) => {
  const hasAvatars = avatars.length > 0

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
            {avatars.map((avatar) => (
              <div class="col-6 col-md-4" key={avatar.id}>
                <div class="card">
                  <div class="card-body p-2">
                    {/* Avatar preview (show with crop) */}
                    <button
                      type="button"
                      class="btn p-0 border-0 w-100 mb-2"
                      hx-get={`/characters/${characterId}/avatars/${avatar.id}/crop-editor`}
                      hx-target="#editModalContent"
                      hx-swap="innerHTML"
                    >
                      <AvatarDisplay
                        uploadUrl={avatar.uploadUrl}
                        cropPercents={avatar}
                        alt="Avatar"
                        className="rounded"
                      />
                    </button>

                    {/* Primary badge/button */}
                    <div class="d-flex gap-1 flex-column">
                      {avatar.is_primary ? (
                        <div class="btn btn-sm btn-primary disabled">
                          <i class="bi bi-star-fill"></i> Primary
                        </div>
                      ) : (
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-primary"
                          hx-post={`/characters/${characterId}/avatars/${avatar.id}/set-primary`}
                          hx-target="#editModalContent"
                          hx-swap="innerHTML"
                        >
                          <i class="bi bi-star"></i> Primary
                        </button>
                      )}
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        hx-delete={`/characters/${characterId}/avatars/${avatar.id}`}
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
          hx-get={`/characters/${characterId}/edit/avatar`}
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
