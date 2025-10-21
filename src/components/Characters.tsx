import type { Character } from "@src/db/characters"

export interface CharactersProps {
  characters: Character[]
  archived?: boolean
}

export const Characters = ({ characters, archived = false }: CharactersProps) => (
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h1 class="card-title mb-0">{archived ? "Archived Characters" : "My Characters"}</h1>
              <div>
                {!archived && (
                  <a href="/characters/new" class="btn btn-primary me-2">
                    <i class="bi bi-plus-circle"></i> Create New Character
                  </a>
                )}
                <a
                  href={archived ? "/characters" : "/characters/archived"}
                  class="btn btn-outline-secondary"
                >
                  {archived ? "View Active Characters" : "View Archived Characters"}
                </a>
              </div>
            </div>

            {characters.length === 0 ? (
              <div class="text-center py-5">
                <p class="text-muted">
                  {archived
                    ? "You don't have any archived characters."
                    : "You haven't created any characters yet."}
                </p>
                {!archived && (
                  <a href="/characters/new" class="btn btn-primary mt-3">
                    Create Your First Character
                  </a>
                )}
              </div>
            ) : (
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Species</th>
                      <th>Background</th>
                      <th>Alignment</th>
                      <th>{archived ? "Archived" : "Created"}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {characters.map((char) => (
                      <tr key={char.id}>
                        <td>
                          <strong>{char.name}</strong>
                        </td>
                        <td>{char.species}</td>
                        <td>{char.background}</td>
                        <td>{char.alignment || "-"}</td>
                        <td>
                          {new Date(
                            archived ? char.archived_at || char.created_at : char.created_at
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          {/* biome-ignore lint/a11y/useSemanticElements: Bootstrap requires role="group" for btn-group */}
                          <div class="btn-group" role="group">
                            <a
                              href={`/characters/${char.id}`}
                              class="btn btn-sm btn-outline-primary"
                            >
                              View
                            </a>
                            {archived ? (
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)
