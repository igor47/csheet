import { SQL } from "bun"
import type { Context } from "hono"
import { config } from "./config"

// Construct PostgreSQL connection URL
const connectionUrl = `postgres://${config.postgresUser}:${config.postgresPassword}@${config.postgresHost}:${config.postgresPort}/${config.postgresDb}`

// not exported; we should only use getDb to access the database
const db = new SQL(connectionUrl)

/**
 * Get the database instance from the context or use the global instance
 * This allows tests to inject a test database via context
 */
export function getDb(c: Context): SQL {
  const contextDb = c.get("db")
  return contextDb || db
}

/**
 * Get the raw database instance for test use only
 * This allows tests to manage transactions directly
 */
export function getDbForTests(): SQL {
  return db
}
