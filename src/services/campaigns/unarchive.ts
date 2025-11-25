import { type Campaign, nameExistsForUser, unarchive } from "@src/db/campaigns"
import type { SQL } from "bun"

export type UnarchiveCampaignResult =
  | { complete: true }
  | { complete: false; errors: Record<string, string> }

/**
 * Unarchive a campaign
 * Sets archived_at to NULL, making the campaign active again
 * Checks that the campaign name is not already in use by another active campaign
 */
export async function unarchiveCampaign(
  db: SQL,
  campaign: Campaign
): Promise<UnarchiveCampaignResult> {
  try {
    // Check if campaign is already active
    if (campaign.archived_at === null) {
      return { complete: false, errors: { _form: "Campaign is already active" } }
    }

    // Check if name is already in use by another active campaign
    const nameExists = await nameExistsForUser(db, campaign.created_by, campaign.name)
    if (nameExists) {
      return {
        complete: false,
        errors: { _form: `Campaign name "${campaign.name}" is already in use` },
      }
    }

    await unarchive(db, campaign.id)

    return { complete: true }
  } catch (error) {
    if (error instanceof Error) {
      return { complete: false, errors: { _form: error.message } }
    }
    return { complete: false, errors: { _form: "Failed to unarchive campaign" } }
  }
}
