import type { CharNote } from "@src/db/char_notes"
import { ModalContent } from "./ui/ModalContent"

export interface NotesHistoryProps {
  characterId: string
  notes: CharNote[]
}

const formatTimestamp = (date: Date): string => {
  return new Date(date).toLocaleString()
}

const getContentStats = (content: string): { words: number; lines: number; chars: number } => {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const lines = content.split("\n").length
  const chars = content.length
  return { words, lines, chars }
}

const NotesHistoryEntry = ({
  note,
  characterId,
  isFirst,
  notesById,
}: {
  note: CharNote
  characterId: string
  isFirst: boolean
  notesById: Map<string, CharNote>
}) => {
  // Find the original note if this is a restore
  const restoredFromNote = note.restored_from_id ? notesById.get(note.restored_from_id) : null
  const stats = getContentStats(note.content)

  return (
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div class="flex-grow-1">
          <div class="d-flex gap-2 align-items-center mb-1">
            <strong>{formatTimestamp(note.created_at)}</strong>
            {isFirst && <span class="badge bg-primary">Current</span>}
            {note.is_backup && <span class="badge bg-secondary">Auto-backup</span>}
            {note.restored_from_id && <span class="badge bg-info">Restored</span>}
          </div>
          {restoredFromNote && (
            <div class="text-muted small mb-2">
              Restored from version at {formatTimestamp(restoredFromNote.created_at)}
            </div>
          )}
          <div class="text-muted small">
            {stats.words} words, {stats.lines} lines ({stats.chars} characters)
          </div>
        </div>
        {!isFirst && (
          <button
            type="button"
            class="btn btn-sm btn-outline-primary ms-3"
            hx-post={`/characters/${characterId}/notes/restore/${note.id}`}
            hx-target="#session-notes-card"
            hx-swap="outerHTML"
          >
            Restore
          </button>
        )}
      </div>
    </div>
  )
}

export const NotesHistory = ({ characterId, notes }: NotesHistoryProps) => {
  // Create a map of note IDs to notes for quick lookup
  const notesById = new Map(notes.map((n) => [n.id, n]))

  return (
    <ModalContent title="Session Notes History">
      {notes.length === 0 ? (
        <div class="alert alert-info">No notes history yet.</div>
      ) : (
        <div class="list-group list-group-flush">
          {notes.map((note, index) => (
            <NotesHistoryEntry
              key={note.id}
              note={note}
              characterId={characterId}
              isFirst={index === 0}
              notesById={notesById}
            />
          ))}
        </div>
      )}
    </ModalContent>
  )
}
