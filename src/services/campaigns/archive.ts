import { archive, type Campaign } from "@src/db/campaigns"
import type { SQL } from "bun"

export type ArchiveCampaignResult =
  | { complete: true }
  | { complete: false; errors: Record<string, string> }

/**
 * Archive a campaign
 * Sets archived_at to current timestamp
 */
export async function archiveCampaign(db: SQL, campaign: Campaign): Promise<ArchiveCampaignResult> {
  try {
    // Check if campaign is already archived
    if (campaign.archived_at !== null) {
      return { complete: false, errors: { _form: "Campaign is already archived" } }
    }

    await archive(db, campaign.id)

    return { complete: true }
  } catch (error) {
    if (error instanceof Error) {
      return { complete: false, errors: { _form: error.message } }
    }
    return { complete: false, errors: { _form: "Failed to archive campaign" } }
  }
}
