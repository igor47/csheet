import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"

export interface User {
  id: string
  email: string
  name: string | null
  marketing_opt_in: boolean
  welcomed_at: string | null
  created_at: string
  updated_at: string
}

export async function create(db: SQL, email: string): Promise<User> {
  const id = ulid()

  const result = await db`
    INSERT INTO users (id, email)
    VALUES (${id}, ${email})
    RETURNING *
  `

  return result[0] as User
}

export async function findById(db: SQL, id: string): Promise<User | null> {
  const result = await db`
    SELECT * FROM users
    WHERE id = ${id}
    LIMIT 1
  `

  return (result[0] as User) || null
}

export async function findByEmail(db: SQL, email: string): Promise<User | null> {
  const result = await db`
    SELECT * FROM users
    WHERE email = ${email}
    LIMIT 1
  `

  return (result[0] as User) || null
}

export async function findAll(db: SQL): Promise<User[]> {
  const result = await db`SELECT * FROM users ORDER BY created_at ASC`
  return result as User[]
}

export async function markWelcomed(db: SQL, id: string): Promise<void> {
  await db`UPDATE users SET welcomed_at = CURRENT_TIMESTAMP WHERE id = ${id}`
}

export interface UpdateUserData {
  name: string | null
  marketing_opt_in: boolean
}

export async function update(db: SQL, id: string, data: UpdateUserData): Promise<User | null> {
  const result = await db`
    UPDATE users
    SET name = ${data.name},
        marketing_opt_in = ${data.marketing_opt_in},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `

  return (result[0] as User) || null
}
