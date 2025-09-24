import { SQL } from "bun";
import { config } from "./config";

export const db = new SQL(`sqlite:${config.sqliteDbPath}`)
