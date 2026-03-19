import { config } from "@src/config"
import type { User } from "@src/db/users"
import { logger } from "@src/lib/logger"
import { Resend } from "resend"

let resendClient: Resend | null = null

export function getClient(): Resend | null {
  if (resendClient) return resendClient
  if (!config.resendApiKey) return null
  resendClient = new Resend(config.resendApiKey)
  return resendClient
}

function splitName(name: string | null): { firstName?: string; lastName?: string } {
  if (!name?.trim()) return {}
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0]
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined
  return { firstName, lastName }
}

/**
 * Create or update a contact in Resend from a User.
 * Fire-and-forget safe — logs errors but never throws.
 * No-ops if RESEND_API_KEY is not configured.
 */
export async function syncContactToResend(user: User): Promise<void> {
  const client = getClient()
  if (!client) return

  const { firstName, lastName } = splitName(user.name)

  try {
    await client.contacts.create({
      email: user.email,
      firstName,
      lastName,
      unsubscribed: !user.marketing_opt_in,
    })
  } catch {
    // Contact may already exist — try updating instead
    try {
      await client.contacts.update({
        email: user.email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        unsubscribed: !user.marketing_opt_in,
      })
    } catch (updateError) {
      logger.error("Failed to sync contact to Resend", updateError as Error, {
        email: user.email,
      })
    }
  }
}
