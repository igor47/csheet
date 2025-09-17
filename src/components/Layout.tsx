export const Layout = ({ children, title = "CSheet" }: { children: any, title?: string }) => (
  <>
    {'<!DOCTYPE html>'}
    <html>
      <head>
        <title>{title}</title>

        <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/static/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/static/favicon-16x16.png" />
        <link rel="manifest" href="/static/site.webmanifest" />


        <link rel="stylesheet" href="/static/styles.css" />
        <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/sheets">Sheets</a>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  </>
)
