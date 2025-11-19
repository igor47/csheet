import type { CropPercents } from "@src/db/character_avatars"
import type { CharacterAvatarWithUrl } from "@src/services/computeCharacter"

// Minimal avatar type - only the fields actually used by this component
type MinimalAvatar = Omit<
  CharacterAvatarWithUrl,
  "id" | "character_id" | "upload_id" | "created_at" | "updated_at"
>

// Minimal character type needed for avatar display
interface CharacterWithAvatars {
  id: string
  name: string
  avatars: MinimalAvatar[]
}

export interface AvatarDisplayProps {
  character: CharacterWithAvatars
  avatarIndex?: number
  mode: "clickable-gallery" | "clickable-lightbox" | "display-only"
  className?: string
}

/**
 * Generate CSS custom properties for crop transform
 * Uses translate + scale to display only the cropped region
 */
function getCropStyle(cropPercents?: CropPercents | null) {
  if (!cropPercents) {
    // No crop - just center the image
    return {
      containerStyle: "",
      imageStyle: "width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%;",
    }
  }

  // CSS custom properties for the transform
  const containerStyle = `
    --crop-x: ${cropPercents.crop_x_percent};
    --crop-y: ${cropPercents.crop_y_percent};
    --crop-w: ${cropPercents.crop_width_percent};
    --crop-h: ${cropPercents.crop_height_percent};
  `.trim()

  // Transform to show only the cropped region
  // Scale up the image so crop region fills container, then translate to position it
  // translate percentages are relative to the image's own dimensions
  const imageStyle = `
    width: 100%;
    height: auto;
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: top left;
    transform:
      translate(
        calc(-1 * var(--crop-x) / var(--crop-w) * 100%),
        calc(-1 * var(--crop-y) / var(--crop-w) * 100%)
      )
      scale(calc(1 / var(--crop-w)));
  `.trim()

  return { containerStyle, imageStyle }
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
  let avatar: MinimalAvatar | undefined
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
        style={cropStyle.containerStyle}
      >
        <img
          src={imgUrl}
          alt={imgAlt}
          class={`avatar-image ${className}`}
          style={cropStyle.imageStyle}
        />
        <i
          class="avatar-icon bi bi-images text-white fs-1"
          style="position: absolute; top: 100%; left: 50%; transform: translate(-50%, -35%); pointer-events: none; z-index: 1;"
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
        <div
          class="ratio ratio-1x1 position-relative overflow-hidden"
          style={cropStyle.containerStyle}
        >
          <img src={imgUrl} alt={imgAlt} class={className} style={cropStyle.imageStyle} />
        </div>
      </button>
    )
  }

  // Display-only mode: Just render the image
  return (
    <div class="ratio ratio-1x1 position-relative overflow-hidden" style={cropStyle.containerStyle}>
      <img src={imgUrl} alt={imgAlt} class={className} style={cropStyle.imageStyle} />
    </div>
  )
}
