// Render a character sheet PDF for visual inspection.
//
// Usage:
//   bun utils/sample-character-pdf.ts [characterId]
//
// With no argument, picks the first non-archived character in the dev DB.
// Writes to /tmp/csheet-sample.pdf.

import { SQL } from "bun"
import { findById as findCharacterById, type Character } from "@src/db/characters"
import { findById as findUserById } from "@src/db/users"
import { computeCharacter } from "@src/services/computeCharacter"
import { generateCharacterPdf } from "@src/services/characterPdf"
import { config } from "@src/config"

const url = `postgres://${config.postgresUser}:${config.postgresPassword}@${config.postgresHost}:${config.postgresPort}/${config.postgresDb}`
const db = new SQL(url)

const argId = process.argv[2]

let target: Character | null = null
if (argId) {
  target = await findCharacterById(db, argId)
  if (!target) {
    console.error(`No character with id ${argId}`)
    process.exit(1)
  }
} else {
  const rows = await db<Array<{ id: string }>>`
    SELECT id FROM characters
    WHERE archived_at IS NULL
    ORDER BY updated_at DESC
    LIMIT 1
  `
  if (rows.length === 0) {
    console.error("No characters found in dev DB. Create one in the app first.")
    process.exit(1)
  }
  target = await findCharacterById(db, rows[0]!.id)
}

if (!target) {
  console.error("Could not load character")
  process.exit(1)
}

const computed = await computeCharacter(db, target.id)
if (!computed) {
  console.error("computeCharacter returned null")
  process.exit(1)
}

const owner = await findUserById(db, target.user_id)
const playerName = owner?.name ?? owner?.email

const bytes = await generateCharacterPdf(computed, playerName ?? undefined)
const path = "/tmp/csheet-sample.pdf"
await Bun.write(path, bytes)
console.log(`Wrote ${bytes.length} bytes → ${path}`)
console.log(`character: ${target.name} (id=${target.id}, ruleset=${target.ruleset})`)
console.log(`pages: ${(bytes.toString().match(/\/Type \/Page\b/g) ?? []).length}`)

process.exit(0)
