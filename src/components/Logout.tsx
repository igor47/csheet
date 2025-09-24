export const Logout = () => (
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm mt-5">
          <div class="card-body text-center">
            <h1 class="card-title mb-4">Logout</h1>
            <p class="mb-4">Are you sure you want to logout?</p>
            <form method="POST" action="/auth/logout" class="d-inline">
              <button type="submit" class="btn btn-danger me-2">
                Logout
              </button>
              <a href="/" class="btn btn-secondary">
                Cancel
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
)