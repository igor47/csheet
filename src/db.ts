import { SQL } from "bun"
import { join } from "path"
import { config } from "./config"

export const db = new SQL(`sqlite:${config.sqliteDbPath}`)

// Execute initialization PRAGMAs
await db.file(join(config.repoRoot, "db/init.sql"))
