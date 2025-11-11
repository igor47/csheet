import { config } from "@src/config"
import type { CharNote } from "@src/db/char_notes"
import { NotesSaveIndicator } from "./NotesSaveIndicator"

export interface SessionNotesProps {
  characterId: string
  currentNote: CharNote | null
}

export const SessionNotes = ({ characterId, currentNote }: SessionNotesProps) => {
  const content = currentNote?.content || ""
  const autoSaveDelaySeconds = config.notesAutoSaveDelay / 1000

  return (
    <div class="card shadow-sm flex-lg-fill d-lg-flex flex-lg-column" id="session-notes-card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
          <i class="bi bi-journal-bookmark me-2"></i>
          Session Notes
        </h5>
        <div class="d-flex align-items-center gap-2">
          <NotesSaveIndicator lastSaved={currentNote?.updated_at} />
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            hx-get={`/characters/${characterId}/history/notes`}
            hx-target="#editModalContent"
            data-bs-toggle="modal"
            data-bs-target="#editModal"
          >
            <i class="bi bi-clock-history" /> History
          </button>
        </div>
      </div>
      <div class="card-body flex-lg-fill d-lg-flex flex-lg-column">
        <textarea
          id="session-notes-textarea"
          name="content"
          class="form-control flex-lg-fill"
          style="min-height: 300px"
          placeholder="Write your notes here..."
          data-character-id={characterId}
          hx-post={`/characters/${characterId}/notes`}
          hx-trigger={`input changed delay:${autoSaveDelaySeconds}s`}
          hx-target="#notes-save-status"
          hx-swap="morph:outerHTML"
          // biome-ignore lint/suspicious/noTsIgnore: this is SSR HTML, not real TS event code
          // @ts-ignore
          onInput="document.getElementById('notes-saved').classList.add('d-none'); document.getElementById('notes-unsaved').classList.remove('d-none');"
        >
          {content}
        </textarea>
      </div>
    </div>
  )
}
