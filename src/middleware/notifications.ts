import { getDb } from "@src/db"
import { getNotificationCounts, type NotificationCounts } from "@src/db/campaign_members"
import { createMiddleware } from "hono/factory"

export type Notifications = NotificationCounts

export interface NotificationsVariables {
  notifications: Notifications
}

const defaultNotifications: Notifications = {
  pendingInvites: 0,
  pendingViewerInvites: 0,
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
  const notifications = await getNotificationCounts(db, user.id)
  c.set("notifications", notifications)

  await next()
})
