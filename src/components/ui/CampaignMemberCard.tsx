import type { Child } from "hono/jsx"

export type BadgeVariant = "warning" | "danger" | "secondary" | "primary" | "info"

export interface CampaignMemberCardProps {
  title: string
  badge?: {
    text: string
    variant: BadgeVariant
    darkText?: boolean // for warning badges that need dark text
  }
  isCurrentUser?: boolean
  children?: Child
}

export const CampaignMemberCard = ({
  title,
  badge,
  isCurrentUser,
  children,
}: CampaignMemberCardProps) => (
  <div class={`card h-100 ${isCurrentUser ? "border-primary border-2" : ""}`}>
    <div class="card-body">
      <div class="row align-items-center mb-2 g-2">
        <div class="col-3">
          <div class="ratio ratio-1x1">
            <img
              src="/static/placeholder.png"
              alt="No avatar"
              class="rounded"
              style="object-fit: cover;"
            />
          </div>
        </div>
        <div class="col-9">
          <h6 class="card-title mb-1">{title}</h6>
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
