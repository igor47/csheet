import { dirname, join } from "path"

const repoRoot = dirname(import.meta.dir)

export const config = {
  repoRoot,
  sqliteDbPath: process.env.SQLITE_DB_PATH || join(repoRoot, "database.db"),
  cookieSecret: process.env.COOKIE_SECRET || "your-secret-key-should-be-in-env",
} as const

// Print config as JSON when run directly
if (import.meta.main) {
  console.log(JSON.stringify(config, null, 2))
}
