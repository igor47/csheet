import type { Spell } from "@src/lib/dnd/spells"

export interface SpellPickerProps {
  spells: Spell[]
  selectedSpellId?: string
  name?: string
  label?: string
  error?: string
  emptyMessage?: string
}

export const SpellPicker = ({
  spells: availableSpells,
  selectedSpellId,
  name = "spell_id",
  label,
  error,
  emptyMessage = "No spells available.",
}: SpellPickerProps) => {
  if (availableSpells.length === 0) {
    return <div class="alert alert-warning">{emptyMessage}</div>
  }

  return (
    <div class="mb-3">
      {label && (
        <label class="form-label" for={name}>
          {label}
        </label>
      )}
      <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
        {availableSpells.map((spell) => (
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
      {error && <div class="invalid-feedback d-block">{error}</div>}
    </div>
  )
}
