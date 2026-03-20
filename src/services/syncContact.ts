import type { User } from "@src/db/users"
import { logger } from "@src/lib/logger"
import { type ResendContactData, splitName, upsertContact } from "@src/lib/resend"
import type { SQL } from "bun"

async function getContactProperties(db: SQL, userId: string) {
  const properties: Record<string, string | number> = {}

  const [charRow] = await db`
    SELECT COUNT(*)::int as count FROM characters
    WHERE user_id = ${userId} AND archived_at IS NULL
  `
  properties.character_count = charRow.count

  const [campRow] = await db`
    SELECT COUNT(*)::int as count FROM campaign_members
    WHERE user_id = ${userId} AND accepted_at IS NOT NULL AND deleted_at IS NULL
  `
  properties.campaign_count = campRow.count

  return properties
}

interface SyncContactOptions {
  is_check?: boolean
}

/**
 * Sync a user's contact data to Resend, including character and campaign counts.
 * Fire-and-forget safe — never throws.
 *
 * When is_check is true, builds and returns the contact data without calling the API.
 */
export async function syncContact(
  db: SQL,
  user: User,
  options?: SyncContactOptions
): Promise<ResendContactData> {
  const { firstName, lastName } = splitName(user.name, user.email)

  const contactData: ResendContactData = {
    email: user.email,
    firstName,
    lastName,
    unsubscribed: !user.marketing_opt_in,
  }

  try {
    contactData.properties = await getContactProperties(db, user.id)

    if (!options?.is_check) {
      await upsertContact(contactData)
    }
  } catch (error) {
    logger.error("Failed to sync contact to Resend", error as Error, { email: user.email })
  }

  return contactData
}
