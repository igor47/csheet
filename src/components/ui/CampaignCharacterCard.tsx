import { AvatarDisplay } from "@src/components/AvatarDisplay"
import type { BadgeVariant } from "@src/components/ui/CampaignMemberCard"
import type { ListCharacter } from "@src/services/listCharacters"
import type { Child } from "hono/jsx"

export interface CampaignCharacterCardProps {
  character: {
    id: string
    name: string
    avatars: ListCharacter["avatars"]
    level: number
    className: string
  }
  subtitle?: string
  badge?: {
    text: string
    variant: BadgeVariant
    darkText?: boolean
  }
  isCurrentUser?: boolean
  children?: Child
}

export const CampaignCharacterCard = ({
  character,
  subtitle,
  badge,
  isCurrentUser,
  children,
}: CampaignCharacterCardProps) => (
  <div class={`card h-100 ${isCurrentUser ? "border-primary border-2" : ""}`}>
    <div class="card-body">
      <div class="row align-items-center mb-2 g-2">
        <div class="col-3">
          <AvatarDisplay
            character={{ id: character.id, name: character.name, avatars: character.avatars }}
            mode="clickable-lightbox"
            avatarIndex={0}
          />
        </div>
        <div class="col-9">
          <h6 class="card-title mb-0">{character.name}</h6>
          <small class="text-muted d-block">
            Level {character.level} {character.className}
          </small>
          {subtitle && <small class="text-muted d-block">{subtitle}</small>}
          {badge && (
            <span class={`badge bg-${badge.variant}${badge.darkText ? " text-dark" : ""}`}>
              {badge.text}
            </span>
          )}
        </div>
      </div>
      {children && <div class="d-flex justify-content-center gap-2">{children}</div>}
    </div>
  </div>
)
