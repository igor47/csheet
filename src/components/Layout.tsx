import { Navbar } from "@src/components/ui/Navbar"
import type { User } from "@src/db/users"
import type { Flash } from "@src/middleware/flash"
import { clsx } from "clsx"
import type { Child } from "hono/jsx"

export interface LayoutProps {
  children?: Child[] | Child
  title?: string
  description?: string
  ogImage?: string
  ogUrl?: string
  user?: User
  currentPage?: string
  flash: Flash
}

export const Layout = ({
  children,
  title = "CSheet",
  description,
  ogImage,
  ogUrl,
  user,
  currentPage,
  flash,
}: LayoutProps) => {
  const flashClass = clsx(
    "alert alert-dismissible fade show",
    flash ? `alert-${flash.level}` : null
  )

  // Default metadata values
  const defaultDescription =
    "Open-source, self-hostable D&D 5e character sheet supporting both 2014 and 2024 rulesets"
  const defaultOgImage = "/static/logo-original.svg"
  const finalDescription = description || defaultDescription
  const finalOgImage = ogImage || defaultOgImage

  return (
    <html lang="en">
      <head>
        <title>{title}</title>

        {/* Standard meta tags */}
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={finalDescription} />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={finalDescription} />
        <meta property="og:type" content="website" />
        {ogUrl && <meta property="og:url" content={ogUrl} />}
        <meta property="og:image" content={finalOgImage} />
        <meta property="og:site_name" content="CSheet" />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={finalDescription} />
        <meta name="twitter:image" content={finalOgImage} />

        {/* favicon stuff */}
        <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />
        <link rel="manifest" href="/static/site.webmanifest" />

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
        <script src="/static/htmx.min.js"></script>
        <script src="/static/htmx-ext-sse.js"></script>
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
