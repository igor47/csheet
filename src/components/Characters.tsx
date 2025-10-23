import type { Character } from "@src/db/characters"

export interface CharactersProps {
  characters: Character[]
  showArchived: boolean
  archivedCount: number
}

const CharacterRow = ({ char }: { char: Character }) => {
  const isArchived = char.archived_at !== null

  return (
    <tr>
      <td>
        <strong>{char.name}</strong>
        {isArchived && <span class="badge bg-secondary ms-2">Archived</span>}
      </td>
      <td>{char.species}</td>
      <td>{char.background}</td>
      <td>{char.alignment || "-"}</td>
      <td>{new Date(char.created_at).toLocaleDateString()}</td>
      <td>
        {/* biome-ignore lint/a11y/useSemanticElements: Bootstrap requires role="group" for btn-group */}
        <div class="btn-group" role="group">
          <a href={`/characters/${char.id}`} class="btn btn-sm btn-outline-primary">
            View
          </a>
          {isArchived ? (
            <button
              type="button"
              class="btn btn-sm btn-outline-success"
              hx-post={`/characters/${char.id}/unarchive`}
              hx-confirm="Are you sure you want to restore this character?"
              data-testid={`unarchive-${char.id}`}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              class="btn btn-sm btn-outline-warning"
              hx-post={`/characters/${char.id}/archive`}
              hx-confirm={`Are you sure you want to archive "${char.name}"? This will free up the name for reuse.`}
              data-testid={`archive-${char.id}`}
            >
              Archive
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

const EmptyState = ({ showArchived }: { showArchived: boolean }) => (
  <div class="text-center py-5">
    <p class="text-muted">
      {showArchived ? "No characters to display." : "You haven't created any characters yet."}
    </p>
    {!showArchived && (
      <a href="/characters/new" class="btn btn-primary mt-3">
        Create Your First Character
      </a>
    )}
  </div>
)

const CharacterTable = ({ characters }: { characters: Character[] }) => (
  <div class="table-responsive">
    <table class="table table-hover">
      <thead>
        <tr>
          <th>Name</th>
          <th>Species</th>
          <th>Background</th>
          <th>Alignment</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {characters.map((char) => (
          <CharacterRow char={char} key={char.id} />
        ))}
      </tbody>
    </table>
  </div>
)

export const Characters = ({ characters, showArchived, archivedCount }: CharactersProps) => {
  return (
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="card-title mb-0">My Characters</h1>
                <a href="/characters/new" class="btn btn-primary">
                  <i class="bi bi-plus-circle"></i> Create New Character
                </a>
              </div>

              {archivedCount > 0 && (
                <div class="form-check mb-3">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="showArchivedCheckbox"
                    checked={showArchived}
                    hx-get={showArchived ? "/characters" : "/characters?show_archived=true"}
                    hx-target="body"
                    hx-push-url="true"
                  />
                  <label class="form-check-label" for="showArchivedCheckbox">
                    Show archived characters ({archivedCount})
                  </label>
                </div>
              )}

              {characters.length === 0 ? (
                <EmptyState showArchived={showArchived} />
              ) : (
                <CharacterTable characters={characters} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
