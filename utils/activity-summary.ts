import { SQL } from "bun"
import { parseArgs } from "node:util"

// -- CLI args --

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    period: { type: "string", default: "7" },
    prod: { type: "boolean", default: false },
  },
})

const periodDays = parseInt(values.period!, 10)
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
      // test the connection
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

// -- Queries --

async function queryTotals(db: SQL) {
  const [users] = await db`SELECT COUNT(*)::int as count FROM users`
  const [active] = await db`
    SELECT COUNT(*)::int as count FROM characters WHERE archived_at IS NULL
  `
  const [archived] = await db`
    SELECT COUNT(*)::int as count FROM characters WHERE archived_at IS NOT NULL
  `
  return {
    totalUsers: users.count,
    activeCharacters: active.count,
    archivedCharacters: archived.count,
  }
}

async function queryUsers(db: SQL, since: Date) {
  const [newSignups] = await db`
    SELECT COUNT(*)::int as count FROM users WHERE created_at >= ${since}
  `
  const [logins] = await db`
    SELECT
      COUNT(*)::int as attempts,
      COUNT(DISTINCT email)::int as unique_users
    FROM auth_tokens WHERE used_at >= ${since}
  `
  return {
    newSignups: newSignups.count,
    loginAttempts: logins.attempts,
    uniqueLogins: logins.unique_users,
  }
}

async function queryCharacters(db: SQL, since: Date) {
  const [created] = await db`
    SELECT COUNT(*)::int as count FROM characters WHERE created_at >= ${since}
  `
  const [withActions] = await db`
    SELECT COUNT(DISTINCT character_id)::int as count FROM (
      SELECT character_id FROM char_hp WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_coins WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_items WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_rests WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_levels WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_spell_slots WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_hit_dice WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_wild_shape_uses WHERE created_at >= ${since}
      UNION SELECT character_id FROM char_spells_prepared WHERE created_at >= ${since}
      UNION SELECT character_id FROM chat_messages WHERE created_at >= ${since}
    ) active
  `
  return {
    newCharacters: created.count,
    charactersWithActions: withActions.count,
  }
}

async function queryReed(db: SQL, since: Date) {
  const [conversations] = await db`
    SELECT COUNT(DISTINCT chat_id)::int as count
    FROM chat_messages WHERE created_at >= ${since}
  `
  const messagesByRole = await db`
    SELECT role, COUNT(*)::int as count
    FROM chat_messages WHERE created_at >= ${since}
    GROUP BY role
  `
  const [tokens] = await db`
    SELECT
      COALESCE(SUM((usage->>'inputTokens')::int), 0)::int as input_tokens,
      COALESCE(SUM((usage->>'outputTokens')::int), 0)::int as output_tokens,
      COALESCE(SUM((usage->>'cachedInputTokens')::int), 0)::int as cached_input_tokens,
      COALESCE(SUM((usage->>'totalTokens')::int), 0)::int as total_tokens
    FROM chat_messages
    WHERE created_at >= ${since} AND usage IS NOT NULL
  `
  const roleMap: Record<string, number> = {}
  for (const row of messagesByRole) {
    roleMap[row.role] = row.count
  }
  return {
    conversations: conversations.count,
    userMessages: roleMap.user || 0,
    assistantMessages: roleMap.assistant || 0,
    systemMessages: roleMap.system || 0,
    inputTokens: tokens.input_tokens,
    outputTokens: tokens.output_tokens,
    cachedInputTokens: tokens.cached_input_tokens,
    totalTokens: tokens.total_tokens,
  }
}

async function queryActions(db: SQL, since: Date) {
  const [hp] = await db`
    SELECT
      COUNT(*) FILTER (WHERE delta > 0)::int as healing_count,
      COALESCE(SUM(delta) FILTER (WHERE delta > 0), 0)::int as total_healing,
      COUNT(*) FILTER (WHERE delta < 0)::int as damage_count,
      COALESCE(SUM(delta) FILTER (WHERE delta < 0), 0)::int as total_damage
    FROM char_hp WHERE created_at >= ${since}
  `
  const [coins] = await db`
    SELECT COUNT(*)::int as count FROM char_coins WHERE created_at >= ${since}
  `
  const [items] = await db`
    SELECT COUNT(*)::int as count FROM char_items WHERE created_at >= ${since}
  `
  const rests = await db`
    SELECT rest_type, COUNT(*)::int as count
    FROM char_rests WHERE created_at >= ${since}
    GROUP BY rest_type
  `
  const [hitDice] = await db`
    SELECT
      COUNT(*) FILTER (WHERE action = 'use')::int as used,
      COUNT(*) FILTER (WHERE action = 'restore')::int as restored
    FROM char_hit_dice WHERE created_at >= ${since}
  `
  const [wildShape] = await db`
    SELECT COUNT(*)::int as count
    FROM char_wild_shape_uses WHERE created_at >= ${since}
  `
  const [spellSlots] = await db`
    SELECT
      COUNT(*) FILTER (WHERE action = 'use')::int as used,
      COUNT(*) FILTER (WHERE action = 'restore')::int as restored
    FROM char_spell_slots WHERE created_at >= ${since}
  `
  const [spellsPrepped] = await db`
    SELECT
      COUNT(*) FILTER (WHERE action = 'prepare')::int as prepared,
      COUNT(*) FILTER (WHERE action = 'unprepare')::int as unprepared
    FROM char_spells_prepared WHERE created_at >= ${since}
  `
  const [levels] = await db`
    SELECT COUNT(*)::int as count FROM char_levels WHERE created_at >= ${since}
  `
  const [campaigns] = await db`
    SELECT COUNT(*)::int as count FROM campaigns WHERE created_at >= ${since}
  `

  const restMap: Record<string, number> = {}
  for (const row of rests) {
    restMap[row.rest_type] = row.count
  }

  return {
    healingCount: hp.healing_count,
    totalHealing: hp.total_healing,
    damageCount: hp.damage_count,
    totalDamage: hp.total_damage,
    coinTransactions: coins.count,
    itemsAcquired: items.count,
    shortRests: restMap.short || 0,
    longRests: restMap.long || 0,
    hitDiceUsed: hitDice.used,
    hitDiceRestored: hitDice.restored,
    wildShapeUses: wildShape.count,
    spellSlotsUsed: spellSlots.used,
    spellSlotsRestored: spellSlots.restored,
    spellsPrepared: spellsPrepped.prepared,
    spellsUnprepared: spellsPrepped.unprepared,
    levelUps: levels.count,
    campaignsCreated: campaigns.count,
  }
}

// -- Formatting --

function fmt(n: number): string {
  return n.toLocaleString()
}

function printLine(label: string, value: number | string, indent = 2) {
  const prefix = " ".repeat(indent)
  const padded = label.padEnd(28 - indent, " ")
  console.log(`${prefix}${padded}${value}`)
}

// -- Main --

async function main() {
  const db = await createDb()
  const now = new Date()
  const since = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  const dbLabel = useProd ? "prod (localhost:5433/csheet)" : "dev (localhost/csheet_dev)"
  console.log("=== CSheet Activity Summary ===")
  console.log(
    `Period: Last ${periodDays} days (${since.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`
  )
  console.log(`Database: ${dbLabel}`)

  const [totals, users, characters, reed, actions] = await Promise.all([
    queryTotals(db),
    queryUsers(db, since),
    queryCharacters(db, since),
    queryReed(db, since),
    queryActions(db, since),
  ])

  console.log(
    `\n  ${fmt(totals.totalUsers)} users | ` +
      `${fmt(totals.activeCharacters)} characters (${fmt(totals.archivedCharacters)} archived) | ` +
      `${fmt(characters.charactersWithActions)} active in period`
  )

  console.log("\n--- Users ---")
  printLine("New signups:", fmt(users.newSignups))
  printLine("Unique logins:", fmt(users.uniqueLogins))
  printLine("Login attempts:", fmt(users.loginAttempts))

  console.log("\n--- Characters ---")
  printLine("New characters:", fmt(characters.newCharacters))
  printLine("Active in period:", fmt(characters.charactersWithActions))

  console.log("\n--- Reed (LLM) ---")
  printLine("Active conversations:", fmt(reed.conversations))
  printLine("User messages:", fmt(reed.userMessages))
  printLine("Assistant messages:", fmt(reed.assistantMessages))
  if (reed.systemMessages > 0) {
    printLine("System messages:", fmt(reed.systemMessages))
  }
  console.log("  Token usage:")
  printLine("Input:", fmt(reed.inputTokens), 4)
  printLine("Output:", fmt(reed.outputTokens), 4)
  printLine("Cached input:", fmt(reed.cachedInputTokens), 4)
  printLine("Total:", fmt(reed.totalTokens), 4)

  console.log("\n--- Actions ---")
  printLine("Healing events:", `${fmt(actions.healingCount)} (+${fmt(actions.totalHealing)} HP)`)
  printLine("Damage events:", `${fmt(actions.damageCount)} (${fmt(actions.totalDamage)} HP)`)
  printLine("Coin transactions:", fmt(actions.coinTransactions))
  printLine("Items acquired:", fmt(actions.itemsAcquired))
  printLine("Short rests:", fmt(actions.shortRests))
  printLine("Long rests:", fmt(actions.longRests))
  printLine("Hit dice:", `${fmt(actions.hitDiceUsed)} used, ${fmt(actions.hitDiceRestored)} restored`)
  printLine("Spell slots:", `${fmt(actions.spellSlotsUsed)} used, ${fmt(actions.spellSlotsRestored)} restored`)
  printLine("Spells prepared:", `${fmt(actions.spellsPrepared)} prepped, ${fmt(actions.spellsUnprepared)} removed`)
  printLine("Wild shape uses:", fmt(actions.wildShapeUses))
  printLine("Level ups:", fmt(actions.levelUps))
  printLine("Campaigns created:", fmt(actions.campaignsCreated))

  console.log("\nDone.")
  db.close()
  process.exit(0)
}

main()
