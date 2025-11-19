import { AvatarDisplay } from "@src/components/AvatarDisplay"
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

const formatSpecies = (species: string, lineage: string | null): string => {
  // Lineages already include the species name (e.g., "forest gnome", "hill dwarf")
  // so we just display the lineage when present
  return lineage || species
}

const CharacterCard = ({ char }: { char: ListCharacter }) => {
  const isArchived = char.archived_at !== null

  return (
    <div class="card h-100">
      {/* Avatar as card header/image */}
      <a href={`/characters/${char.id}`} class="text-decoration-none">
        <AvatarDisplay character={char} mode="display-only" />
      </a>

      {/* Card Body */}
      <div class="card-body">
        <h5 class="card-title mb-2">
          <a href={`/characters/${char.id}`} class="text-decoration-none text-body">
            {char.name}
          </a>
          {isArchived && <span class="badge bg-secondary ms-2">Archived</span>}
        </h5>
        <p class="card-text text-muted mb-1">
          <small>{formatClassLevel(char.classes)}</small>
        </p>
        <p class="card-text text-muted mb-1">
          <small style="text-transform: capitalize;">
            {formatSpecies(char.species, char.lineage)}
          </small>
        </p>
        <p class="card-text text-muted mb-0">
          <small style="text-transform: capitalize;">{char.background}</small>
        </p>
      </div>

      {/* Card Footer with Actions */}
      <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
        <a href={`/characters/${char.id}`} class="btn btn-primary btn-sm">
          <i class="bi bi-eye"></i> View
        </a>
        {isArchived ? (
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            hx-post={`/characters/${char.id}/unarchive`}
            hx-confirm="Are you sure you want to restore this character?"
            data-testid={`unarchive-${char.id}`}
            title="Restore character"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
          </button>
        ) : (
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm"
            hx-post={`/characters/${char.id}/archive`}
            hx-confirm={`Are you sure you want to archive "${char.name}"? This will free up the name for reuse.`}
            data-testid={`archive-${char.id}`}
            title="Archive character"
          >
            <i class="bi bi-archive"></i>
          </button>
        )}
      </div>
    </div>
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

const CharacterGrid = ({ characters }: { characters: ListCharacter[] }) => (
  <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
    {characters.map((char) => (
      <div class="col" key={char.id}>
        <CharacterCard char={char} />
      </div>
    ))}
  </div>
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
        <CharacterGrid characters={characters} />
      )}
    </div>
  )
}
