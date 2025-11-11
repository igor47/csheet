import type { Spell } from "@src/lib/dnd/spells"

export interface SpellPickerProps {
  spells: Spell[]
  selectedSpellId?: string
  name?: string
  label?: string
  error?: string
  emptyMessage?: string
  searchQuery?: string
}

export const SpellPicker = ({
  spells: availableSpells,
  selectedSpellId,
  name = "spell_id",
  label,
  error,
  emptyMessage = "No spells available.",
  searchQuery,
}: SpellPickerProps) => {
  if (availableSpells.length === 0) {
    return <div class="alert alert-warning">{emptyMessage}</div>
  }

  // Filter spells based on search query
  const filteredSpells = searchQuery
    ? availableSpells.filter((spell) => {
        const query = searchQuery.toLowerCase()
        return (
          spell.name.toLowerCase().includes(query) ||
          spell.briefDescription.toLowerCase().includes(query)
        )
      })
    : availableSpells

  const showSearchResults = searchQuery && searchQuery.trim().length > 0

  return (
    <div class="mb-3">
      {label && (
        <label class="form-label" for={name}>
          {label}
        </label>
      )}

      {/* Search input */}
      <input
        id="spellpicker-spell-search"
        type="text"
        class="form-control mb-2"
        name="spell_search"
        placeholder="Search spells..."
        value={searchQuery || ""}
      />

      {/* Results count */}
      {showSearchResults && (
        <small class="text-muted d-block mb-2">
          Showing {filteredSpells.length} of {availableSpells.length} spells
        </small>
      )}

      {/* Spell list */}
      {filteredSpells.length === 0 ? (
        <div class="alert alert-info">No spells match your search.</div>
      ) : (
        <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
          {filteredSpells.map((spell) => (
            <div class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name={name}
                id={`spell-${spell.id}`}
                value={spell.id}
                checked={selectedSpellId === spell.id}
              />
              <label class="form-check-label" for={`spell-${spell.id}`}>
                {spell.name} (Level {spell.level === 0 ? "Cantrip" : spell.level})
                <br />
                <small class="text-muted">{spell.briefDescription}</small>
              </label>
            </div>
          ))}
        </div>
      )}

      {error && <div class="invalid-feedback d-block">{error}</div>}
    </div>
  )
}
