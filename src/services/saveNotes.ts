import { config } from "@src/config"
import type { CharNote } from "@src/db/char_notes"
import {
  create as createNoteDb,
  getCurrent,
  markAsBackup,
  update as updateNoteDb,
} from "@src/db/char_notes"
import type { SQL } from "bun"

export type SaveNotesResult = {
  complete: true
  note: CharNote
}

/**
 * Save session notes.
 * - If sufficient time has elapsed since the last save, marks the current note as a backup
 *   and creates a new note entry
 * - Otherwise, updates the current note in-place
 */
export async function saveNotes(
  db: SQL,
  characterId: string,
  content: string
): Promise<SaveNotesResult> {
  const currentNote = await getCurrent(db, characterId)

  let savedNote: CharNote

  if (!currentNote) {
    // First note ever - just create it
    savedNote = await createNoteDb(db, {
      character_id: characterId,
      content,
      is_backup: false,
      restored_from_id: null,
    })
  } else {
    const timeSinceLastNote = Date.now() - currentNote.created_at.getTime()
    const shouldCreateBackup = timeSinceLastNote >= config.notesBackupInterval

    if (shouldCreateBackup) {
      // Mark the current note as a backup
      await markAsBackup(db, currentNote.id)

      // Create new note entry
      savedNote = await createNoteDb(db, {
        character_id: characterId,
        content,
        is_backup: false,
        restored_from_id: null,
      })
    } else {
      // Update current note in-place
      savedNote = await updateNoteDb(db, currentNote.id, content)
    }
  }

  return {
    complete: true,
    note: savedNote,
  }
}
