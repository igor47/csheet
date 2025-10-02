export const SpellsPanel = () => {
  return (
    <div class="accordion-body">
      {/* Spellcasting header */}
      <div class="row g-2 mb-3">
        <div class="col-4">
          <label class="form-label small text-muted mb-1">Spell Mod</label>
          <input class="form-control form-control-sm" value="+7" />
        </div>
        <div class="col-4">
          <label class="form-label small text-muted mb-1">Spell Save DC</label>
          <input class="form-control form-control-sm" value="15" />
        </div>
        <div class="col-4">
          <label class="form-label small text-muted mb-1">Attack Bonus</label>
          <input class="form-control form-control-sm" value="+7" />
        </div>
      </div>

      {/* Spell slots */}
      <div class="mb-3">
        <label class="form-label small text-muted">Level 1 Slots</label>
        <div class="progress">
          <div class="progress-bar" style="width: 50%">2 / 4</div>
        </div>
      </div>

      {/* Tabs for spell levels */}
      <ul class="nav nav-tabs small" id="spellTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#cantrips" type="button" role="tab">Cantrips</button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" data-bs-toggle="tab" data-bs-target="#lvl1" type="button" role="tab">Level 1</button>
        </li>
      </ul>
      <div class="tab-content border border-top-0 rounded-bottom p-3 small">
        <div class="tab-pane fade show active" id="cantrips" role="tabpanel">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="c1" />
            <label class="form-check-label" for="c1">Mage Hand</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="c2" />
            <label class="form-check-label" for="c2">Minor Illusion</label>
          </div>
        </div>
        <div class="tab-pane fade" id="lvl1" role="tabpanel">
          <div class="list-group">
            <label class="list-group-item d-flex align-items-start">
              <input class="form-check-input me-2 mt-1" type="checkbox" />
              <div>
                <div class="fw-semibold">Shield</div>
                <div class="text-muted small">+5 AC until start of your next turn.</div>
              </div>
              <span class="badge text-bg-primary ms-auto">Reaction</span>
            </label>
            <label class="list-group-item d-flex align-items-start">
              <input class="form-check-input me-2 mt-1" type="checkbox" />
              <div>
                <div class="fw-semibold">Faerie Fire</div>
                <div class="text-muted small">Creatures outlined in light; attacks have advantage.</div>
              </div>
              <span class="badge text-bg-secondary ms-auto">Action</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
