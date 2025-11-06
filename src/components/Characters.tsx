import type { ListCharacter } from "@src/services/listCharacters"

export interface CharactersProps {
  characters: ListCharacter[]
  showArchived: boolean
  archivedCount: number
}

const formatClassLevel = (classes: ListCharacter["classes"]): string => {
  if (classes.length === 0) return "No class"
  if (classes.length === 1) {
    const { class: className, level } = classes[0]!
    return `Level ${level} ${className.charAt(0).toUpperCase() + className.slice(1)}`
  }
  // Multiclass: "Level 3 Fighter / Level 2 Wizard"
  return classes
    .map(
      ({ class: className, level }) =>
        `Level ${level} ${className.charAt(0).toUpperCase() + className.slice(1)}`
    )
    .join(" / ")
}

const CharacterRow = ({ char }: { char: ListCharacter }) => {
  const isArchived = char.archived_at !== null

  return (
    <tr>
      <td>
        <a href={`/characters/${char.id}`} class="text-decoration-none">
          <h5 class="mb-0">{char.name}</h5>
        </a>
        {isArchived && <span class="badge bg-secondary mt-1">Archived</span>}
      </td>
      <td>{formatClassLevel(char.classes)}</td>
      <td class="d-none d-sm-table-cell">{char.species}</td>
      <td class="d-none d-md-table-cell">{char.background}</td>
      <td class="d-none d-lg-table-cell">{char.alignment || "-"}</td>
      <td class="d-none d-lg-table-cell">{new Date(char.created_at).toLocaleDateString()}</td>
      <td>
        <div class="dropdown">
          <button
            class="btn btn-sm btn-outline-secondary dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            data-testid={`actions-${char.id}`}
          >
            ⋯
          </button>
          <ul class="dropdown-menu">
            <li>
              <a class="dropdown-item" href={`/characters/${char.id}`}>
                View
              </a>
            </li>
            <li>
              <hr class="dropdown-divider" />
            </li>
            <li>
              {isArchived ? (
                <button
                  type="button"
                  class="dropdown-item"
                  hx-post={`/characters/${char.id}/unarchive`}
                  hx-confirm="Are you sure you want to restore this character?"
                  data-testid={`unarchive-${char.id}`}
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  class="dropdown-item"
                  hx-post={`/characters/${char.id}/archive`}
                  hx-confirm={`Are you sure you want to archive "${char.name}"? This will free up the name for reuse.`}
                  data-testid={`archive-${char.id}`}
                >
                  Archive
                </button>
              )}
            </li>
          </ul>
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
      <div class="d-flex gap-2 justify-content-center mt-3" id="empty-state-actions">
        <a href="/characters/new" class="btn btn-primary" id="create-character-btn">
          <i class="bi bi-plus-circle"></i> Create New Character
        </a>
        <a href="/characters/import" class="btn btn-outline-primary" id="import-character-btn">
          <i class="bi bi-upload"></i> Import Existing Character
        </a>
      </div>
    )}
  </div>
)

const CharacterTable = ({ characters }: { characters: ListCharacter[] }) => (
  <table class="table table-hover">
    <thead>
      <tr>
        <th>Name</th>
        <th>Class</th>
        <th class="d-none d-sm-table-cell">Species</th>
        <th class="d-none d-md-table-cell">Background</th>
        <th class="d-none d-lg-table-cell">Alignment</th>
        <th class="d-none d-lg-table-cell">Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {characters.map((char) => (
        <CharacterRow char={char} key={char.id} />
      ))}
    </tbody>
  </table>
)

export const Characters = ({ characters, showArchived, archivedCount }: CharactersProps) => {
  return (
    <div class="container-fluid container-md mt-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1>My Characters</h1>
        <div class="d-flex gap-2">
          <a href="/characters/new" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Create New
          </a>
          <a href="/characters/import" class="btn btn-outline-primary">
            <i class="bi bi-upload"></i> Import
          </a>
        </div>
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
  )
}
