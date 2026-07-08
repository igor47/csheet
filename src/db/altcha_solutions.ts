import type { SQL } from "bun"

/**
 * Record a solved ALTCHA challenge salt so it can't be replayed.
 * Returns true if this salt is newly recorded, false if it was already used.
 */
export async function recordSolution(db: SQL, salt: string, expiresAt: Date): Promise<boolean> {
  const result = await db`
    INSERT INTO altcha_solutions (salt, expires_at)
    VALUES (${salt}, ${expiresAt.toISOString()})
    ON CONFLICT (salt) DO NOTHING
    RETURNING salt
  `
  return result.length > 0
}

/**
 * Delete expired solution records. Safe to run periodically; expired rows are
 * useless because the underlying challenge no longer verifies.
 */
export async function cleanup(db: SQL): Promise<number> {
  const now = new Date()
  const result = await db`
    DELETE FROM altcha_solutions
    WHERE expires_at < ${now.toISOString()}
  `
  return result.length
}
