import { create as createProficiencyDb } from "@src/db/char_proficiencies"
import {
  formatProficiencyName,
  invalidProficiencyReason,
  normalizeProficiencyName,
  type ProficiencyKind,
  ProficiencyKindSchema,
  ProficiencyKinds,
} from "@src/lib/dnd/proficiencies"
import type { ServiceResult } from "@src/lib/serviceResult"
import type { ToolInput, ToolSpec } from "@src/lib/toolSpec"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export interface ProficiencyRef {
  kind: ProficiencyKind
  name: string
}

export type UpdateProficienciesResult = ServiceResult<{
  added: ProficiencyRef[]
  removed: ProficiencyRef[]
}>

export interface ProficiencyChanges {
  add: ProficiencyRef[]
  remove: ProficiencyRef[]
  sourceDetail: string | null
  note: string | null
}

/** Form field for removing a current proficiency */
export function removeFieldName(p: ProficiencyRef): string {
  return `remove:${p.kind}:${p.name}`
}

const sameRef = (a: ProficiencyRef, b: ProficiencyRef) => a.kind === b.kind && a.name === b.name

/**
 * Validate and apply manual proficiency changes; with isCheck, only validate
 * Names are normalized ("Longswords" is "longsword"); errors go under "add", "remove", or "general"
 */
export async function changeProficiencies(
  db: SQL,
  char: ComputedCharacter,
  changes: ProficiencyChanges,
  isCheck: boolean
): Promise<
  | { complete: true; added: ProficiencyRef[]; removed: ProficiencyRef[] }
  | { complete: false; errors: Record<string, string> }
> {
  const errors: Record<string, string> = {}
  const has = (ref: ProficiencyRef) => char.proficiencies.some((p) => sameRef(p, ref))
  const normalize = (ref: ProficiencyRef): ProficiencyRef => ({
    kind: ref.kind,
    name: normalizeProficiencyName(ref.kind, ref.name, char.ruleset),
  })
  const unique = (refs: ProficiencyRef[]) =>
    refs.filter((ref, i) => refs.findIndex((r) => sameRef(r, ref)) === i)

  const toRemove = unique(changes.remove.map(normalize))
  const toAdd = unique(changes.add.map(normalize).filter((ref) => ref.name))

  for (const ref of toRemove) {
    if (!has(ref)) {
      const current = char.proficiencies
        .filter((p) => p.kind === ref.kind)
        .map((p) => p.name)
        .join(", ")
      errors.remove = `Not proficient with ${formatProficiencyName(ref.name)} (current ${ref.kind} proficiencies: ${current || "none"})`
    }
  }
  for (const ref of toAdd) {
    const invalid = invalidProficiencyReason(ref.kind, ref.name)
    if (invalid) {
      errors.add = invalid
    } else if (has(ref) && !toRemove.some((r) => sameRef(r, ref))) {
      errors.add = `Already proficient with ${formatProficiencyName(ref.name)}`
    }
  }

  // removing and adding back the same proficiency changes nothing
  const removed = toRemove.filter((r) => !toAdd.some((a) => sameRef(a, r)))
  const added = toAdd.filter((a) => !toRemove.some((r) => sameRef(a, r)))

  // changes that cancel out are an error even when only checking, so Reed's pre-check catches
  // them; an empty form only errors on submit
  const requested = toAdd.length + toRemove.length > 0
  if (
    (requested || !isCheck) &&
    !errors.add &&
    !errors.remove &&
    added.length === 0 &&
    removed.length === 0
  ) {
    errors.general = "Add or remove at least one proficiency"
  }

  if (isCheck || Object.keys(errors).length > 0) {
    return { complete: false, errors }
  }

  for (const [refs, action] of [
    [removed, "remove"],
    [added, "add"],
  ] as const) {
    for (const ref of refs) {
      await createProficiencyDb(db, {
        character_id: char.id,
        ...ref,
        action,
        source: "custom",
        source_detail: action === "add" ? changes.sourceDetail : null,
        note: changes.note,
      })
    }
  }

  return { complete: true, added, removed }
}

/**
 * Add and remove proficiencies from the edit form
 *
 * Form fields:
 * - add_kind: the kind of the proficiencies to add
 * - add_names: comma-separated names to add
 * - remove:<kind>:<name>: present (checked) for each current proficiency to remove
 * - source_detail: optional, where added proficiencies came from (e.g. a feat)
 * - note: optional note for the history
 */
export async function updateProficiencies(
  db: SQL,
  char: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateProficienciesResult> {
  const formErrors: Record<string, string> = {}

  const remove: ProficiencyRef[] = []
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith("remove:") || !value) continue
    const [, kind, ...rest] = key.split(":")
    const parsedKind = ProficiencyKindSchema.safeParse(kind)
    if (parsedKind.success) remove.push({ kind: parsedKind.data, name: rest.join(":") })
  }

  const add: ProficiencyRef[] = []
  const names = (data.add_names || "")
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n.length > 0)
  if (names.length > 0) {
    const kind = ProficiencyKindSchema.safeParse(data.add_kind)
    if (kind.success) {
      add.push(...names.map((name) => ({ kind: kind.data, name })))
    } else {
      formErrors.add_kind = `Kind must be one of: ${ProficiencyKinds.join(", ")}`
    }
  }

  const result = await changeProficiencies(
    db,
    char,
    {
      add,
      remove,
      sourceDetail: data.source_detail?.trim() || null,
      note: data.note?.trim() || null,
    },
    data.is_check === "true" || Object.keys(formErrors).length > 0
  )

  if (!result.complete) {
    const { add: addError, ...errors } = result.errors
    return {
      complete: false,
      values: data,
      errors: { ...errors, ...formErrors, ...(addError && { add_names: addError }) },
    }
  }
  return { complete: true, result: { added: result.added, removed: result.removed } }
}

// ─── Reed tool ─────────────────────────────────────────────────────────────

const ProficiencyRefSchema = z.object({
  kind: ProficiencyKindSchema.describe("weapon, armor, tool, or language"),
  name: z
    .string()
    .min(1)
    .describe(
      "Weapons: 'simple weapons', 'martial weapons', or one weapon like 'longsword'. Armor: 'light armor', 'medium armor', 'heavy armor', or 'shields'. Tools and languages by name, like \"thieves' tools\" or 'elvish'."
    ),
})

export const UpdateProficienciesApiSchema = z.object({
  add: z
    .array(ProficiencyRefSchema)
    .optional()
    .default([])
    .describe("Proficiencies or languages the character gains"),
  remove: z
    .array(ProficiencyRefSchema)
    .optional()
    .default([])
    .describe("Proficiencies or languages the character loses"),
  source: z
    .string()
    .nullable()
    .optional()
    .describe("Where the added proficiencies come from, e.g. 'Weapon Master feat'"),
  note: z.string().nullable().optional().describe("Optional note for the history"),
})

export const updateProficienciesToolName = "update_proficiencies" as const
export const updateProficienciesTool = {
  description: `Add or remove the character's weapon, armor, tool, and language proficiencies.

The character's current proficiencies are in character_status. The ones from their species, background, and classes (including the reduced set for multiclassing) are granted automatically, so use this for everything else: feats, training, DM rulings, and choices the rules leave to the player (a musical instrument, an extra language). Removing a granted proficiency is allowed, e.g. for a DM ruling.

Weapon proficiency decides whether the proficiency bonus is added to attack rolls with a weapon; armor proficiency, whether the character can wear armor (or, in SRD 5.2, use a shield) without penalty.`,
  inputSchema: UpdateProficienciesApiSchema,
} satisfies ToolSpec

/**
 * Execute the update_proficiencies tool from the AI assistant
 */
export async function executeUpdateProficiencies(
  db: SQL,
  char: ComputedCharacter,
  parameters: ToolInput<typeof updateProficienciesTool>,
  isCheck?: boolean
): Promise<UpdateProficienciesResult> {
  const result = await changeProficiencies(
    db,
    char,
    {
      add: parameters.add,
      remove: parameters.remove,
      sourceDetail: parameters.source?.trim() || null,
      note: parameters.note?.trim() || null,
    },
    !!isCheck
  )

  if (!result.complete) {
    return { complete: false, values: {}, errors: result.errors }
  }
  return { complete: true, result: { added: result.added, removed: result.removed } }
}

/**
 * Format approval message for update_proficiencies tool calls
 */
export function formatUpdateProficienciesApproval(
  parameters: ToolInput<typeof updateProficienciesTool>,
  char: ComputedCharacter
): string {
  const list = (refs: ProficiencyRef[]) =>
    refs
      .map((r) => formatProficiencyName(normalizeProficiencyName(r.kind, r.name, char.ruleset)))
      .join(", ")

  const parts: string[] = []
  if (parameters.add.length > 0) parts.push(`Add proficiency in ${list(parameters.add)}`)
  if (parameters.remove.length > 0) parts.push(`Remove proficiency in ${list(parameters.remove)}`)

  let message = parts.join("; ") || "Change no proficiencies"
  if (parameters.source) message += ` (from ${parameters.source})`
  if (parameters.note) message += ` with note '${parameters.note}'`
  return message
}
