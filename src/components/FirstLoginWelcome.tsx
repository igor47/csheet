export interface FirstLoginWelcomeProps {
  redirect?: string
}

export const FirstLoginWelcome = ({ redirect }: FirstLoginWelcomeProps) => (
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
        <div class="card shadow-sm mt-4">
          <div class="card-body">
            <h1 class="card-title text-center mb-4">Welcome to CSheet!</h1>

            <p>
              Hey there! I'm <a href="https://igor.moomers.org">Igor</a>, and I built CSheet to make managing D&D character sheets easier
              and more fun. Thanks for giving it a try!
            </p>

            <p>
              CSheet is a work in progress, and I'd love your feedback. If you run into any issues
              or have ideas for improvements, please let me know on{" "}
              <a href="https://github.com/igor47/csheet/issues" target="_blank" rel="noopener">
                GitHub
              </a>
              .
            </p>

            <hr class="my-4" />

            <form method="post" action="/welcome">
              {redirect && <input type="hidden" name="redirect" value={redirect} />}

              <div class="mb-4">
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="marketing_opt_in"
                    name="marketing_opt_in"
                    value="on"
                    checked
                  />
                  <label class="form-check-label" for="marketing_opt_in">
                    Send me product updates and feedback requests
                  </label>
                </div>
                <div class="form-text">
                  I'll occasionally email you about new features and ask for your feedback. You can
                  unsubscribe at any time, and I'll never share your email with anyone.
                </div>
              </div>

              <button type="submit" class="btn btn-primary w-100">
                Proceed to CSheet
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
)
