import type { Campaign as CampaignType } from "@src/db/campaigns"

export interface CampaignProps {
  campaign: CampaignType
}

export const Campaign = ({ campaign }: CampaignProps) => {
  return (
    <div class="container-fluid mt-3">
      <div class="row">
        <div class="col-12">
          <h1>{campaign.name}</h1>
          {campaign.description && <p class="text-muted">{campaign.description}</p>}
        </div>
      </div>
    </div>
  )
}
