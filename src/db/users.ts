import { ulid } from "ulid";
import { db } from "../db";

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export async function create(email: string): Promise<User> {
  const id = ulid();

  const result = await db`
    INSERT INTO users (id, email)
    VALUES (${id}, ${email})
    RETURNING *
  `;

  return result[0] as User;
}

export async function findById(id: string): Promise<User | null> {
  const result = await db`
    SELECT * FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return result[0] as User || null;
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await db`
    SELECT * FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return result[0] as User || null;
}
