import type { ComputedCharacter } from "@src/services/computeCharacter"
import { ModalContent } from "./ui/ModalContent"

export interface AvatarCropperProps {
  character: ComputedCharacter
  avatarIndex: number
}

export const AvatarCropper = ({ character, avatarIndex }: AvatarCropperProps) => {
  const avatar = character.avatars[avatarIndex]
  if (!avatar) {
    throw new Error(`Avatar at index ${avatarIndex} not found`)
  }

  const uploadUrl = avatar.uploadUrl

  const existingCrop = {
    x: avatar.crop_x_percent,
    y: avatar.crop_y_percent!,
    width: avatar.crop_width_percent!,
    height: avatar.crop_height_percent!,
  }

  const action = `/characters/${character.id}/avatars/${avatar.id}/crop`

  return (
    <ModalContent title="Adjust Crop">
      <div class="modal-body">
        {/* Cropper.js v2 web components */}
        <div class="mb-3" style="max-width: 100%;">
          <cropper-canvas style="height: 500px; width: 100%;">
            <cropper-image src={uploadUrl} alt="Avatar to crop" scalable translatable />

            <cropper-shade hidden></cropper-shade>
            <cropper-handle action="move" plain></cropper-handle>
            <cropper-selection
              aspectRatio="1"
              movable
              resizable
              zoomable
              data-existingx={existingCrop.x ?? null}
              data-existingy={existingCrop.y ?? null}
              data-existingw={existingCrop.width ?? null}
              data-existingh={existingCrop.height ?? null}
            >
              <cropper-grid role="grid" covered></cropper-grid>
              <cropper-crosshair centered></cropper-crosshair>
              <cropper-handle
                action="move"
                theme-color="rgba(255, 255, 255, 0.35)"
              ></cropper-handle>
              <cropper-handle action="n-resize"></cropper-handle>
              <cropper-handle action="e-resize"></cropper-handle>
              <cropper-handle action="s-resize"></cropper-handle>
              <cropper-handle action="w-resize"></cropper-handle>
              <cropper-handle action="ne-resize"></cropper-handle>
              <cropper-handle action="nw-resize"></cropper-handle>
              <cropper-handle action="se-resize"></cropper-handle>
              <cropper-handle action="sw-resize"></cropper-handle>
            </cropper-selection>
          </cropper-canvas>
        </div>

        {/* Form for submitting crop data */}
        <form id="cropForm" hx-post={action} hx-target="#character-info" hx-swap="outerHTML">
          {/* Hidden fields for crop percentages */}
          <input type="hidden" id="crop_x_percent" name="crop_x_percent" />
          <input type="hidden" id="crop_y_percent" name="crop_y_percent" />
          <input type="hidden" id="crop_width_percent" name="crop_width_percent" />
          <input type="hidden" id="crop_height_percent" name="crop_height_percent" />

          <div id="cropError" class="alert alert-danger d-none" role="alert"></div>
        </form>
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
        <button
          type="button"
          class="btn btn-primary"
          hx-post={action}
          hx-include="#cropForm"
          hx-target="#editModalContent"
          hx-swap="innerHTML"
        >
          Save Crop
        </button>
      </div>

      <script src="/static/avatar-cropper.js"></script>
    </ModalContent>
  )
}
