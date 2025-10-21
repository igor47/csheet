import { nameExistsForUser, unarchive } from "@src/db/characters"
import type { SQL } from "bun"
import type { ComputedCharacter } from "./computeCharacter"

export type UnarchiveCharacterResult =
  | { complete: true }
  | { complete: false; errors: Record<string, string> }

/**
 * Unarchive a character
 * Sets archived_at to NULL, making the character active again
 * Checks that the character name is not already in use by another active character
 */
export async function unarchiveCharacter(
  db: SQL,
  character: ComputedCharacter
): Promise<UnarchiveCharacterResult> {
  try {
    // Check if character is already active
    if (character.archived_at === null) {
      return { complete: false, errors: { _form: "Character is already active" } }
    }

    // Check if name is already in use by another active character
    const nameExists = await nameExistsForUser(db, character.user_id, character.name)
    if (nameExists) {
      return {
        complete: false,
        errors: { _form: `Character name "${character.name}" is already in use` },
      }
    }

    await unarchive(db, character.id)

    return { complete: true }
  } catch (error) {
    if (error instanceof Error) {
      return { complete: false, errors: { _form: error.message } }
    }
    return { complete: false, errors: { _form: "Failed to unarchive character" } }
  }
}
