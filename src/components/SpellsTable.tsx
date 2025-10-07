import type { Spell } from "@src/lib/dnd/spells";

export interface SpellsTableProps {
  spells: Spell[];
  sortBy?: string;
  sortOrder?: string;
  selectedClass?: string;
  selectedMaxLevel?: string;
  selectedSchool?: string;
  searchQuery?: string;
}

const SortableHeader = ({
  column,
  label,
  currentSort,
  currentOrder,
  selectedClass,
  selectedMaxLevel,
  selectedSchool,
  searchQuery
}: {
  column: string;
  label: string;
  currentSort?: string;
  currentOrder?: string;
  selectedClass?: string;
  selectedMaxLevel?: string;
  selectedSchool?: string;
  searchQuery?: string;
}) => {
  const isActive = currentSort === column;
  const newOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc';

  // Build URL with sort params, preserving current filters
  const params = new URLSearchParams();
  if (selectedClass) params.set('class', selectedClass);
  if (selectedMaxLevel) params.set('maxLevel', selectedMaxLevel);
  if (selectedSchool) params.set('school', selectedSchool);
  if (searchQuery) params.set('search', searchQuery);
  params.set('sortBy', column);
  params.set('sortOrder', newOrder);

  return (
    <th>
      <button
        type="button"
        class="btn btn-link p-0 text-white text-decoration-none d-flex align-items-center gap-1"
        style="cursor: pointer;"
        hx-get={`/spells?${params.toString()}`}
        hx-target="#spells-table"
        hx-push-url="true"
      >
        {label}
        {isActive && (
          <i class={`bi bi-caret-${currentOrder === 'asc' ? 'up' : 'down'}-fill`}></i>
        )}
      </button>
    </th>
  );
};

export const SpellsTable = ({
  spells,
  sortBy = 'level',
  sortOrder = 'asc',
  selectedClass,
  selectedMaxLevel,
  selectedSchool,
  searchQuery
}: SpellsTableProps) => (
  <div id="spells-table">
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <SortableHeader
            column="name"
            label="Name"
            currentSort={sortBy}
            currentOrder={sortOrder}
            selectedClass={selectedClass}
            selectedMaxLevel={selectedMaxLevel}
            selectedSchool={selectedSchool}
            searchQuery={searchQuery}
          />
          <SortableHeader
            column="level"
            label="Level"
            currentSort={sortBy}
            currentOrder={sortOrder}
            selectedClass={selectedClass}
            selectedMaxLevel={selectedMaxLevel}
            selectedSchool={selectedSchool}
            searchQuery={searchQuery}
          />
          <SortableHeader
            column="school"
            label="School"
            currentSort={sortBy}
            currentOrder={sortOrder}
            selectedClass={selectedClass}
            selectedMaxLevel={selectedMaxLevel}
            selectedSchool={selectedSchool}
            searchQuery={searchQuery}
          />
          <th>Classes</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {spells.length === 0 ? (
          <tr>
            <td colspan={5} class="text-center text-muted">
              No spells match your filters
            </td>
          </tr>
        ) : (
          spells.map(spell => {
            // Build URL with openSpell param, preserving current filters
            const params = new URLSearchParams();
            if (selectedClass) params.set('class', selectedClass);
            if (selectedMaxLevel) params.set('maxLevel', selectedMaxLevel);
            if (selectedSchool) params.set('school', selectedSchool);
            if (searchQuery) params.set('search', searchQuery);
            params.set('sortBy', sortBy);
            params.set('sortOrder', sortOrder);
            params.set('openSpell', spell.id);

            return (
              <tr>
                <td>
                  <button
                    class="btn btn-link p-0 text-start"
                    data-bs-toggle="modal"
                    data-bs-target="#spellModal"
                    hx-get={`/spells/${spell.id}`}
                    hx-target="#spellModalContent"
                    hx-swap="innerHTML"
                    hx-push-url={`/spells?${params.toString()}`}
                  >
                    {spell.name}
                  </button>
                </td>
                <td>{spell.level === 0 ? 'Cantrip' : spell.level}</td>
                <td class="text-capitalize">{spell.school}</td>
                <td>
                  {spell.classes.map((cls, idx) => (
                    <>
                      <span class="text-capitalize">{cls}</span>
                      {idx < spell.classes.length - 1 ? ', ' : ''}
                    </>
                  ))}
                </td>
                <td>{spell.briefDescription}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
