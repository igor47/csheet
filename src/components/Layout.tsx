import { Navbar } from "@src/components/ui/Navbar"
import type { User } from "@src/db/users"
import type { Flash } from "@src/middleware/flash"
import { clsx } from "clsx"
import type { Child } from "hono/jsx"

export interface LayoutProps {
  children?: Child[] | Child
  title?: string
  user?: User
  currentPage?: string
  flash: Flash
}

export const Layout = ({ children, title = "CSheet", user, currentPage, flash }: LayoutProps) => {
  const flashClass = clsx(
    "alert alert-dismissible fade show",
    flash ? `alert-${flash.level}` : null
  )

  return (
    <html lang="en">
      <head>
        <title>{title}</title>

        {/* favicon stuff */}
        <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />
        <link rel="manifest" href="/static/site.webmanifest" />

        {/* bootstrap settings */}
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* dependencies */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB"
          crossorigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <link href="/static/styles.css" rel="stylesheet" />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      </head>
      <body data-bs-theme="dark">
        <Navbar user={user} currentPage={currentPage} />
        {flash ? (
          <div class="container-fluid mt-3" id="messages">
            <div class="row">
              <div class="col-md-8 offset-md-4 col-lg-6 offset-lg-6 col-xl-4 offset-xl-8">
                <div class={flashClass} role="alert">
                  {flash.msg}
                  <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main>{children}</main>

        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI"
          crossorigin="anonymous"
        />
      </body>
    </html>
  )
}
