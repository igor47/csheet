export interface LoginOtpProps {
  email: string
  redirect?: string
}

export const LoginOtp = ({ email, redirect }: LoginOtpProps) => (
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card shadow-sm mt-5">
          <div class="card-body">
            <h1 class="card-title text-center mb-4">Enter Login Code</h1>
            <p class="text-center text-muted mb-4">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <form method="post" action="/login/otp">
              <input type="hidden" name="email" value={email} />
              {redirect && <input type="hidden" name="redirect" value={redirect} />}
              <div class="mb-3">
                <label for="otp_code" class="form-label">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  class="form-control text-center"
                  id="otp_code"
                  name="otp_code"
                  required
                  maxlength={6}
                  pattern="[0-9]{6}"
                  autocomplete="one-time-code"
                  inputmode="numeric"
                  style="font-size: 24px; letter-spacing: 8px; font-family: monospace;"
                  placeholder="000000"
                  autofocus
                />
                <div class="form-text">Enter the code from your email</div>
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Verify Code
              </button>
            </form>
            <div class="text-center mt-3">
              <a href="/login" class="text-muted">
                <small>Back to login</small>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
