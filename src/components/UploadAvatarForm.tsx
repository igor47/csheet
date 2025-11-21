import type { Character } from "@src/db/characters"
import { MAX_UPLOAD_SIZE } from "@src/db/uploads"
import { ModalContent } from "./ui/ModalContent"

export interface UploadAvatarFormProps {
  character: Character
  errors?: Record<string, string>
}

export function UploadAvatarForm({ character, errors }: UploadAvatarFormProps) {
  const maxMb = Math.floor(MAX_UPLOAD_SIZE / (1024 * 1024))

  return (
    <ModalContent title="Upload Avatar">
      <div class="modal-body" id="avatarUploadModalBody">
        <div class="mb-3">
          <label for="avatarFileInput" class="form-label">
            Choose an image (max {maxMb}MB)
          </label>
          <input
            class="form-control"
            type="file"
            id="avatarFileInput"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heif"
          />
          <div class="form-text">Supported formats: JPEG, PNG, WebP, GIF, HEIF</div>
        </div>

        <div id="uploadProgress" class="d-none">
          <div class="progress mb-3">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated"
              role="progressbar"
              style="width: 100%"
            >
              Uploading...
            </div>
          </div>
        </div>

        {/* Error alert - used for both client-side and server-side errors */}
        <div
          id="uploadError"
          class={errors ? "alert alert-danger" : "alert alert-danger d-none"}
          role="alert"
        >
          {errors && Object.values(errors).map((error) => <div>{error}</div>)}
        </div>

        <div id="uploadSuccess" class="alert alert-success d-none" role="alert">
          Avatar uploaded successfully!
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          id="uploadAvatarBtn"
          onclick={`handleAvatarUpload('${character.id}')`}
        >
          Upload
        </button>
      </div>
    </ModalContent>
  )
}
