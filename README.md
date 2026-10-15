# CSheet

A D&D 5th Edition character sheet. Use it at **[www.csheet.net](https://www.csheet.net)** or host
it yourself. It supports the 2014 rules (SRD 5.1) and the 2024 rules (SRD 5.2.1), and comes with
Reed, a chat assistant that edits your character when you approve its changes.

## About CSheet

CSheet is an open-source, self-hostable character sheet for D&D 5th Edition, with both the 2014
(SRD 5.1) and 2024 (SRD 5.2.1) rules.

**What CSheet is:**
- A companion for managing your character between and during sessions
- Tracking for ability scores, skills, proficiencies, hit points and hit dice, spells and slots,
  items and coins, Wild Shape, death saves, session notes, and progression
- A history of every change, each with a note saying why, so a sheet can show how it got where it is
- Open-source software you can run on your own server
- Designed for use alongside traditional tabletop play

**What CSheet is not:**
- A virtual tabletop (VTT) platform
- A dice rolling simulator
- A replacement for sitting at the table with your friends

CSheet is designed to help you track your character while you roll your own physical dice and
engage with your fellow players around the table (or video call).

## Contributing

Contributions are welcome. On the [issue tracker](https://github.com/igor47/csheet/issues), issues
labelled `good first issue` and `small` are self-contained fixes; `help wanted` marks larger pieces
nobody is working on. For anything bigger than a small fix, open or comment on an issue first so the
design can be talked through before the code.

### Setting up

The project uses [mise](https://mise.jdx.dev/) for tools and tasks, [Bun](https://bun.sh/) as the
runtime, and Docker for PostgreSQL and MinIO.

```bash
mise install          # bun, dbmate, jq, …
mise run install      # dependencies
mise run deps:up      # postgres + minio in Docker
mise run db:upgrade   # apply migrations
mise run app:dev      # dev server with reload on http://localhost:3000
```

```bash
mise run test         # integration tests, in their own database
mise run check        # lint, format and types; check-fix to auto-fix
mise run dbmate new <name>   # a new migration
mise tasks            # everything else
```

Log in with any email address: with no SMTP server
configured, the login code is printed to the console. Local secrets and overrides go in
`mise.local.toml` (gitignored) under `[env]`; Reed needs `ANTHROPIC_API_KEY` and is hidden without
one.

### How the code is organized

Server-rendered [Hono](https://hono.dev/) JSX with [htmx](https://htmx.org/) for partial updates,
Bootstrap 5, PostgreSQL through `Bun.sql`, Zod for validation. A character is a row plus
append-only history tables, and the sheet is computed from that history. Read the doc for the area
you are touching:

- [docs/architecture.md](docs/architecture.md): layers and the request flow
- [docs/data-model.md](docs/data-model.md): the character tables, stored vs computed, rulesets and catalogs
- [docs/write-path.md](docs/write-path.md): services, validation, Reed's tools
- [docs/htmx-ui.md](docs/htmx-ui.md): panels, the detail modal, HTMX conventions
- [docs/reed.md](docs/reed.md): the chat assistant and its evals
- [docs/testing.md](docs/testing.md): how tests are written
- [docs/deploy.md](docs/deploy.md): releases and operations
- [docs/plans/](docs/plans/): changes that are decided but not yet made

Most of the code here is written by coding agents and reviewed by the maintainer. [CLAUDE.md](CLAUDE.md)
is the short set of rules they work from and [docs/agentic-workflow.md](docs/agentic-workflow.md) is
how they are expected to work; both apply to people too.

### Pull requests

`main` is protected: a PR needs green Lint and Test (`mise run check` and `mise run test`) and is
fast-forwarded onto `main`, so keep the history linear. Commit subjects read `area: what changed`;
the body says why. Follow-up work goes in issues, not TODOs.

## Rulesets

A character belongs to a ruleset, `srd51` or `srd52`, which decides its species, classes,
backgrounds, spell lists and tables. Rules are code in `src/lib/dnd/`; catalogs (spells, beasts,
item templates) are per-ruleset data generated from the SRD text vendored in `refdocs/`, which also
carries the attribution. Only SRD content is included. Custom rulesets are tracked in
[#76](https://github.com/igor47/csheet/issues/76).

## Self-hosting

The `Dockerfile` builds the app; `mise run app:container` runs it with the local compose stack
(`docker compose --profile app down` stops it). Configuration is environment variables, read in
`src/config.ts` with development defaults. The ones a deployment sets:

| Variable | Purpose |
|---|---|
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | the database |
| `COOKIE_SECRET` | signs the session cookie |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` | avatar uploads, any S3-compatible store |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | login emails; without a host, codes are logged instead |
| `ALTCHA_HMAC_KEY` | the proof-of-work challenge on the login form |
| `ANTHROPIC_API_KEY`, `AI_MODEL_NAME` | Reed; without a key the chat is hidden |
| `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `RESEND_WEBHOOK_SECRET` | optional marketing-email sync |
| `SHOW_WELCOME_PAGE` | welcome page on first login, default `true` |

Migrations run with `dbmate migrate` against the same variables. The production deployment (Cloud
Run, Pulumi) is described in [docs/deploy.md](docs/deploy.md).

## License

[Functional Source License 1.1, MIT Future License](LICENSE.md). SRD content is used under the
Creative Commons Attribution 4.0 license; see [refdocs/README.md](refdocs/README.md).
