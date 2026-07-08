// Standalone 403 page served by the IP-blocklist middleware.
//
// This runs BEFORE the JSX layout renderer and auth/flash middleware, so it
// cannot use <Layout> (no user, no flash, no DB). Everything is inlined and
// self-contained. The message explains why the request was blocked and points
// a legitimately-stuck visitor to GitHub issues to appeal.

const ISSUES_URL = "https://github.com/igor47/csheet/issues"

export const Blocked = () => (
  <html lang="en">
    <head>
      <title>Request blocked — CSheet</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="noindex" />
      <style>{`
        :root { color-scheme: dark; }
        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #16181d;
          color: #e6e8eb;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
          line-height: 1.6;
        }
        .card {
          max-width: 34rem;
          margin: 1.5rem;
          padding: 2.5rem;
          background: #1e2127;
          border: 1px solid #2c313a;
          border-radius: 12px;
        }
        h1 { margin: 0 0 1rem; font-size: 1.5rem; }
        p { margin: 0 0 1rem; color: #b6bcc6; }
        a { color: #7aa2ff; }
        .muted { font-size: 0.85rem; color: #7d838e; margin-bottom: 0; }
      `}</style>
    </head>
    <body>
      <div class="card">
        <h1>Request blocked</h1>
        <p>
          Your request was blocked because we've seen automated abuse coming from your network
          range. CSheet's login was being used to send unwanted email, so traffic from these ranges
          is currently refused.
        </p>
        <p>
          If you're a real person who landed here by mistake — for example on a VPN or hosting
          provider that shares this range — we're sorry for the trouble. Please open an issue and
          we'll get you unblocked:
        </p>
        <p>
          <a href={ISSUES_URL}>{ISSUES_URL}</a>
        </p>
        <p class="muted">Error 403 · Forbidden</p>
      </div>
    </body>
  </html>
)
