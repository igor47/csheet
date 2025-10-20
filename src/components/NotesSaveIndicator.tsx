export interface NotesSaveIndicatorProps {
  lastSaved?: Date
  error?: boolean
}

export const NotesSaveIndicator = ({ lastSaved, error }: NotesSaveIndicatorProps) => {
  if (error) {
    return (
      <div id="notes-save-status">
        <small class="text-danger" id="notes-saved">
          <i class="bi bi-exclamation-triangle-fill me-1"></i>
          Failed to save
        </small>
        <small class="text-muted d-none" id="notes-unsaved">
          <i class="bi bi-dash-circle me-1"></i>
          Unsaved
        </small>
      </div>
    )
  }

  if (!lastSaved) {
    return (
      <div id="notes-save-status">
        <small class="text-muted d-none" id="notes-saved">
          Not saved
        </small>
        <small class="text-muted" id="notes-unsaved">
          <i class="bi bi-dash-circle me-1"></i>
          Unsaved
        </small>
      </div>
    )
  }

  return (
    <div id="notes-save-status">
      <small class="text-success" id="notes-saved">
        <i class="bi bi-check-circle-fill me-1"></i>
        Saved at {new Date(lastSaved).toLocaleTimeString()}
      </small>
      <small class="text-muted d-none" id="notes-unsaved">
        <i class="bi bi-dash-circle me-1"></i>
        Unsaved
      </small>
    </div>
  )
}
