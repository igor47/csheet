import { archive } from "@src/db/characters"
import type { SQL } from "bun"
import type { ComputedCharacter } from "./computeCharacter"

export type ArchiveCharacterResult =
  | { complete: true }
  | { complete: false; errors: Record<string, string> }

/**
 * Archive a character
 * Sets archived_at to current timestamp, allowing the character name to be reused
 */
export async function archiveCharacter(
  db: SQL,
  character: ComputedCharacter
): Promise<ArchiveCharacterResult> {
  try {
    // Check if character is already archived
    if (character.archived_at !== null) {
      return { complete: false, errors: { _form: "Character is already archived" } }
    }

    await archive(db, character.id)

    return { complete: true }
  } catch (error) {
    if (error instanceof Error) {
      return { complete: false, errors: { _form: error.message } }
    }
    return { complete: false, errors: { _form: "Failed to archive character" } }
  }
}
