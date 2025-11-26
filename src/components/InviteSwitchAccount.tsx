export interface InviteSwitchAccountProps {
  currentEmail: string
  inviteEmail: string
  token: string
}

export const InviteSwitchAccount = ({
  currentEmail,
  inviteEmail,
  token,
}: InviteSwitchAccountProps) => {
  // Build redirect URL with proper encoding
  const redirectUrl = `/invite/view?token=${encodeURIComponent(token)}`
  const switchUrl = `/logout?redirect=${encodeURIComponent(redirectUrl)}`

  return (
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow-sm mt-5">
            <div class="card-body">
              <h1 class="card-title text-center mb-4">Switch Account?</h1>
              <p class="text-center">
                You're logged in as <strong>{currentEmail}</strong>
              </p>
              <p class="text-center">
                This invite is for <strong>{inviteEmail}</strong>
              </p>
              <div class="d-grid gap-2 mt-4">
                <a href={switchUrl} class="btn btn-primary">
                  Switch to {inviteEmail}
                </a>
                <a href="/campaigns" class="btn btn-secondary">
                  Stay as {currentEmail}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
