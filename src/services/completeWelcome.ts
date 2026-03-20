import { markWelcomed, type User, update } from "@src/db/users"
import { syncContact } from "@src/services/syncContact"
import type { SQL } from "bun"

export interface CompleteWelcomeData {
  name?: string | null
  marketingOptIn: boolean
}

export async function completeWelcome(
  db: SQL,
  user: User,
  data: CompleteWelcomeData
): Promise<void> {
  const name = data.name?.trim() || user.name
  const updatedUser = await update(db, user.id, { name, marketing_opt_in: data.marketingOptIn })
  await markWelcomed(db, user.id)

  if (updatedUser) {
    await syncContact(db, updatedUser)
  }
}
