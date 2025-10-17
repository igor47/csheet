import { SQL } from "bun"
import { config } from "./config"

// Construct PostgreSQL connection URL
const connectionUrl = `postgres://${config.postgresUser}:${config.postgresPassword}@${config.postgresHost}:${config.postgresPort}/${config.postgresDb}`

export const db = new SQL(connectionUrl)
