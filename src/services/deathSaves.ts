import { type DeathSaves, deathSaveFromRoll, freshDeathSaves } from "@src/lib/dnd/deathSaves"
import { zodToFormErrors } from "@src/lib/formErrors"
import {
  Checkbox,
  coerceBoolean,
  EnumField,
  NumberField,
  OptionalString,
} from "@src/lib/formSchemas"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { ToolInput, ToolSpec } from "@src/lib/toolSpec"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { addDeathSaveEvent, healCharacter, withLockedCharacter } from "./hitPointChanges"

////////////////////////////////////////////////////////////////////////////////
// Recording a death saving throw

export const DeathSaveOutcomes = ["success", "failure", "nat1", "nat20", "stabilized"] as const
export type DeathSaveOutcome = (typeof DeathSaveOutcomes)[number]

export const RecordDeathSaveApiSchema = z.object({
  outcome: EnumField(z.enum(DeathSaveOutcomes).nullable())
    .optional()
    .describe(
      "What happened, when the d20 roll isn't known: success (10+), failure (under 10), nat1 (two failures), nat20 (regains 1 HP), or stabilized (by someone else, e.g. a DC 10 Medicine check or Spare the Dying)"
    ),
  roll: NumberField(
    z
      .number({ error: "Roll must be a number" })
      .int({ message: "Roll must be a whole number" })
      .min(1, { message: "Roll must be between 1 and 20" })
      .max(20, { message: "Roll must be between 1 and 20" })
      .nullable()
  )
    .optional()
    .describe("The natural d20 roll of the death saving throw, when known"),
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export interface RecordDeathSaveSuccess {
  newHP: number
  // null once the character is back up, after a natural 20
  deathSaves: DeathSaves | null
}

export type RecordDeathSaveResult = ServiceResult<RecordDeathSaveSuccess>

/**
 * Why a character can't make a death saving throw right now, if they can't
 */
function deathSaveBlocker(char: ComputedCharacter): string | null {
  if (!char.deathSaves) return `${char.name} has ${char.currentHP} HP and isn't dying`
  if (char.deathSaves.status === "stable") {
    return `${char.name} is stable and doesn't make death saving throws`
  }
  if (char.deathSaves.status === "dead") return `${char.name} is dead`
  return null
}

/**
 * Record a death saving throw, or someone stabilizing the character, while they're dying
 * Checks only validate; changes run against the character as it is inside the transaction
 */
export async function recordDeathSave(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<RecordDeathSaveResult> {
  if (coerceBoolean(data.is_check)) return applyDeathSave(db, char, data)
  return withLockedCharacter(db, char, (tx, fresh) => applyDeathSave(tx, fresh, data))
}

async function applyDeathSave(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<RecordDeathSaveResult> {
  const checkD = RecordDeathSaveApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const values = checkD.data
  const errors: Record<string, string> = {}

  const blocker = deathSaveBlocker(char)
  if (blocker) {
    errors.outcome = blocker
  } else if (values.outcome && values.roll) {
    errors.outcome = "Give either the outcome or the roll, not both"
  } else if (!values.outcome && !values.roll && !values.is_check) {
    errors.roll = "Roll is required"
  }

  if (values.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  const result = RecordDeathSaveApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  const { outcome, roll } = result.data
  const note = result.data.note || null

  // turn the outcome into what the d20 must have shown, where it tells us
  const natural = roll ?? (outcome === "nat1" ? 1 : outcome === "nat20" ? 20 : null)

  // a natural 20 brings the character back with 1 HP, which also resets their death saves
  if (natural === 20) {
    await addDeathSaveEvent(db, char.deathSaves!, {
      character_id: char.id,
      kind: "success",
      amount: 1,
      roll: 20,
      note,
    })
    const newHP = await healCharacter(db, char, 1, "Rolled a 20 on a death saving throw")
    return { complete: true, result: { newHP, deathSaves: null } }
  }

  const before = char.deathSaves ?? freshDeathSaves()
  let deathSaves: DeathSaves
  if (outcome === "stabilized") {
    deathSaves = await addDeathSaveEvent(db, before, {
      character_id: char.id,
      kind: "stable",
      amount: 0,
      note,
    })
  } else {
    const counts = natural
      ? deathSaveFromRoll(natural)
      : { kind: outcome === "success" ? ("success" as const) : ("failure" as const), amount: 1 }
    deathSaves = await addDeathSaveEvent(db, before, {
      character_id: char.id,
      kind: counts.kind,
      amount: counts.amount,
      roll: natural,
      note,
    })
  }

  return { complete: true, result: { newHP: char.currentHP, deathSaves } }
}

export const recordDeathSaveToolName = "record_death_save" as const
export const recordDeathSaveTool = {
  description: `Record a death saving throw for a character who is dying at 0 HP, or record that someone stabilized them.

Give the natural d20 roll when the player says it (preferred), or the outcome when they don't:
- 10 or higher is a success; under 10 is a failure
- a 1 counts as two failures
- a 20 brings the character back to 1 HP, ending the dying
- three successes make the character stable; three failures and the character dies
- outcome "stabilized" is for when someone else stabilizes the character (a DC 10 Wisdom (Medicine) check, Spare the Dying, a Healer's Kit)
- features that widen the natural 20 range (e.g. Defy Death: 18-20 counts as a 20) should send outcome "nat20"

Examples:
- "I rolled a 14 on my death save" → roll: 14
- "death save, nat 1" → roll: 1
- "I failed my death save" → outcome: "failure"
- "the cleric cast Spare the Dying on me" → outcome: "stabilized"

Damage taken at 0 HP is not a death save roll: record it with update_hit_points, which adds the failures. Healing ends dying: use update_hit_points to restore HP. The result says whether the character is dying, stable or dead, with their success and failure counts.`,
  inputSchema: RecordDeathSaveApiSchema.omit({ is_check: true }),
} satisfies ToolSpec

export async function executeRecordDeathSave(
  db: SQL,
  char: ComputedCharacter,
  parameters: ToolInput<typeof recordDeathSaveTool>,
  isCheck?: boolean
): Promise<RecordDeathSaveResult> {
  const data: Record<string, string> = {
    outcome: parameters.outcome?.toString() || "",
    roll: parameters.roll?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return recordDeathSave(db, char, data)
}

export function formatRecordDeathSaveApproval(
  parameters: ToolInput<typeof recordDeathSaveTool>,
  _char: ComputedCharacter
): string {
  const { outcome, roll, note } = parameters

  let message: string
  if (roll) {
    const counts = deathSaveFromRoll(roll)
    const what =
      roll === 20
        ? "regain 1 HP"
        : counts.amount === 2
          ? "two failures"
          : counts.kind === "success"
            ? "a success"
            : "a failure"
    message = `Record a death save roll of ${roll} (${what})`
  } else if (outcome === "stabilized") {
    message = "Mark as stabilized"
  } else {
    const what = {
      success: "success",
      failure: "failure",
      nat1: "natural 1 (two failures)",
      nat20: "natural 20 (regain 1 HP)",
    }[outcome ?? "success"]
    message = `Record a death save ${what}`
  }

  if (note) message += ` with note '${note}'`
  return message
}

////////////////////////////////////////////////////////////////////////////////
// Bringing a dead character back

export const RestoreToLifeApiSchema = z.object({
  hp: NumberField(
    z
      .number({ error: "HP must be a number" })
      .int({ message: "HP must be a whole number" })
      .min(1, { message: "HP must be at least 1" })
      .nullable()
  )
    .optional()
    .describe(
      "The hit points the character comes back with; 1 if not given (Revivify and Raise Dead give 1)"
    ),
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export interface RestoreToLifeSuccess {
  newHP: number
}

export type RestoreToLifeResult = ServiceResult<RestoreToLifeSuccess>

/**
 * Bring a dead character back to life with some HP, as Revivify does, or undo a death recorded
 * by mistake. Recorded as healing, which brings them back up and resets the death saves
 */
export async function restoreToLife(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<RestoreToLifeResult> {
  if (coerceBoolean(data.is_check)) return applyRestoreToLife(db, char, data)
  return withLockedCharacter(db, char, (tx, fresh) => applyRestoreToLife(tx, fresh, data))
}

async function applyRestoreToLife(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<RestoreToLifeResult> {
  const checkD = RestoreToLifeApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  const values = checkD.data
  const errors: Record<string, string> = {}

  if (char.deathSaves?.status !== "dead") {
    errors.hp = `${char.name} isn't dead`
  } else if (values.hp && values.hp > char.maxHitPoints) {
    errors.hp = `Cannot restore more than ${char.maxHitPoints} HP (the maximum)`
  }

  if (values.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  const result = RestoreToLifeApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  const newHP = await healCharacter(
    db,
    char,
    result.data.hp ?? 1,
    result.data.note || "Restored to life"
  )
  return { complete: true, result: { newHP } }
}

export const restoreToLifeToolName = "restore_to_life" as const
export const restoreToLifeTool = {
  description: `Bring a dead character back to life, e.g. with Revivify, Raise Dead or Resurrection, or when the player or DM says the death shouldn't have happened.

The character comes back with the given hit points (1 by default; Revivify and Raise Dead give 1, Resurrection and True Resurrection give full HP). Only works on a dead character: a dying or stable one just needs healing, with update_hit_points.`,
  inputSchema: RestoreToLifeApiSchema.omit({ is_check: true }),
} satisfies ToolSpec

export async function executeRestoreToLife(
  db: SQL,
  char: ComputedCharacter,
  parameters: ToolInput<typeof restoreToLifeTool>,
  isCheck?: boolean
): Promise<RestoreToLifeResult> {
  const data: Record<string, string> = {
    hp: parameters.hp?.toString() || "",
    note: parameters.note?.toString() || "",
    is_check: isCheck ? "true" : "false",
  }

  return restoreToLife(db, char, data)
}

export function formatRestoreToLifeApproval(
  parameters: ToolInput<typeof restoreToLifeTool>,
  _char: ComputedCharacter
): string {
  let message = `Restore to life with ${parameters.hp ?? 1} HP`
  if (parameters.note) message += ` with note '${parameters.note}'`
  return message
}
