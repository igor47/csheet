import type { Character } from "@src/db/characters";
import type { User } from "@src/db/users";

export interface CharactersProps {
  user: User;
  characters: Character[];
}

export const Characters = ({ user, characters }: CharactersProps) => (
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="card shadow-sm">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h1 class="card-title mb-0">My Characters</h1>
              <a href="/character/new" class="btn btn-primary">
                <i class="bi bi-plus-circle"></i> Create New Character
              </a>
            </div>

            {characters.length === 0 ? (
              <div class="text-center py-5">
                <p class="text-muted">You haven't created any characters yet.</p>
                <a href="/character/new" class="btn btn-primary mt-3">Create Your First Character</a>
              </div>
            ) : (
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Race</th>
                      <th>Class</th>
                      <th>Background</th>
                      <th>Size</th>
                      <th>Alignment</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {characters.map((char) => (
                      <tr key={char.id}>
                        <td><strong>{char.name}</strong></td>
                        <td>{char.race}</td>
                        <td>{char.class}</td>
                        <td>{char.background}</td>
                        <td>{char.size}</td>
                        <td>{char.alignment || '-'}</td>
                        <td>{new Date(char.created_at).toLocaleDateString()}</td>
                        <td>
                          <a href={`/character/view?id=${char.id}`} class="btn btn-sm btn-outline-primary">
                            View
                          </a>
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