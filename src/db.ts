import { SQL, type TransactionSQL } from "bun"
import type { Context } from "hono"
import { config } from "./config"

// not exported; we should only use getDb to access the database
// Note: Bun.sql ignores the database name when parsing a connection URL (Bun bug),
// so we use the options object form to ensure the correct database is used.
const db = new SQL({
  hostname: config.postgresHost,
  port: Number(config.postgresPort),
  username: config.postgresUser,
  password: config.postgresPassword,
  database: config.postgresDb,
})

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

export function beginOrSavepoint<T>(
  db: TransactionSQL,
  fn: (sql: SQL.SavepointContextCallback<T>) => T | Promise<T>
): Promise<T>

export function beginOrSavepoint<T>(
  db: SQL,
  fn: (sql: TransactionSQL) => T | Promise<T>
): Promise<T>

export function beginOrSavepoint<T>(
  db: SQL | TransactionSQL,
  fn:
    | ((sql: TransactionSQL) => T | Promise<T>)
    | ((sql: SQL.SavepointContextCallback<T>) => T | Promise<T>)
): Promise<T> {
  if ("savepoint" in db) {
    // biome-ignore lint/suspicious/noExplicitAny: working around bun type issue
    return (db as TransactionSQL).savepoint((sql) => fn(sql as any))
  } else {
    // biome-ignore lint/suspicious/noExplicitAny: working around bun type issue
    return db.begin((sql) => fn(sql as any))
  }
}
