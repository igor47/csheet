import { config } from "@src/config"
import { findAll } from "@src/db/users"
import { findSegmentIdByName } from "@src/lib/resend"
import { syncContact } from "@src/services/syncContact"
import { SQL } from "bun"
import { parseArgs } from "node:util"

// -- CLI args --

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    prod: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
})

const useProd = values.prod!
const dryRun = values["dry-run"]!

// -- DB connection --

async function createDb(): Promise<SQL> {
  if (useProd) {
    let password: string
    try {
      password = (
        await Bun.$`gcloud secrets versions access latest --secret=prod-postgres-password --project=csheet-475917`.text()
      ).trim()
    } catch {
      console.error(
        "Failed to fetch prod password. Is gcloud installed and authenticated?\n" +
          "Run: gcloud auth login"
      )
      process.exit(1)
    }

    const url = `postgres://app:${password}@localhost:5433/csheet`
    try {
      const db = new SQL(url)
      await db`SELECT 1`
      return db
    } catch {
      console.error(
        "Failed to connect to prod database.\n" +
          "Is the Cloud SQL proxy running? Start it with:\n" +
          "  mise run db:prod:proxy"
      )
      process.exit(1)
    }
  }

  const host = process.env.POSTGRES_HOST || "localhost"
  const port = process.env.POSTGRES_PORT || "5432"
  const user = process.env.POSTGRES_USER || "csheet_user"
  const pass = process.env.POSTGRES_PASSWORD || "csheet_pass"
  const dbName = process.env.POSTGRES_DB || "csheet_dev"
  return new SQL(`postgres://${user}:${pass}@${host}:${port}/${dbName}`)
}

// -- Main --

async function main() {
  // Look up the segment by name so we don't need to know the UUID
  const segmentName = useProd ? "production" : "development"
  const segmentId = await findSegmentIdByName(segmentName)
  if (!segmentId) {
    console.error(`Resend segment "${segmentName}" not found. Create it in the Resend dashboard.`)
    process.exit(1)
  }
  ;(config as { resendSegmentId: string }).resendSegmentId = segmentId

  const db = await createDb()
  const users = await findAll(db)

  const dbLabel = useProd ? "prod" : "dev"
  console.log(
    `Backfilling ${users.length} users to Resend (${dbLabel})${dryRun ? " [DRY RUN]" : ""}`
  )

  let synced = 0
  for (const [i, user] of users.entries()) {
    // Respect Resend's 5 req/sec rate limit (up to 2 calls per sync: create + update)
    if (!dryRun && i > 0) {
      await Bun.sleep(500)
    }

    const contactData = await syncContact(db, user, { is_check: dryRun })
    if (dryRun) {
      const props = contactData.properties || {}
      console.log(
        `  ${contactData.email} → ${contactData.firstName || "?"}` +
          ` ${contactData.lastName || ""}`.trimEnd() +
          ` | unsub: ${contactData.unsubscribed}` +
          ` | chars: ${props.character_count ?? 0}, camps: ${props.campaign_count ?? 0}` +
          ` | segment: ${segmentName}`
      )
    }
    synced++
  }

  console.log(`\nDone. ${dryRun ? "Would sync" : "Synced"}: ${synced}`)
  db.close()
  process.exit(0)
}

main()
