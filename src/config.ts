import { dirname } from "node:path"

const repoRoot = dirname(import.meta.dir)

export const config = {
  repoRoot,
  postgresHost: process.env.POSTGRES_HOST || "localhost",
  postgresPort: process.env.POSTGRES_PORT || "5432",
  postgresUser: process.env.POSTGRES_USER || "csheet_user",
  postgresPassword: process.env.POSTGRES_PASSWORD || "csheet_pass",
  postgresDb: process.env.POSTGRES_DB || "csheet_dev",
  postgresDbTest: process.env.POSTGRES_DB_TEST || "csheet_test",
  cookieSecret: process.env.COOKIE_SECRET || "your-secret-key-should-be-in-env",
} as const

// Print config as JSON when run directly
if (import.meta.main) {
  console.log(JSON.stringify(config, null, 2))
}
