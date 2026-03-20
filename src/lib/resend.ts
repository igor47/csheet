import { config } from "@src/config"
import { logger } from "@src/lib/logger"
import { Resend } from "resend"

const RESEND_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: Timer
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Resend API timeout")), RESEND_TIMEOUT_MS)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

let resendClient: Resend | null = null

function getClient(): Resend | null {
  if (config.isTest) return null
  if (resendClient) return resendClient
  if (!config.resendApiKey) return null
  resendClient = new Resend(config.resendApiKey)
  return resendClient
}

/**
 * Look up a Resend segment ID by name.
 * Returns null if not found or Resend is not configured.
 */
export async function findSegmentIdByName(name: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null

  const result = await client.segments.list()
  if (result.error || !result.data) return null

  const segment = result.data.data.find((s) => s.name === name)
  return segment?.id ?? null
}

export function splitName(
  name: string | null,
  email?: string
): { firstName?: string; lastName?: string } {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    const firstName = parts[0]
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined
    return { firstName, lastName }
  }

  // Fall back to the local part of the email
  if (email) {
    return { firstName: email.split("@")[0] }
  }

  return {}
}

export interface ResendContactData {
  email: string
  firstName?: string
  lastName?: string
  unsubscribed: boolean
  properties?: Record<string, string | number>
}

/**
 * Create or update a contact in Resend.
 * Fire-and-forget safe — logs errors but never throws.
 * No-ops if RESEND_API_KEY is not configured or in test env.
 *
 * Tries create first; if the contact already exists, falls back to update.
 * The Resend SDK returns { data, error } instead of throwing, so we check
 * the error field explicitly.
 */
export async function upsertContact(data: ResendContactData): Promise<void> {
  const client = getClient()
  if (!client) return

  const segmentId = config.resendSegmentId
  const contactPayload = {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    unsubscribed: data.unsubscribed,
    properties: data.properties,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  }

  try {
    const createResult = await withTimeout(client.contacts.create(contactPayload))

    if (!createResult.error) return

    // Only fall through to update if the contact already exists
    const errorMsg = createResult.error.message || ""
    if (!errorMsg.toLowerCase().includes("already")) {
      logger.error("Failed to create Resend contact", new Error(errorMsg), {
        email: data.email,
      })
      return
    }

    // Contact already exists — update instead
    const updateResult = await withTimeout(
      client.contacts.update({
        email: data.email,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        unsubscribed: data.unsubscribed,
        properties: data.properties,
      })
    )

    if (updateResult.error) {
      logger.error("Failed to update Resend contact", new Error(updateResult.error.message), {
        email: data.email,
      })
      return
    }

    // Add to segment if not already a member (create would have handled it for new contacts)
    if (segmentId) {
      const segResult = await withTimeout(
        client.contacts.segments.add({ email: data.email, segmentId })
      )
      if (segResult.error) {
        logger.error(
          "Failed to add contact to Resend segment",
          new Error(segResult.error.message),
          {
            email: data.email,
            segmentId,
          }
        )
      }
    }
  } catch (error) {
    // Network error or timeout
    logger.error("Failed to sync contact to Resend", error as Error, {
      email: data.email,
    })
  }
}
