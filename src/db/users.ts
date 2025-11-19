import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"

export interface User {
  id: string
  email: string
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
