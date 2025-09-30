import { CharacterNameInput } from '@src/components/ui/CharacterNameInput'

export interface CharacterNewProps {
  values?: Record<string, string>,
  errors?: Record<string, string>,
}

export const CharacterNew = ({ values, errors }: CharacterNewProps) => (
  <div class="container mt-5" id="character-new">
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow-sm">
          <div class="card-body">
            <h1 class="card-title mb-4">Create New Character</h1>
            <form hx-post="/characters/new" hx-target="#character-new" hx-swap="outerHTML">
              <CharacterNameInput error={errors?.name} value={values?.name} />

              <div class="mb-3">
                <label for="race" class="form-label">Race</label>
                <select class={`form-select ${errors?.race ? 'is-invalid' : ''}`} id="race" name="race" required>
                  <option value="">Select a race</option>
                  <option value="Human" selected={values?.race === 'Human'}>Human</option>
                  <option value="Elf" selected={values?.race === 'Elf'}>Elf</option>
                  <option value="Dwarf" selected={values?.race === 'Dwarf'}>Dwarf</option>
                  <option value="Halfling" selected={values?.race === 'Halfling'}>Halfling</option>
                  <option value="Dragonborn" selected={values?.race === 'Dragonborn'}>Dragonborn</option>
                  <option value="Gnome" selected={values?.race === 'Gnome'}>Gnome</option>
                  <option value="Half-Elf" selected={values?.race === 'Half-Elf'}>Half-Elf</option>
                  <option value="Half-Orc" selected={values?.race === 'Half-Orc'}>Half-Orc</option>
                  <option value="Tiefling" selected={values?.race === 'Tiefling'}>Tiefling</option>
                </select>
                {errors?.race && <div class="invalid-feedback d-block">{errors.race}</div>}
              </div>

              <div class="mb-3">
                <label for="class" class="form-label">Class</label>
                <select class={`form-select ${errors?.class ? 'is-invalid' : ''}`} id="class" name="class" required>
                  <option value="">Select a class</option>
                  <option value="Barbarian" selected={values?.class === 'Barbarian'}>Barbarian</option>
                  <option value="Bard" selected={values?.class === 'Bard'}>Bard</option>
                  <option value="Cleric" selected={values?.class === 'Cleric'}>Cleric</option>
                  <option value="Druid" selected={values?.class === 'Druid'}>Druid</option>
                  <option value="Fighter" selected={values?.class === 'Fighter'}>Fighter</option>
                  <option value="Monk" selected={values?.class === 'Monk'}>Monk</option>
                  <option value="Paladin" selected={values?.class === 'Paladin'}>Paladin</option>
                  <option value="Ranger" selected={values?.class === 'Ranger'}>Ranger</option>
                  <option value="Rogue" selected={values?.class === 'Rogue'}>Rogue</option>
                  <option value="Sorcerer" selected={values?.class === 'Sorcerer'}>Sorcerer</option>
                  <option value="Warlock" selected={values?.class === 'Warlock'}>Warlock</option>
                  <option value="Wizard" selected={values?.class === 'Wizard'}>Wizard</option>
                </select>
                {errors?.class && <div class="invalid-feedback d-block">{errors.class}</div>}
              </div>

              <div class="mb-3">
                <label for="background" class="form-label">Background</label>
                <input
                  type="text"
                  class={`form-control ${errors?.background ? 'is-invalid' : ''}`}
                  id="background"
                  name="background"
                  value={values?.background || ''}
                  required
                  placeholder="e.g., Soldier, Sage, Criminal"
                />
                {errors?.background && <div class="invalid-feedback d-block">{errors.background}</div>}
              </div>

              <div class="mb-3">
                <label for="size" class="form-label">Size</label>
                <select class={`form-select ${errors?.size ? 'is-invalid' : ''}`} id="size" name="size" required>
                  <option value="">Select size</option>
                  <option value="Small" selected={values?.size === 'Small'}>Small</option>
                  <option value="Medium" selected={values?.size === 'Medium'}>Medium</option>
                  <option value="Large" selected={values?.size === 'Large'}>Large</option>
                </select>
                {errors?.size && <div class="invalid-feedback d-block">{errors.size}</div>}
              </div>

              <div class="mb-3">
                <label for="alignment" class="form-label">Alignment (Optional)</label>
                <select class={`form-select ${errors?.alignment ? 'is-invalid' : ''}`} id="alignment" name="alignment">
                  <option value="">Select alignment</option>
                  <option value="Lawful Good" selected={values?.alignment === 'Lawful Good'}>Lawful Good</option>
                  <option value="Neutral Good" selected={values?.alignment === 'Neutral Good'}>Neutral Good</option>
                  <option value="Chaotic Good" selected={values?.alignment === 'Chaotic Good'}>Chaotic Good</option>
                  <option value="Lawful Neutral" selected={values?.alignment === 'Lawful Neutral'}>Lawful Neutral</option>
                  <option value="True Neutral" selected={values?.alignment === 'True Neutral'}>True Neutral</option>
                  <option value="Chaotic Neutral" selected={values?.alignment === 'Chaotic Neutral'}>Chaotic Neutral</option>
                  <option value="Lawful Evil" selected={values?.alignment === 'Lawful Evil'}>Lawful Evil</option>
                  <option value="Neutral Evil" selected={values?.alignment === 'Neutral Evil'}>Neutral Evil</option>
                  <option value="Chaotic Evil" selected={values?.alignment === 'Chaotic Evil'}>Chaotic Evil</option>
                </select>
                {errors?.alignment && <div class="invalid-feedback d-block">{errors.alignment}</div>}
              </div>

              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">Create Character</button>
                <a href="/characters" class="btn btn-secondary">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
)
