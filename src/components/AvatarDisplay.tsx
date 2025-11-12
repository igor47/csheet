import type { CropPercents } from "@src/db/character_avatars"
import type { ComputedCharacter } from "@src/services/computeCharacter"

export interface AvatarDisplayProps {
  // Clickable mode: pass character to render as button with gallery link
  character?: ComputedCharacter

  // Display-only mode: pass these directly
  uploadUrl?: string
  cropPercents?: CropPercents | null
  alt?: string
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
 * Supports two modes:
 * - Clickable: Pass character prop to render as button with gallery modal trigger
 * - Display-only: Pass uploadUrl/cropPercents to render just the image
 */
export const AvatarDisplay = ({
  character,
  uploadUrl,
  cropPercents,
  alt = "Avatar",
  className = "",
}: AvatarDisplayProps) => {
  // Clickable mode: render as button with modal trigger and hover effects
  if (character) {
    const imgUrl = character.avatar_id ? `/uploads/${character.avatar_id}` : "/static/placeholder.png"
    const cropStyle = getCropStyle(character.avatar_crop)
    const imgAlt = `${character.name}'s avatar`

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

  // Display-only mode: render just the image
  const cropStyle = getCropStyle(cropPercents)
  const imgUrl = uploadUrl || "/static/placeholder.png"

  return (
    <div class="ratio ratio-1x1">
      <img
        src={imgUrl}
        alt={alt}
        class={`w-100 h-100 ${className}`}
        style={`object-fit: ${cropStyle.objectFit}; object-position: ${cropStyle.objectPosition};`}
      />
    </div>
  )
}
