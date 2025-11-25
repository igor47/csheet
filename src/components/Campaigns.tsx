import type { ListCampaign } from "@src/services/campaigns/list"

export interface CampaignsProps {
  campaigns: ListCampaign[]
  showArchived: boolean
  archivedCount: number
}

const CampaignCard = ({ campaign }: { campaign: ListCampaign }) => {
  const isArchived = campaign.archived_at !== null

  return (
    <div class="card h-100">
      {/* Campaign avatar as card header/image */}
      <a href={`/campaigns/${campaign.id}`} class="text-decoration-none ratio ratio-1x1">
        <img
          src="/static/placeholder-party.png"
          alt={campaign.name}
          class="card-img-top"
          style="object-fit: cover;"
        />
      </a>

      {/* Card Body */}
      <div class="card-body">
        <h5 class="card-title mb-2">
          <a href={`/campaigns/${campaign.id}`} class="text-decoration-none text-body">
            {campaign.name}
          </a>
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
      </div>

      {/* Card Footer with Actions */}
      <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
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
