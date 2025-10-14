import { join } from "node:path"
import { SQL } from "bun"
import { config } from "./config"

export const db = new SQL(`sqlite:${config.sqliteDbPath}`)

// Execute initialization PRAGMAs
await db.file(join(config.repoRoot, "db/init.sql"))
