import type { User } from "@src/db/users"
import clsx from "clsx"

export interface ProfileProps {
  user: User
  values?: Record<string, string>
  errors?: Record<string, string>
}

export const Profile = ({ user, values = {}, errors = {} }: ProfileProps) => {
  const nameValue = values.name ?? user.name ?? ""

  return (
    <div class="container" id="profile-page">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow-sm mt-4">
            <div class="card-body">
              <h1 class="card-title text-center mb-4">Profile</h1>

              <form
                id="profile-form"
                hx-post="/profile"
                hx-target="#profile-page"
                hx-swap="outerHTML"
              >
                {errors.general && (
                  <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    {errors.general}
                  </div>
                )}

                {/* Avatar placeholder */}
                <div class="text-center mb-4">
                  <div class="d-inline-block" style="width: 120px;">
                    <div class="ratio ratio-1x1">
                      <img
                        src="/static/placeholder-person.png"
                        alt="Avatar placeholder"
                        class="rounded"
                        style="object-fit: cover;"
                      />
                    </div>
                  </div>
                </div>

                {/* Name field */}
                <div class="mb-3">
                  <label for="name" class="form-label">
                    Display Name
                  </label>
                  <input
                    type="text"
                    class={clsx("form-control", { "is-invalid": errors.name })}
                    id="name"
                    name="name"
                    value={nameValue}
                    placeholder="Enter your display name"
                  />
                  {errors.name && <div class="invalid-feedback d-block">{errors.name}</div>}
                  {!errors.name && (
                    <div class="form-text">
                      This name will be shown to other users instead of your email.
                    </div>
                  )}
                </div>

                {/* Email field (readonly) */}
                <div class="mb-3">
                  <label for="email" class="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    value={user.email}
                    readonly
                    disabled
                  />
                  <div class="form-text">Email cannot be changed.</div>
                </div>

                {/* Marketing emails opt-in */}
                <div class="mb-4">
                  <div class="form-check">
                    <input
                      type="checkbox"
                      class="form-check-input"
                      id="marketing_opt_in"
                      name="marketing_opt_in"
                      value="on"
                      checked={
                        values.marketing_opt_in
                          ? values.marketing_opt_in === "on"
                          : user.marketing_opt_in
                      }
                    />
                    <label class="form-check-label" for="marketing_opt_in">
                      Send me product updates and feedback requests
                    </label>
                  </div>
                  <div class="form-text">
                    I'll occasionally email you about new features and ask for your feedback. You
                    can unsubscribe at any time, and I'll never share your email with anyone.
                  </div>
                </div>

                <button type="submit" class="btn btn-primary w-100">
                  <i class="bi bi-save me-2"></i>
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
