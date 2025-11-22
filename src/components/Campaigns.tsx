import type { ListCampaign } from "@src/services/campaigns/list"

export interface CampaignsProps {
  campaigns: ListCampaign[]
}

const CampaignCard = ({ campaign }: { campaign: ListCampaign }) => {
  return (
    <div class="card h-100">
      {/* Campaign avatar as card header/image */}
      <a href={`/campaigns/${campaign.id}`} class="text-decoration-none">
        <img
          src="/static/placeholder-party.png"
          alt={campaign.name}
          class="card-img-top"
          style="height: 200px; object-fit: cover;"
        />
      </a>

      {/* Card Body */}
      <div class="card-body">
        <h5 class="card-title mb-2">
          <a href={`/campaigns/${campaign.id}`} class="text-decoration-none text-body">
            {campaign.name}
          </a>
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

export const Campaigns = ({ campaigns }: CampaignsProps) => {
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

      {campaigns.length === 0 ? <EmptyState /> : <CampaignGrid campaigns={campaigns} />}
    </div>
  )
}
