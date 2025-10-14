import { SpellDetail } from "@src/components/SpellDetail"
import { SpellsTable } from "@src/components/SpellsTable"
import { ClassNames } from "@src/lib/dnd"
import type { Spell } from "@src/lib/dnd/spells"
import { SpellSchools } from "@src/lib/dnd/spells"

export interface SpellsProps {
  spells: Spell[]
  selectedClass?: string
  selectedMaxLevel?: string
  selectedSchool?: string
  searchQuery?: string
  sortBy?: string
  sortOrder?: string
  openSpell?: Spell
}

export const Spells = ({
  spells,
  selectedClass,
  selectedMaxLevel,
  selectedSchool,
  searchQuery,
  sortBy,
  sortOrder,
  openSpell,
}: SpellsProps) => {
  return (
    <>
      <div class="container-fluid mt-4">
        <div class="row">
          <div class="col-12">
            <h1>Spells</h1>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-12">
            <form
              hx-get="/spells"
              hx-target="#spells-table"
              hx-trigger="input from:#search-filter changed delay:300ms, change from:select"
              hx-push-url="true"
              class="row g-3 mb-4"
            >
              {/* Hidden inputs to preserve sort state */}
              <input type="hidden" name="sortBy" value={sortBy || "level"} />
              <input type="hidden" name="sortOrder" value={sortOrder || "asc"} />

              <div class="col-12 col-lg-5">
                <label for="search-filter" class="form-label">
                  Search
                </label>
                <input
                  type="text"
                  id="search-filter"
                  name="search"
                  class="form-control"
                  placeholder="Search spell names and descriptions..."
                  value={searchQuery || ""}
                />
              </div>

              <div class="col-12 col-md-4 col-lg-3">
                <label for="class-filter" class="form-label">
                  Class
                </label>
                <select
                  id="class-filter"
                  name="class"
                  class="form-select"
                  value={selectedClass || ""}
                >
                  <option value="">All Classes</option>
                  {ClassNames.map((cls) => (
                    <option value={cls} selected={selectedClass === cls}>
                      <span class="text-capitalize">{cls}</span>
                    </option>
                  ))}
                </select>
              </div>

              <div class="col-12 col-md-4 col-lg-2">
                <label for="level-filter" class="form-label">
                  Max Level
                </label>
                <select
                  id="level-filter"
                  name="maxLevel"
                  class="form-select"
                  value={selectedMaxLevel || ""}
                >
                  <option value="">All Levels</option>
                  <option value="0" selected={selectedMaxLevel === "0"}>
                    Cantrips
                  </option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                    <option
                      value={level.toString()}
                      selected={selectedMaxLevel === level.toString()}
                    >
                      Level {level} and below
                    </option>
                  ))}
                </select>
              </div>

              <div class="col-12 col-md-4 col-lg-2">
                <label for="school-filter" class="form-label">
                  School
                </label>
                <select
                  id="school-filter"
                  name="school"
                  class="form-select"
                  value={selectedSchool || ""}
                >
                  <option value="">All Schools</option>
                  {SpellSchools.map((school) => (
                    <option value={school} selected={selectedSchool === school}>
                      <span class="text-capitalize">{school}</span>
                    </option>
                  ))}
                </select>
              </div>
            </form>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <SpellsTable
              spells={spells}
              sortBy={sortBy}
              sortOrder={sortOrder}
              selectedClass={selectedClass}
              selectedMaxLevel={selectedMaxLevel}
              selectedSchool={selectedSchool}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Spell Detail Modal */}
      <div class="modal fade" id="spellModal" tabindex={-1} aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content" id="spellModalContent">
            {openSpell ? <SpellDetail spell={openSpell} /> : null}
          </div>
        </div>
      </div>

      {/* Character-specific scripts */}
      <script src="/static/spells.js"></script>
    </>
  )
}
