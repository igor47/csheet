
import type { Character as CharacterData } from '@src/db/characters';

type CharacterProps = {
  character: CharacterData;
}

export const Character = ({ character }: CharacterProps) => {
  return (<>
    {/* Content */}
    <div class="container-fluid my-3">
      <div class="row g-3">
        {/* Sidebar (desktop) */}
        <aside class="col-lg-4 col-xl-3 d-none d-lg-block">
          <div class="card sticky-sidebar border-0 shadow-sm">
            <div class="card-body p-0">
              {/* The same accordion panels will be placed here on desktop */}
              <div id="sidebar-panel-host" class="p-3">
                {/* JS moves #panels here when >= lg */}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main class="col-lg-8 col-xl-9">
          {/* On mobile, show panels at the top */}
          <div id="mobile-panel-host" class="d-lg-none">
            <div class="mb-2 d-flex align-items-center justify-content-between">
              <h6 class="mb-0 text-uppercase text-muted">Quick Panels</h6>
              <button class="btn btn-outline-secondary btn-sm" type="button" data-bs-toggle="collapse" data-bs-target=".accordion .collapse">
                Toggle all
              </button>
            </div>
            {/* JS moves #panels here when < lg */}
          </div>

          {/* Notes */}
          <div class="card shadow-sm">
            <div class="card-header bg-white">
              <div class="d-flex align-items-center justify-content-between">
                <h5 class="mb-0">Session Notes</h5>
                <small class="text-muted">Autosave not implemented (demo)</small>
              </div>
            </div>
            <div class="card-body">
              <textarea class="form-control notes-area" placeholder="Write your notes here..."></textarea>
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* Reusable Panels: one DOM, moved between sidebar & mobile host */}
    <div id="panels" class="accordion accordion-flush mx-0">
      {/* Abilities */}
      <div class="accordion-item">
        <h2 class="accordion-header" id="hdr-abilities">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-abilities" aria-expanded="false" aria-controls="col-abilities">
            Abilities & Saves
          </button>
        </h2>
        <div id="col-abilities" class="accordion-collapse collapse" aria-labelledby="hdr-abilities">
          <div class="accordion-body">
            <div class="row row-cols-3 g-2">
              {/* Example stat pill */}
              <div class="col">
                <div class="bg-body border rounded p-2 text-center">
                  <div class="ability-circle bg-secondary-subtle border mb-1">16</div>
                  <div class="fw-medium">STR</div>
                  <div class="text-muted small">Save +5</div>
                </div>
              </div>
              <div class="col">
                <div class="bg-body border rounded p-2 text-center">
                  <div class="ability-circle bg-secondary-subtle border mb-1">14</div>
                  <div class="fw-medium">DEX</div>
                  <div class="text-muted small">Save +2</div>
                </div>
              </div>
              <div class="col">
                <div class="bg-body border rounded p-2 text-center">
                  <div class="ability-circle bg-secondary-subtle border mb-1">12</div>
                  <div class="fw-medium">CON</div>
                  <div class="text-muted small">Save +1</div>
                </div>
              </div>
              <div class="col">
                <div class="bg-body border rounded p-2 text-center">
                  <div class="ability-circle bg-secondary-subtle border mb-1">18</div>
                  <div class="fw-medium">INT</div>
                  <div class="text-muted small">Save +7</div>
                </div>
              </div>
              <div class="col">
                <div class="bg-body border rounded p-2 text-center">
                  <div class="ability-circle bg-secondary-subtle border mb-1">10</div>
                  <div class="fw-medium">WIS</div>
                  <div class="text-muted small">Save +0</div>
                </div>
              </div>
              <div class="col">
                <div class="bg-body border rounded p-2 text-center">
                  <div class="ability-circle bg-secondary-subtle border mb-1">8</div>
                  <div class="fw-medium">CHA</div>
                  <div class="text-muted small">Save -1</div>
                </div>
              </div>
            </div>

            <hr />

            <div class="row g-2">
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Proficiency Bonus</label>
                <input class="form-control form-control-sm" value="+3" />
              </div>
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Initiative</label>
                <input class="form-control form-control-sm" value="+2" />
              </div>
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Armor Class</label>
                <input class="form-control form-control-sm" value="16" />
              </div>
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Speed</label>
                <input class="form-control form-control-sm" value="30 ft." />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Proficiencies */}
      <div class="accordion-item">
        <h2 class="accordion-header" id="hdr-skills">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-skills" aria-expanded="false" aria-controls="col-skills">
            Skills & Proficiencies
          </button>
        </h2>
        <div id="col-skills" class="accordion-collapse collapse" aria-labelledby="hdr-skills">
          <div class="accordion-body">
            <div class="row g-2">
              <div class="col-12 col-md-6">
                <div class="list-group small">
                  <label class="list-group-item d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" checked />
                    Acrobatics (Dex) <span class="ms-auto badge text-bg-secondary">+5</span>
                  </label>
                  <label class="list-group-item d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" />
                    Arcana (Int) <span class="ms-auto badge text-bg-secondary">+7</span>
                  </label>
                  <label class="list-group-item d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" />
                    Perception (Wis) <span class="ms-auto badge text-bg-secondary">+4</span>
                  </label>
                  <label class="list-group-item d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" />
                    Stealth (Dex) <span class="ms-auto badge text-bg-secondary">+4</span>
                  </label>
                </div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small text-muted">Tool & Weapon Proficiencies</label>
                <textarea class="form-control form-control-sm" rows={6}>Longswords, Shortbows, Thieves’ Tools, Herbalism Kit</textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traits & Features */}
      <div class="accordion-item">
        <h2 class="accordion-header" id="hdr-traits">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-traits" aria-expanded="false" aria-controls="col-traits">
            Traits & Features
          </button>
        </h2>
        <div id="col-traits" class="accordion-collapse collapse" aria-labelledby="hdr-traits">
          <div class="accordion-body">
            <ul class="list-group list-group-flush small">
              <li class="list-group-item">
                <div class="fw-semibold">Darkvision</div>
                You can see in dim light within 60 feet as if it were bright light.
              </li>
              <li class="list-group-item">
                <div class="fw-semibold">Fey Ancestry</div>
                Advantage on saving throws against being charmed; magic can’t put you to sleep.
              </li>
              <li class="list-group-item">
                <div class="fw-semibold">Cunning Action</div>
                You can take a bonus action on each of your turns to Dash, Disengage, or Hide.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Spells */}
      <div class="accordion-item">
        <h2 class="accordion-header" id="hdr-spells">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-spells" aria-expanded="false" aria-controls="col-spells">
            Spells
          </button>
        </h2>
        <div id="col-spells" class="accordion-collapse collapse" aria-labelledby="hdr-spells">
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
        </div>
      </div>

      {/* Inventory (example extra section) */}
      <div class="accordion-item">
        <h2 class="accordion-header" id="hdr-inventory">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#col-inventory" aria-expanded="false" aria-controls="col-inventory">
            Inventory
          </button>
        </h2>
        <div id="col-inventory" class="accordion-collapse collapse" aria-labelledby="hdr-inventory">
          <div class="accordion-body">
            <table class="table table-sm align-middle">
              <thead class="table-light">
                <tr><th>Item</th><th>Qty</th><th>Notes</th></tr>
              </thead>
              <tbody>
                <tr><td>Rope (50 ft)</td><td>1</td><td>Hempen</td></tr>
                <tr><td>Rations</td><td>6</td><td>Days</td></tr>
                <tr><td>Healing Potion</td><td>2</td><td>2d4+2</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </>)
}
