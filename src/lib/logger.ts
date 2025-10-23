import { config } from "@src/config"

// Dev: human-readable, Prod: JSON for Cloud Logging
export const logger = {
  info: (message: string, data?: object) => {
    if (config.isProd) {
      console.log(JSON.stringify({ severity: "INFO", message, ...data }))
    } else {
      console.log(`[INFO] ${message}`, data || "")
    }
  },

  error: (message: string, error?: Error, data?: object) => {
    if (config.isProd) {
      console.error(
        JSON.stringify({
          severity: "ERROR",
          message,
          stack: error?.stack,
          ...data,
        })
      )
    } else {
      console.error(`[ERROR] ${message}`, error || "", data || "")
    }
  },

  warn: (message: string, data?: object) => {
    if (config.isProd) {
      console.warn(JSON.stringify({ severity: "WARNING", message, ...data }))
    } else {
      console.warn(`[WARN] ${message}`, data || "")
    }
  },
}
