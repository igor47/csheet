import type { DeathSaveKind } from "@src/db/char_death_saves"
import { SRD52_ID } from "@src/lib/dnd/srd52"

/**
 * Dropping to 0 HP, as the SRD (5.1 and 5.2.1 agree) describes it:
 * - a character at 0 HP is dying, and makes death saving throws: a d20, 10+ succeeds
 * - a 1 counts as two failures; a 20 regains 1 HP
 * - three successes make the character stable; three failures, dead
 * - successes and failures reset when the character regains HP or becomes stable
 * - the dead stay dead until restored to life
 * - damage at 0 HP is a failure (two on a critical hit); a stable character who takes damage
 *   starts dying again
 * - damage that leaves a remainder of at least the HP maximum after reaching 0 kills outright
 */
export type DeathSaveStatus = "dying" | "stable" | "dead"

export interface DeathSaves {
  status: DeathSaveStatus
  successes: number
  failures: number
}

export const DEATH_SAVES_NEEDED = 3

export interface DeathSaveEvent {
  kind: DeathSaveKind
  amount: number
}

export function freshDeathSaves(): DeathSaves {
  return { status: "dying", successes: 0, failures: 0 }
}

/**
 * Apply one event to a character's death save state
 */
export function applyDeathSaveEvent(state: DeathSaves, event: DeathSaveEvent): DeathSaves {
  // only being restored to life (an `up`, which ends the stretch of events) undoes death
  if (state.status === "dead") return state

  switch (event.kind) {
    case "down":
    case "up":
      return freshDeathSaves()
    case "success": {
      // a stable character makes no death saves
      if (state.status === "stable") return state
      const successes = state.successes + event.amount
      if (successes >= DEATH_SAVES_NEEDED) return { status: "stable", successes: 0, failures: 0 }
      return { ...state, successes }
    }
    case "failure": {
      // a stable character only fails from taking damage, which starts them dying again; their
      // counts started over when they became stable
      const failures = Math.min(state.failures + event.amount, DEATH_SAVES_NEEDED)
      return { ...state, status: failures >= DEATH_SAVES_NEEDED ? "dead" : "dying", failures }
    }
    case "stable":
      return { status: "stable", successes: 0, failures: 0 }
    case "dead":
      return { ...state, status: "dead" }
  }
}

/**
 * Work out a character's HP and death save state
 * Rows since the character last regained HP mean they're down: at 0 HP, whatever their HP
 * maximum has done since (a level-up or a CON change doesn't wake or revive anyone), with the
 * death saves those rows add up to. Otherwise HP is the maximum plus the HP changes, never below
 * 0; a character who gets to 0 without going down (their maximum dropped) is freshly dying
 */
export function computeHitPoints(
  events: DeathSaveEvent[],
  rawHP: number
): { currentHP: number; deathSaves: DeathSaves | null } {
  if (events.length > 0) {
    return { currentHP: 0, deathSaves: events.reduce(applyDeathSaveEvent, freshDeathSaves()) }
  }
  const currentHP = Math.max(rawHP, 0)
  return { currentHP, deathSaves: currentHP > 0 ? null : freshDeathSaves() }
}

/**
 * What a death saving throw roll counts as
 */
export function deathSaveFromRoll(roll: number): { kind: "success" | "failure"; amount: number } {
  if (roll === 1) return { kind: "failure", amount: 2 }
  if (roll >= 10) return { kind: "success", amount: 1 }
  return { kind: "failure", amount: 1 }
}

/**
 * Why a character can't rest right now, if they can't
 * The dead don't rest. Both rulesets need at least 1 HP to start a long rest; SRD 5.2.1 also
 * needs it for a short rest
 */
export function restBlocker(
  char: { name: string; ruleset: string; currentHP: number; deathSaves: DeathSaves | null },
  rest: "short" | "long"
): string | null {
  if (char.deathSaves?.status === "dead") return `${char.name} is dead`
  if (char.currentHP > 0) return null
  if (rest === "long" || char.ruleset === SRD52_ID) {
    return `${char.name} needs at least 1 HP to start a ${rest} rest`
  }
  return null
}
