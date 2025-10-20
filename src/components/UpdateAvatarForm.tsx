import type { Character } from "@src/db/characters"
import { ModalContent } from "./ui/ModalContent"

export interface UpdateAvatarFormProps {
  character: Character
  errors?: Record<string, string>
}

export const UpdateAvatarForm = ({ character, errors }: UpdateAvatarFormProps) => (
  <ModalContent title={character.avatar_id ? "Replace Avatar" : "Upload Avatar"}>
    <div class="modal-body" id="avatarUploadModalBody">
      {/* Current Avatar Preview */}
      <div class="mb-3 text-center">
        <div class="d-inline-block position-relative" style="max-width: 300px;">
          <img
            src={
              character.avatar_id ? `/uploads/${character.avatar_id}` : "/static/placeholder.png"
            }
            alt={`${character.name}'s avatar`}
            class="img-fluid rounded"
            style="max-height: 300px; object-fit: contain;"
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="avatarFileInput" class="form-label">
          Choose an image (max 5MB)
        </label>
        <input
          class="form-control"
          type="file"
          id="avatarFileInput"
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
        <div class="form-text">Supported formats: JPEG, PNG, WebP, GIF</div>
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
        onclick="handleAvatarUpload()"
      >
        Upload
      </button>
    </div>
  </ModalContent>
)
