import { getDb } from "@src/db"
import * as campaignMembers from "@src/db/campaign_members"
import { createMiddleware } from "hono/factory"

export interface Notifications {
  pendingInvites: number
  needsCharacter: number
}

export interface NotificationsVariables {
  notifications: Notifications
}

const defaultNotifications: Notifications = {
  pendingInvites: 0,
  needsCharacter: 0,
}

export const notificationsMiddleware = createMiddleware<{
  Variables: NotificationsVariables
}>(async (c, next) => {
  const user = c.get("user")

  if (!user) {
    c.set("notifications", defaultNotifications)
    await next()
    return
  }

  const db = getDb(c)

  // Query counts in parallel for efficiency
  const [pendingInvites, needsCharacter] = await Promise.all([
    campaignMembers.countPendingInvites(db, user.id),
    campaignMembers.countNeedsCharacter(db, user.id),
  ])

  c.set("notifications", {
    pendingInvites,
    needsCharacter,
  })

  await next()
})
