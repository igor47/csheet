import type { CropPercents } from "@src/db/character_avatars"
import type { CharacterAvatarWithUrl, ComputedCharacter } from "@src/services/computeCharacter"

export interface AvatarDisplayProps {
  character: ComputedCharacter
  avatarIndex?: number
  mode: "clickable-gallery" | "clickable-lightbox" | "display-only"
  className?: string
}

/**
 * Calculate CSS object-position from crop percentages
 * The object-position centers the crop area within the visible container
 */
function getCropStyle(cropPercents?: CropPercents | null) {
  if (!cropPercents) {
    return {
      objectFit: "cover" as const,
      objectPosition: "50% 50%",
    }
  }

  // Calculate the center point of the crop area
  const centerX = (cropPercents.crop_x_percent + cropPercents.crop_width_percent / 2) * 100
  const centerY = (cropPercents.crop_y_percent + cropPercents.crop_height_percent / 2) * 100

  return {
    objectFit: "cover" as const,
    objectPosition: `${centerX}% ${centerY}%`,
  }
}

/**
 * Display an avatar image with optional soft-crop using CSS
 * Supports three modes:
 * - clickable-gallery: Button that opens avatar gallery modal
 * - clickable-lightbox: Button that opens lightbox at specific avatar index
 * - display-only: Just renders the image
 */
export const AvatarDisplay = ({
  character,
  avatarIndex,
  mode,
  className = "",
}: AvatarDisplayProps) => {
  // For clickable-gallery mode, use primary avatar
  // For other modes, use specified index or primary
  let avatar: CharacterAvatarWithUrl | undefined
  if (mode === "clickable-gallery") {
    avatar = character.avatars.find((a) => a.is_primary) || character.avatars[0]
  } else {
    const index = avatarIndex ?? 0
    avatar = character.avatars[index]
  }

  const imgUrl = avatar?.uploadUrl || "/static/placeholder.png"
  const cropPercents =
    avatar &&
    avatar.crop_x_percent !== null &&
    avatar.crop_y_percent !== null &&
    avatar.crop_width_percent !== null &&
    avatar.crop_height_percent !== null
      ? {
          crop_x_percent: avatar.crop_x_percent,
          crop_y_percent: avatar.crop_y_percent,
          crop_width_percent: avatar.crop_width_percent,
          crop_height_percent: avatar.crop_height_percent,
        }
      : null
  const cropStyle = getCropStyle(cropPercents)
  const imgAlt = `${character.name}'s avatar`

  // Clickable-gallery mode: Opens gallery modal
  if (mode === "clickable-gallery") {
    return (
      <button
        type="button"
        class="avatar-button position-relative ratio ratio-1x1 rounded overflow-hidden border-0 p-0"
        tabindex={0}
        hx-get={`/characters/${character.id}/avatars`}
        hx-target="#editModalContent"
        hx-swap="innerHTML"
        data-bs-toggle="modal"
        data-bs-target="#editModal"
      >
        <img
          src={imgUrl}
          alt={imgAlt}
          class={`avatar-image w-100 h-100 ${className}`}
          style={`object-fit: ${cropStyle.objectFit}; object-position: ${cropStyle.objectPosition};`}
        />
        <i
          class="avatar-icon bi bi-images text-white fs-1"
          style="position: absolute; top: 100%; left: 50%; transform: translate(-50%, -35%); pointer-events: none;"
        />
      </button>
    )
  }

  // Clickable-lightbox mode: Opens lightbox at specific index
  if (mode === "clickable-lightbox") {
    return (
      <button
        type="button"
        class="btn p-0 border-0 w-100"
        hx-get={`/characters/${character.id}/avatars/lightbox?index=${avatarIndex ?? 0}`}
        hx-target="#editModalContent"
        hx-swap="innerHTML"
      >
        <div class="ratio ratio-1x1">
          <img
            src={imgUrl}
            alt={imgAlt}
            class={`w-100 h-100 ${className}`}
            style={`object-fit: ${cropStyle.objectFit}; object-position: ${cropStyle.objectPosition};`}
          />
        </div>
      </button>
    )
  }

  // Display-only mode: Just render the image
  return (
    <div class="ratio ratio-1x1">
      <img
        src={imgUrl}
        alt={imgAlt}
        class={`w-100 h-100 ${className}`}
        style={`object-fit: ${cropStyle.objectFit}; object-position: ${cropStyle.objectPosition};`}
      />
    </div>
  )
}
