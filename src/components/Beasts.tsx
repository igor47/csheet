import { BeastDetail } from "@src/components/BeastDetail"
import { BeastsTable } from "@src/components/BeastsTable"
import { DetailModal } from "@src/components/ui/DetailModal"
import { Sizes } from "@src/lib/dnd"
import type { Beast } from "@src/lib/dnd/beasts"

export const CROptions = [
  { value: "0", label: "0" },
  { value: "0.125", label: "1/8" },
  { value: "0.25", label: "1/4" },
  { value: "0.5", label: "1/2" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "8", label: "8" },
] as const

export const MovementTypes = ["swim", "fly", "climb", "burrow"] as const

export interface BeastsProps {
  beasts: Beast[]
  selectedRuleset?: string
  selectedSize?: string
  selectedMaxCR?: string
  selectedMovement?: string
  searchQuery?: string
  sortBy?: string
  sortOrder?: string
  openBeast?: Beast
}

export const Beasts = ({
  beasts,
  selectedRuleset,
  selectedSize,
  selectedMaxCR,
  selectedMovement,
  searchQuery,
  sortBy,
  sortOrder,
  openBeast,
}: BeastsProps) => {
  return (
    <>
      <div class="container-fluid mt-4">
        <div class="row">
          <div class="col-12">
            <h1>Beasts</h1>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-12">
            <form
              hx-get="/beasts"
              hx-target="#beasts-table"
              hx-swap="outerHTML"
              hx-trigger="input from:#beast-search-filter changed delay:300ms, change from:select"
              hx-push-url="true"
              class="row g-3 mb-4"
            >
              {/* Hidden inputs to preserve sort state (updated via OOB swaps from BeastsTable) */}
              <input type="hidden" id="beastSortBy" name="sortBy" value={sortBy || "cr"} />
              <input
                type="hidden"
                id="beastSortOrder"
                name="sortOrder"
                value={sortOrder || "asc"}
              />

              <div class="col-12 col-lg-3">
                <label for="beast-search-filter" class="form-label">
                  Search
                </label>
                <input
                  type="text"
                  id="beast-search-filter"
                  name="search"
                  class="form-control"
                  placeholder="Search beast names..."
                  value={searchQuery || ""}
                />
              </div>

              <div class="col-6 col-md-3 col-lg-2">
                <label for="ruleset-filter" class="form-label">
                  Ruleset
                </label>
                <select id="ruleset-filter" name="ruleset" class="form-select">
                  <option value="srd51" selected={selectedRuleset !== "srd52"}>
                    SRD 5.1
                  </option>
                  <option value="srd52" selected={selectedRuleset === "srd52"}>
                    SRD 5.2
                  </option>
                </select>
              </div>

              <div class="col-6 col-md-3 col-lg-2">
                <label for="size-filter" class="form-label">
                  Size
                </label>
                <select id="size-filter" name="size" class="form-select">
                  <option value="">All Sizes</option>
                  {Sizes.map((size) => (
                    <option value={size} selected={selectedSize === size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div class="col-6 col-md-3 col-lg-2">
                <label for="cr-filter" class="form-label">
                  Max CR
                </label>
                <select id="cr-filter" name="maxCR" class="form-select">
                  <option value="">All CRs</option>
                  {CROptions.map((opt) => (
                    <option value={opt.value} selected={selectedMaxCR === opt.value}>
                      CR {opt.label} and below
                    </option>
                  ))}
                </select>
              </div>

              <div class="col-6 col-md-3 col-lg-2">
                <label for="movement-filter" class="form-label">
                  Movement
                </label>
                <select id="movement-filter" name="movement" class="form-select">
                  <option value="">Any Movement</option>
                  {MovementTypes.map((type) => (
                    <option value={type} selected={selectedMovement === type}>
                      Can {type}
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <BeastsTable
              beasts={beasts}
              sortBy={sortBy}
              sortOrder={sortOrder}
              selectedRuleset={selectedRuleset}
              selectedSize={selectedSize}
              selectedMaxCR={selectedMaxCR}
              selectedMovement={selectedMovement}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Beast Detail Modal */}
      <DetailModal size="lg">{openBeast ? <BeastDetail beast={openBeast} /> : null}</DetailModal>
    </>
  )
}
