export interface LoginProps {
  redirect?: string;
}

export const Login = ({ redirect }: LoginProps) => (
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm mt-5">
          <div class="card-body">
            <h1 class="card-title text-center mb-4">Login</h1>
            <form method="post" action="/login">
              {redirect && (
                <input type="hidden" name="redirect" value={redirect} />
              )}
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  name="email"
                  required
                />
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
)
