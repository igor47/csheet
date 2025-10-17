import type { SQL } from "bun"

/**
 * Clear all data from the test database
 * Note: In most cases, you should use transactions (BEGIN/ROLLBACK) instead
 * This is useful for one-time cleanup or when transactions aren't suitable
 */
export async function clearDatabase(db: SQL): Promise<void> {
  // Disable foreign key checks temporarily
  await db`SET session_replication_role = 'replica'`

  // Get all table names
  const tables = await db`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
  `

  // Truncate all tables
  for (const table of tables) {
    await db.unsafe(`TRUNCATE TABLE ${table.tablename} CASCADE`)
  }

  // Re-enable foreign key checks
  await db`SET session_replication_role = 'origin'`
}
