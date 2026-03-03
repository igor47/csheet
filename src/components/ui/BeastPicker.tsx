import type { Beast } from "@src/lib/dnd/beasts"
import { formatCR } from "@src/services/wildShapeLimits"

export interface BeastPickerProps {
  beasts: Beast[]
  selectedBeastId?: string
  name?: string
  label?: string
  error?: string
  emptyMessage?: string
  searchQuery?: string
}

export const BeastPicker = ({
  beasts: availableBeasts,
  selectedBeastId,
  name = "beast_id",
  label,
  error,
  emptyMessage = "No beasts available.",
  searchQuery,
}: BeastPickerProps) => {
  if (availableBeasts.length === 0) {
    return <div class="alert alert-warning">{emptyMessage}</div>
  }

  // Filter beasts based on search query
  const filteredBeasts = searchQuery
    ? availableBeasts.filter((beast) => {
        const query = searchQuery.toLowerCase()
        return beast.name.toLowerCase().includes(query)
      })
    : availableBeasts

  const showSearchResults = searchQuery && searchQuery.trim().length > 0

  const formatSpeed = (beast: Beast) => {
    const parts: string[] = []
    if (beast.speed.walk) parts.push(`${beast.speed.walk} ft.`)
    if (beast.speed.swim) parts.push(`swim ${beast.speed.swim} ft.`)
    if (beast.speed.fly) parts.push(`fly ${beast.speed.fly} ft.`)
    if (beast.speed.climb) parts.push(`climb ${beast.speed.climb} ft.`)
    return parts.join(", ")
  }

  return (
    <div class="mb-3">
      {label && (
        <label class="form-label" for={name}>
          {label}
        </label>
      )}

      {/* Search input */}
      <input
        id="beastpicker-beast-search"
        type="text"
        class="form-control mb-2"
        name="beast_search"
        placeholder="Search beasts..."
        value={searchQuery || ""}
      />

      {/* Results count */}
      {showSearchResults && (
        <small class="text-muted d-block mb-2">
          Showing {filteredBeasts.length} of {availableBeasts.length} beasts
        </small>
      )}

      {/* Beast list */}
      {filteredBeasts.length === 0 ? (
        <div class="alert alert-info">No beasts match your search.</div>
      ) : (
        <div class="border rounded p-2" style="max-height: 300px; overflow-y: auto;">
          {filteredBeasts.map((beast) => (
            <div class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name={name}
                id={`beast-${beast.id}`}
                value={beast.id}
                checked={selectedBeastId === beast.id}
              />
              <label class="form-check-label" for={`beast-${beast.id}`}>
                {beast.name} (CR {formatCR(beast.cr)})
                <br />
                <small class="text-muted">
                  <span class="text-capitalize">{beast.size}</span>, {beast.hitPoints} HP, AC{" "}
                  {beast.ac}, {formatSpeed(beast)}
                </small>
              </label>
            </div>
          ))}
        </div>
      )}

      {error && <div class="invalid-feedback d-block">{error}</div>}
    </div>
  )
}
