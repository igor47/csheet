import { beginOrSavepoint } from "@src/db"
import {
  type CreateCharDeathSave,
  create as createDeathSaveDb,
  findSinceLastUp,
} from "@src/db/char_death_saves"
import { create as createCharHPDb, getHpDelta } from "@src/db/char_hp"
import { applyDeathSaveEvent, type DeathSaves, freshDeathSaves } from "@src/lib/dnd/deathSaves"
import type { SQL } from "bun"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"

/**
 * Run a change to a character's HP or death saves in a transaction, against the character as it
 * is once the transaction holds a lock on it
 * The character the request authorized with was computed before the transaction, so two
 * requests at once (a double-click, Reed and the sheet) would both build on the same state
 */
export async function withLockedCharacter<T>(
  db: SQL,
  char: ComputedCharacter,
  fn: (tx: SQL, char: ComputedCharacter) => Promise<T>
): Promise<T> {
  return beginOrSavepoint(db, async (tx) => {
    await tx`SELECT id FROM characters WHERE id = ${char.id} FOR UPDATE`
    const fresh = await computeCharacter(tx, char.id)
    return fn(tx, fresh ?? char)
  })
}

/**
 * Record a death save event, and work out the character's state after it
 * When a failure brings the third, also records the death, so the history says so
 */
export async function addDeathSaveEvent(
  db: SQL,
  before: DeathSaves,
  event: CreateCharDeathSave
): Promise<DeathSaves> {
  const row = await createDeathSaveDb(db, event)
  const after = applyDeathSaveEvent(before, row)
  if (row.kind === "failure" && after.status === "dead" && before.status !== "dead") {
    await createDeathSaveDb(db, {
      character_id: event.character_id,
      kind: "dead",
      amount: 0,
      note: "Third death save failure",
    })
  }
  return after
}

export interface CharacterDamage {
  hpLost: number
  instantDeath: boolean
  // Set when the character ends up at 0 HP
  deathSaves?: DeathSaves
}

/**
 * Apply damage to the character's own HP (not a Wild Shape beast's)
 * HP stops at 0, where the character goes down and starts dying. Damage remaining after reaching
 * 0 kills outright if it's at least the HP maximum; damage taken at 0 HP is a death save failure
 * (two for a critical hit)
 */
export async function damageCharacter(
  db: SQL,
  char: ComputedCharacter,
  amount: number,
  { critical, note }: { critical: boolean; note: string | null }
): Promise<CharacterDamage> {
  const { currentHP } = char
  const hpLost = Math.min(amount, currentHP)
  const remaining = amount - hpLost

  if (hpLost > 0) {
    await createCharHPDb(db, { character_id: char.id, delta: -hpLost, note })
  }
  if (currentHP - hpLost > 0) return { hpLost, instantDeath: false }

  let deathSaves = char.deathSaves ?? freshDeathSaves()
  if (currentHP > 0) {
    deathSaves = await addDeathSaveEvent(db, deathSaves, {
      character_id: char.id,
      kind: "down",
      amount: 0,
    })
  }

  const instantDeath = remaining >= char.maxHitPoints
  if (instantDeath) {
    deathSaves = await addDeathSaveEvent(db, deathSaves, {
      character_id: char.id,
      kind: "dead",
      amount: 0,
      note: `Massive damage: took ${amount}${note ? `: ${note}` : ""}`,
    })
  } else if (currentHP === 0) {
    deathSaves = await addDeathSaveEvent(db, deathSaves, {
      character_id: char.id,
      kind: "failure",
      amount: critical ? 2 : 1,
      note: `Took ${amount} damage at 0 HP${critical ? " (critical hit)" : ""}${note ? `: ${note}` : ""}`,
    })
  }

  return { hpLost, instantDeath, deathSaves }
}

/**
 * Restore some of the character's HP, up to their maximum, and return their new HP
 * A character who is down (at 0 HP) comes back up, which resets their death saves. While down,
 * their HP stays at 0 whatever their HP maximum does, so the HP changes on record can add up to
 * something else; an adjustment brings them to 0 first, so the healing counts from there
 * Callers check the character isn't dead: only restoring them to life heals the dead
 */
export async function healCharacter(
  db: SQL,
  char: ComputedCharacter,
  amount: number,
  note: string | null
): Promise<number> {
  const rawHP = char.maxHitPoints + (await getHpDelta(db, char.id))
  const isDown = (await findSinceLastUp(db, char.id)).length > 0
  const currentHP = isDown ? 0 : Math.max(rawHP, 0)
  const newHP = Math.min(currentHP + amount, char.maxHitPoints)

  if (rawHP !== currentHP) {
    await createCharHPDb(db, {
      character_id: char.id,
      delta: currentHP - rawHP,
      note: "HP maximum changed while at 0 HP",
    })
  }
  if (newHP > currentHP) {
    await createCharHPDb(db, { character_id: char.id, delta: newHP - currentHP, note })
  }
  if (isDown && newHP > 0) {
    await createDeathSaveDb(db, { character_id: char.id, kind: "up", amount: 0, note })
  }

  return newHP
}
