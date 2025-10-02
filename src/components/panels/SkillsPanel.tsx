export const SkillsPanel = () => {
  return (
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
          <textarea class="form-control form-control-sm" rows={6}>Longswords, Shortbows, Thieves' Tools, Herbalism Kit</textarea>
        </div>
      </div>
    </div>
  );
}
