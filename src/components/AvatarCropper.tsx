import { ModalContent } from "./ui/ModalContent"

export interface AvatarCropperProps {
  characterId: string
  avatarId?: string
  uploadUrl: string
  existingCrop?: {
    x: number
    y: number
    width: number
    height: number
  } | null
  isNewUpload?: boolean
}

export const AvatarCropper = ({
  characterId,
  avatarId,
  uploadUrl,
  existingCrop,
  isNewUpload = false,
}: AvatarCropperProps) => {
  const action = avatarId
    ? `/characters/${characterId}/avatars/${avatarId}/crop`
    : `/characters/${characterId}/avatars`

  return (
    <ModalContent title={avatarId ? "Adjust Crop" : "Crop Avatar"}>
      <div class="modal-body">
        {/* Image container for Cropper.js */}
        <div class="mb-3" style="max-height: 500px;">
          <img
            id="cropperImage"
            src={uploadUrl}
            alt="Avatar to crop"
            style="max-width: 100%; display: block;"
            data-existing-crop={existingCrop ? JSON.stringify(existingCrop) : ""}
          />
        </div>

        {/* Form for submitting crop data */}
        <form id="cropForm" hx-post={action} hx-target="#character-info" hx-swap="outerHTML">
          {/* Hidden fields for crop percentages */}
          <input type="hidden" id="crop_x_percent" name="crop_x_percent" />
          <input type="hidden" id="crop_y_percent" name="crop_y_percent" />
          <input type="hidden" id="crop_width_percent" name="crop_width_percent" />
          <input type="hidden" id="crop_height_percent" name="crop_height_percent" />

          {/* For new uploads, include the upload_id */}
          {isNewUpload && (
            <input type="hidden" name="upload_id" value={uploadUrl.split("/").pop()} />
          )}

          <div id="cropError" class="alert alert-danger d-none" role="alert"></div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Cancel
        </button>
        <button type="button" class="btn btn-primary" id="saveCropBtn">
          Save Crop
        </button>
      </div>
    </ModalContent>
  )
}
