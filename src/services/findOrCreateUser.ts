import { create, findByEmail, type User } from "@src/db/users"
import type { SQL } from "bun"

export interface FindOrCreateResult {
  user: User
  created: boolean
}

export async function findOrCreateUser(db: SQL, email: string): Promise<FindOrCreateResult> {
  const existing = await findByEmail(db, email)
  if (existing) {
    return { user: existing, created: false }
  }

  const user = await create(db, email)
  return { user, created: true }
}
