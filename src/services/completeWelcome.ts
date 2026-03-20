import { markWelcomed, type User, update } from "@src/db/users"
import { syncContact } from "@src/services/syncContact"
import type { SQL } from "bun"

export async function completeWelcome(db: SQL, user: User, marketingOptIn: boolean): Promise<void> {
  await update(db, user.id, { name: user.name, marketing_opt_in: marketingOptIn })
  await markWelcomed(db, user.id)

  const updatedUser = { ...user, marketing_opt_in: marketingOptIn }
  await syncContact(db, updatedUser)
}
