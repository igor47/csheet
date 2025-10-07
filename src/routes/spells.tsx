import { Hono } from 'hono';
import { Spells } from '@src/components/Spells';
import { SpellsTable } from '@src/components/SpellsTable';
import { SpellDetail } from '@src/components/SpellDetail';
import { spells } from '@src/lib/dnd/spells';
import type { ClassNameType } from '@src/lib/dnd';
import type { SpellSchoolType } from '@src/lib/dnd/spells';

export const spellsRoutes = new Hono();

spellsRoutes.get('/spells', async (c) => {
  // Parse query parameters
  const classFilter = c.req.query('class') as ClassNameType | undefined;
  const maxLevelStr = c.req.query('maxLevel');
  const maxLevel = maxLevelStr ? parseInt(maxLevelStr, 10) : undefined;
  const schoolFilter = c.req.query('school') as SpellSchoolType | undefined;
  const searchQuery = c.req.query('search');
  const sortBy = c.req.query('sortBy') || 'level';
  const sortOrder = c.req.query('sortOrder') || 'asc';
  const openSpellId = c.req.query('openSpell');

  // Filter spells
  let filteredSpells = [...spells];

  if (classFilter) {
    filteredSpells = filteredSpells.filter(spell =>
      spell.classes.includes(classFilter)
    );
  }

  if (maxLevel !== undefined && !isNaN(maxLevel)) {
    filteredSpells = filteredSpells.filter(spell => spell.level <= maxLevel);
  }

  if (schoolFilter) {
    filteredSpells = filteredSpells.filter(spell => spell.school === schoolFilter);
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase();
    filteredSpells = filteredSpells.filter(spell =>
      spell.name.toLowerCase().includes(query) ||
      spell.description.toLowerCase().includes(query) ||
      spell.briefDescription.toLowerCase().includes(query)
    );
  }

  // Sort spells
  filteredSpells.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'level':
        comparison = a.level - b.level;
        break;
      case 'school':
        comparison = a.school.localeCompare(b.school);
        break;
      default:
        comparison = a.level - b.level;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Check if this is an HTMX request
  const isHtmxRequest = c.req.header('HX-Request') === 'true';

  if (isHtmxRequest) {
    // Return only the table for HTMX updates
    return c.html(
      <SpellsTable
        spells={filteredSpells}
        sortBy={sortBy}
        sortOrder={sortOrder}
        selectedClass={classFilter}
        selectedMaxLevel={maxLevelStr}
        selectedSchool={schoolFilter}
        searchQuery={searchQuery}
      />
    );
  }

  // Find spell to open if openSpell param is present
  const openSpell = openSpellId ? spells.find(s => s.id === openSpellId) : undefined;

  // Return full page for initial load
  return c.render(
    <Spells
      spells={filteredSpells}
      selectedClass={classFilter}
      selectedMaxLevel={maxLevelStr}
      selectedSchool={schoolFilter}
      searchQuery={searchQuery}
      sortBy={sortBy}
      sortOrder={sortOrder}
      openSpell={openSpell}
    />,
    { title: 'Spells' }
  );
});

spellsRoutes.get('/spells/:id', async (c) => {
  const spellId = c.req.param('id');
  const isHtmxRequest = c.req.header('HX-Request') === 'true';

  // If not HTMX, redirect to /spells?openSpell=:id
  if (!isHtmxRequest) {
    return c.redirect(`/spells?openSpell=${spellId}`);
  }

  // Find spell by ID
  const spell = spells.find(s => s.id === spellId);

  if (!spell) {
    return c.html(
      <>
        <div class="modal-header">
          <h5 class="modal-title">Spell Not Found</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">
            The spell with ID "{spellId}" could not be found.
          </div>
        </div>
      </>
    );
  }

  return c.html(<SpellDetail spell={spell} />);
});
