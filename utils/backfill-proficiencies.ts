import { parseArgs } from "node:util"
import { backfillAllProficiencies } from "@src/services/backfillProficiencies"
import { SQL } from "bun"

// Give characters created before proficiencies were tracked the weapon, armor, tool, and language
// proficiencies of their species, background, and classes. Skips proficiencies a character
// already has (or had removed), so it's safe to re-run. Run it right after deploying the
// char_proficiencies migration, from the deployed commit: it uses this checkout's ruleset data.

// -- CLI args --

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    prod: { type: "boolean", default: false },
  },
})

const useProd = values.prod!

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
  const db = await createDb()
  console.log(`Backfilling proficiencies (${useProd ? "prod" : "dev"})`)

  const summary = await backfillAllProficiencies(db, (message) => console.log(`  ${message}`))

  console.log(`\nDone. Granted to ${summary.granted} characters; ${summary.failed} failed.`)
  db.close()
  process.exit(summary.failed > 0 ? 1 : 0)
}

main()
