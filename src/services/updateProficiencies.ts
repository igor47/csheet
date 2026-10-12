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
import type { SQL } from "bun"
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
