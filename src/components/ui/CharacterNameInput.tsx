export interface CharacterNameInputProps {
  error?: string;
  value?: string;
}

export const CharacterNameInput = ({ error, value }: CharacterNameInputProps) => (
  <div class="mb-3" hx-target="this" hx-swap="outerHTML">
    <label for="name" class="form-label">Character Name</label>
    <input
      type="text"
      class={`form-control ${error ? 'is-invalid' : ''}`}
      id="name"
      name="name"
      value={value || ''}
      required
      placeholder="Enter character name"
      hx-post="/characters/new/name"
    />
    <div id="name-validation" hx-target="#name-validation" hx-swap="outerHTML">
      {error && <div class="invalid-feedback d-block">{error}</div>}
    </div>
  </div>
)
