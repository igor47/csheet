import type { ListCampaign } from "@src/services/campaigns/list"

export interface CampaignsProps {
  campaigns: ListCampaign[]
  showArchived: boolean
  archivedCount: number
}

const CampaignCard = ({ campaign }: { campaign: ListCampaign }) => {
  const isArchived = campaign.archived_at !== null
  const isPending = campaign.invite_status === "pending"
  const needsCharacter = campaign.invite_status === "needs_character"
  const needsAction = isPending || needsCharacter

  // Card border style for campaigns needing action
  const cardClass = needsAction ? "card h-100 border-warning border-2" : "card h-100"

  return (
    <div class={cardClass}>
      {/* Campaign avatar as card header/image */}
      {isPending ? (
        <div class="ratio ratio-1x1">
          <img
            src="/static/placeholder-party.png"
            alt={campaign.name}
            class="card-img-top"
            style="object-fit: cover;"
          />
        </div>
      ) : (
        <a href={`/campaigns/${campaign.id}`} class="text-decoration-none ratio ratio-1x1">
          <img
            src="/static/placeholder-party.png"
            alt={campaign.name}
            class="card-img-top"
            style="object-fit: cover;"
          />
        </a>
      )}

      {/* Card Body */}
      <div class="card-body">
        <h5 class="card-title mb-2">
          {isPending ? (
            <span class="text-body">{campaign.name}</span>
          ) : (
            <a href={`/campaigns/${campaign.id}`} class="text-decoration-none text-body">
              {campaign.name}
            </a>
          )}
          {isArchived && <span class="badge bg-secondary ms-2">Archived</span>}
        </h5>
        {campaign.description && (
          <p class="card-text text-muted mb-2">
            <small>{campaign.description}</small>
          </p>
        )}
        <p class="card-text text-muted mb-1">
          <small>
            <i class="bi bi-people"></i> {campaign.member_count}{" "}
            {campaign.member_count === 1 ? "member" : "members"}
          </small>
        </p>
        <p class="card-text text-muted mb-0">
          <small>
            <i class="bi bi-person-badge"></i> {campaign.character_count}{" "}
            {campaign.character_count === 1 ? "character" : "characters"}
          </small>
        </p>

        {/* Action needed badges */}
        {isPending && (
          <div class="mt-2">
            <span class="badge bg-warning text-dark">
              <i class="bi bi-envelope-exclamation"></i> Pending Invite
            </span>
            {campaign.invited_by_email && (
              <p class="text-muted mb-0 mt-1">
                <small>from {campaign.invited_by_email}</small>
              </p>
            )}
          </div>
        )}
        {needsCharacter && (
          <div class="mt-2">
            <span class="badge bg-warning text-dark">
              <i class="bi bi-person-plus"></i> Add Character
            </span>
          </div>
        )}
      </div>

      {/* Card Footer with Actions */}
      <div class="card-footer bg-transparent">
        {isPending ? (
          <div class="d-flex gap-2">
            <button
              type="button"
              class="btn btn-success btn-sm flex-grow-1"
              hx-post={`/campaigns/${campaign.id}/accept`}
              data-testid={`accept-${campaign.id}`}
            >
              <i class="bi bi-check-circle"></i> Accept
            </button>
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              hx-post={`/campaigns/${campaign.id}/decline`}
              hx-confirm="Are you sure you want to decline this invitation?"
              data-testid={`decline-${campaign.id}`}
            >
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
        ) : (
          <div class="d-flex justify-content-between align-items-center">
            <a href={`/campaigns/${campaign.id}`} class="btn btn-primary btn-sm">
              <i class="bi bi-eye"></i> View
            </a>
            {isArchived ? (
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                hx-post={`/campaigns/${campaign.id}/unarchive`}
                hx-confirm="Are you sure you want to restore this campaign?"
                data-testid={`unarchive-${campaign.id}`}
                title="Restore campaign"
              >
                <i class="bi bi-arrow-counterclockwise"></i>
              </button>
            ) : (
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                hx-post={`/campaigns/${campaign.id}/archive`}
                hx-confirm={`Are you sure you want to archive "${campaign.name}"?`}
                data-testid={`archive-${campaign.id}`}
                title="Archive campaign"
              >
                <i class="bi bi-archive"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const EmptyState = () => (
  <div class="text-center py-5">
    <p class="text-muted">You haven't created or joined any campaigns yet.</p>
    <div class="d-flex gap-2 justify-content-center mt-3" id="empty-state-actions">
      <a href="/campaigns/new" class="btn btn-primary" id="create-campaign-btn">
        <i class="bi bi-plus-circle"></i> Create New Campaign
      </a>
    </div>
  </div>
)

const CampaignGrid = ({ campaigns }: { campaigns: ListCampaign[] }) => (
  <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
    {campaigns.map((campaign) => (
      <div class="col" key={campaign.id}>
        <CampaignCard campaign={campaign} />
      </div>
    ))}
  </div>
)

export const Campaigns = ({ campaigns, showArchived, archivedCount }: CampaignsProps) => {
  return (
    <div class="container-fluid container-md mt-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1>My Campaigns</h1>
        <div class="d-flex gap-2">
          <a href="/campaigns/new" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Create New
          </a>
        </div>
      </div>

      {archivedCount > 0 && (
        <div class="form-check mb-3">
          <input
            class="form-check-input"
            type="checkbox"
            id="showArchivedCheckbox"
            checked={showArchived}
            hx-get={showArchived ? "/campaigns" : "/campaigns?show_archived=true"}
            hx-target="body"
            hx-push-url="true"
          />
          <label class="form-check-label" for="showArchivedCheckbox">
            Show archived campaigns ({archivedCount})
          </label>
        </div>
      )}

      {campaigns.length === 0 ? <EmptyState /> : <CampaignGrid campaigns={campaigns} />}
    </div>
  )
}
