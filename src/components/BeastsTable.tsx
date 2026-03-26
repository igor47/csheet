import type { Beast } from "@src/lib/dnd/beasts"

export interface BeastsTableProps {
  beasts: Beast[]
  sortBy?: string
  sortOrder?: string
  selectedRuleset?: string
  selectedSize?: string
  selectedMaxCR?: string
  selectedMovement?: string
  searchQuery?: string
}

function formatCR(cr: number): string {
  if (cr === 0.125) return "1/8"
  if (cr === 0.25) return "1/4"
  if (cr === 0.5) return "1/2"
  return cr.toString()
}

function formatSpeed(beast: Beast): string {
  const parts: string[] = []
  if (beast.speed.walk) parts.push(`${beast.speed.walk} ft.`)
  if (beast.speed.swim) parts.push(`swim ${beast.speed.swim} ft.`)
  if (beast.speed.fly) parts.push(`fly ${beast.speed.fly} ft.`)
  if (beast.speed.climb) parts.push(`climb ${beast.speed.climb} ft.`)
  if (beast.speed.burrow) parts.push(`burrow ${beast.speed.burrow} ft.`)
  return parts.join(", ")
}

const SortableHeader = ({
  column,
  label,
  currentSort,
  currentOrder,
  selectedRuleset,
  selectedSize,
  selectedMaxCR,
  selectedMovement,
  searchQuery,
}: {
  column: string
  label: string
  currentSort?: string
  currentOrder?: string
  selectedRuleset?: string
  selectedSize?: string
  selectedMaxCR?: string
  selectedMovement?: string
  searchQuery?: string
}) => {
  const isActive = currentSort === column
  const newOrder = isActive && currentOrder === "asc" ? "desc" : "asc"

  const params = new URLSearchParams()
  if (selectedRuleset) params.set("ruleset", selectedRuleset)
  if (selectedSize) params.set("size", selectedSize)
  if (selectedMaxCR) params.set("maxCR", selectedMaxCR)
  if (selectedMovement) params.set("movement", selectedMovement)
  if (searchQuery) params.set("search", searchQuery)
  params.set("sortBy", column)
  params.set("sortOrder", newOrder)

  return (
    <th>
      <button
        type="button"
        class="btn btn-link p-0 text-white text-decoration-none d-flex align-items-center gap-1"
        style="cursor: pointer;"
        hx-get={`/beasts?${params.toString()}`}
        hx-target="#beasts-table"
        hx-swap="outerHTML"
        hx-push-url="true"
      >
        {label}
        {isActive && <i class={`bi bi-caret-${currentOrder === "asc" ? "up" : "down"}-fill`}></i>}
      </button>
    </th>
  )
}

export const BeastsTable = ({
  beasts,
  sortBy = "cr",
  sortOrder = "asc",
  selectedRuleset,
  selectedSize,
  selectedMaxCR,
  selectedMovement,
  searchQuery,
}: BeastsTableProps) => (
  <div id="beasts-table">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <SortableHeader
            column="name"
            label="Name"
            currentSort={sortBy}
            currentOrder={sortOrder}
            selectedRuleset={selectedRuleset}
            selectedSize={selectedSize}
            selectedMaxCR={selectedMaxCR}
            selectedMovement={selectedMovement}
            searchQuery={searchQuery}
          />
          <SortableHeader
            column="cr"
            label="CR"
            currentSort={sortBy}
            currentOrder={sortOrder}
            selectedRuleset={selectedRuleset}
            selectedSize={selectedSize}
            selectedMaxCR={selectedMaxCR}
            selectedMovement={selectedMovement}
            searchQuery={searchQuery}
          />
          <SortableHeader
            column="size"
            label="Size"
            currentSort={sortBy}
            currentOrder={sortOrder}
            selectedRuleset={selectedRuleset}
            selectedSize={selectedSize}
            selectedMaxCR={selectedMaxCR}
            selectedMovement={selectedMovement}
            searchQuery={searchQuery}
          />
          <th>HP</th>
          <th>AC</th>
          <th>Speed</th>
        </tr>
      </thead>
      <tbody>
        {beasts.length === 0 ? (
          <tr>
            <td colspan={6} class="text-center text-muted">
              No beasts match your filters
            </td>
          </tr>
        ) : (
          beasts.map((beast) => {
            const params = new URLSearchParams()
            if (selectedRuleset) params.set("ruleset", selectedRuleset)
            if (selectedSize) params.set("size", selectedSize)
            if (selectedMaxCR) params.set("maxCR", selectedMaxCR)
            if (selectedMovement) params.set("movement", selectedMovement)
            if (searchQuery) params.set("search", searchQuery)
            params.set("sortBy", sortBy)
            params.set("sortOrder", sortOrder)
            params.set("openBeast", beast.id)

            return (
              <tr>
                <td>
                  <button
                    type="button"
                    class="btn btn-link p-0 text-start"
                    data-bs-toggle="modal"
                    data-bs-target="#detailModal"
                    hx-get={`/beasts/${beast.id}?ruleset=${beast.source}`}
                    hx-target="#detailModalContent"
                    hx-swap="innerHTML"
                    hx-push-url={`/beasts?${params.toString()}`}
                  >
                    {beast.name}
                  </button>
                </td>
                <td>{formatCR(beast.cr)}</td>
                <td class="text-capitalize">{beast.size}</td>
                <td>{beast.hitPoints}</td>
                <td>{beast.ac}</td>
                <td>{formatSpeed(beast)}</td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  </div>
)
