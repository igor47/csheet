import clsx from "clsx"

export interface CampaignNewProps {
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const CampaignNew = ({ values = {}, errors = {} }: CampaignNewProps) => {
  return (
    <div class="container" id="campaign-new" style="overflow-anchor: none;">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow-sm">
            <div class="card-body">
              <h1 class="card-title mb-4">Create New Campaign</h1>
              <form
                hx-post="/campaigns/new"
                hx-vals='{"is_check": "true"}'
                hx-trigger="change"
                hx-target="#campaign-new"
                hx-swap="morph:outerHTML focus-scroll:false"
                hx-ext="morph"
                class="needs-validation"
                novalidate
              >
                <div class="mb-3">
                  <label for="name" class="form-label">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    class={clsx("form-control", { "is-invalid": errors?.name })}
                    id="name"
                    name="name"
                    value={values?.name || ""}
                    required
                    placeholder="Enter campaign name"
                  />
                  {errors?.name && <div class="invalid-feedback d-block">{errors.name}</div>}
                  <div class="form-text">Choose a memorable name for your campaign</div>
                </div>

                <div class="mb-3">
                  <label for="description" class="form-label">
                    Description (Optional)
                  </label>
                  <textarea
                    class={clsx("form-control", { "is-invalid": errors?.description })}
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Describe your campaign"
                    value={values?.description || ""}
                  />
                  {errors?.description && (
                    <div class="invalid-feedback d-block">{errors.description}</div>
                  )}
                  <div class="form-text">
                    Add a brief description of your campaign setting or story
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button
                    type="submit"
                    id="campaign-new-submit"
                    hx-post="/campaigns/new"
                    hx-vals='{"is_check": "false"}'
                    hx-sync="closest form:replace"
                    hx-ext="morph"
                    class="btn btn-primary"
                  >
                    Create Campaign
                  </button>
                  <a href="/campaigns" class="btn btn-secondary">
                    Cancel
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
