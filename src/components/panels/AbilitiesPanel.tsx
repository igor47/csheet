export const AbilitiesPanel = () => {
  return (
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
  );
}
