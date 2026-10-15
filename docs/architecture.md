# Architecture

How a request moves through csheet, and what each directory is for. Read this before adding a
route, service, or table.

## Stack

Bun runtime, Hono with JSX server rendering, HTMX for partial page updates, Bootstrap 5 (dark
theme), PostgreSQL 16 via `Bun.sql`, Zod for every schema. The AI assistant (Reed) uses the Vercel
AI SDK with Anthropic models. Deployed to Google Cloud Run; see [deploy.md](deploy.md).

## Layers

```
src/
  app.ts            createApp(db?): middleware, jsx renderer, route registration
  middleware.ts     applyMiddleware: request logging, IP blocklist, auth, notifications, flash, htmx
  middleware/       one file per middleware; auth.ts sets c.var.user and exports requireAuth
  routes/           Hono routers: parse the request, authorize, call a service, render
  services/         one file per operation on a character (updateHitPoints, shortRest, …)
                    plus computeCharacter and friends, authorize.ts, toolExecution.ts
  db/               one module per table: Zod row schema, create/find*/current* functions
  components/       JSX. panels/ are the sheet's cards; ui/ are shared widgets; the rest are
                    pages, edit forms (*EditForm, *Form) and history modals (*History)
  lib/              pure code with no DB access: formSchemas, formErrors, serviceResult, ids
    dnd.ts, dnd/    rules, rulesets (srd51.ts, srd52.ts) and catalogs (spells/, beasts/, itemTemplates/)
    srd/            reading the vendored SRD markdown in refdocs/ (rules browser, read_rule tool)
  ai/               Reed's chat loop (chat.ts) and system prompt (prompts.ts)
  tools.ts          registry of Reed's tools, built from the services' tool exports
  test/             useTestApp, HTTP helpers, fishery factories
utils/              one-off scripts run by hand (backfills, catalog generators)
migrations/         dbmate; db/schema.sql is generated
refdocs/            SRD 5.1 and 5.2.1 as PDF and vendored markdown; the source of truth for rules
evals/              Reed's eval suite (calls the live API; not part of `mise run test`)
```

### What may import what

- `routes` → `services`, `components`, `db` (reads for history modals), `middleware`, `lib`
- `services` → `db`, `lib`, other `services`. Never `components` or Hono's `Context`, with one
  exception: `authorize.ts` takes the context because it reads `c.var.user`.
- `db` → `lib` only. A `db` module knows one table. Cross-table reads live in services.
- `components` → `lib`, types from `services`/`db`. Components never query.
- `lib` → nothing above it, apart from type imports. One exception today: `lib/altcha.ts` reads
  `db/altcha_solutions` and belongs in `services`. `lib/dnd` has no DB access.

## Request flow for a character write

1. Route parses params and `c.req.parseBody()`.
2. `authorizeCharacter(c, id)` (`services/authorize.ts`) checks the user, loads the character with
   `computeCharacter`, and checks ownership. Routes return `handleUnallowed(c, reason)` on failure.
   `authorizeCharacterView` adds campaign DMs (read-only) and `authorizeCharacterLightbox` adds
   party members.
3. The route calls one service: `updateHitPoints(getDb(c), char, body)`. Services take `(db, char,
   data)` and return a `ServiceResult` (see [write-path.md](write-path.md)).
4. On `complete: false` the route re-renders the form with `values` and `errors`.
5. On `complete: true` the route recomputes the character and renders the panels that changed as
   out-of-band swaps (see [htmx-ui.md](htmx-ui.md)).

Reed's tool calls run the same services through `tools.ts` and `services/toolExecution.ts`; see
[reed.md](reed.md).

## Database access

`getDb(c)` returns the app's `SQL` instance, or the one a test injected via `createApp(db)`. Services
and db modules take `db: SQL` as their first argument so tests and transactions can pass their own.
`beginOrSavepoint(db, fn)` (`src/db.ts`) opens a transaction, or a savepoint when already inside one
(including the tests' per-test transaction).

Ids are ULIDs from `lib/ids.ts` (`monotonicFactory`), so they sort in creation order. History rows
are ordered by `id`, not `created_at`: `created_at` is `CURRENT_TIMESTAMP`, the start of the
transaction, so rows written in one transaction tie.

## Configuration

`src/config.ts` reads every environment variable with a development default; `bun src/config.ts`
prints the resolved config and the mise tasks use that. Local secrets live in `mise.local.toml`
(gitignored), not `.env`; run anything that needs them through `mise run` or `mise exec --`.
Feature flags are derived: `isAiEnabled()` is "an Anthropic key is set", `isSmtpConfigured()` is "an
SMTP host is set" (without one, dev login codes are printed instead of emailed).

## Logging

`lib/logger.ts`: `logger.info/warn/error(message, [error], context)`. Human-readable in development,
JSON for Cloud Logging in production. Request logging and the global error handler are automatic.
Don't use `console.*` in `src/`.
