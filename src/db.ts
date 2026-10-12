import { type ReservedSQL, SQL, type TransactionSQL } from "bun"
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
  } else if ("release" in db) {
    // a reserved connection: in this app, only the tests', which already run inside a
    // transaction that's rolled back afterwards. begin() would COMMIT that transaction and leak
    // the test's rows into the test database, so use a savepoint instead
    return reservedSavepoint(db as ReservedSQL, fn as (sql: TransactionSQL) => T | Promise<T>)
  } else {
    // biome-ignore lint/suspicious/noExplicitAny: working around bun type issue
    return db.begin((sql) => fn(sql as any))
  }
}

let savepointCounter = 0

async function reservedSavepoint<T>(
  db: ReservedSQL,
  fn: (sql: TransactionSQL) => T | Promise<T>
): Promise<T> {
  const name = `sp_reserved_${++savepointCounter}`
  await db.unsafe(`SAVEPOINT ${name}`)
  try {
    // biome-ignore lint/suspicious/noExplicitAny: the reserved connection stands in for a transaction
    const result = await fn(db as any)
    await db.unsafe(`RELEASE SAVEPOINT ${name}`)
    return result
  } catch (error) {
    await db.unsafe(`ROLLBACK TO SAVEPOINT ${name}`)
    throw error
  }
}
