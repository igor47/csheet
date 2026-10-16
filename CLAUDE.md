# csheet

D&D 5e character sheet: Bun, Hono JSX, HTMX, Bootstrap 5, PostgreSQL via `Bun.sql`, Zod. Supports
the SRD 5.1 (2014) and SRD 5.2.1 (2024) rulesets. Reed, the chat assistant, edits characters through
approved tool calls. Deployed to Cloud Run. Most changes are made by agents; the maintainer reviews.

## Commands

Everything runs through mise tasks, which set up the environment and databases; `mise tasks` lists
them all. The common ones:

```bash
mise run app:dev            # dev server on :3000 (starts postgres + minio in Docker)
mise run db:upgrade         # apply migrations; mise run dbmate new <name> creates one
mise run check              # Biome + tsc; check-fix to auto-fix
mise run test [path] [--test-name-pattern "..."]   # integration tests (own DB, migrated each run)
mise run eval               # Reed's eval suite against the live API (not part of test/CI)
mise run utils:backfill-*   # one-off scripts, run by hand after a deploy
mise run workspace:add <n>  # a sibling workspace with its own DBs and port, to work beside other agents
```

Bun, not Node: `bun <file>`, `bun install`, `Bun.sql`, `Bun.file`, `Bun.$`; but tests through
`mise run test`, never bare `bun test`. No `pg`, `ioredis`, `ws`, `dotenv`, `execa`. Lint rules: no
`*` imports, `import type` for types, `logger` from `src/lib/logger.ts` instead of `console`.
Secrets are in `mise.local.toml`, not `.env`.

## Docs

Read the one for the area you're changing before you start:

- [docs/architecture.md](docs/architecture.md): layers, what imports what, request flow, config.
- [docs/data-model.md](docs/data-model.md): the character tables (ledger vs state), what is
  stored vs computed, `computeCharacter`, rulesets vs catalogs, migrations. Before any schema change.
- [docs/write-path.md](docs/write-path.md): the shape of a service, validation and `is_check`,
  transactions and locking, authorization, exposing a service as a Reed tool. Before any new write.
- [docs/htmx-ui.md](docs/htmx-ui.md): panels, the detail modal, `ModalForm`, OOB swaps, history
  modals, the hygiene checklist. Before any component or route that renders.
- [docs/reed.md](docs/reed.md): chat storage, the tool-call loop, approvals, evals.
- [docs/testing.md](docs/testing.md): `useTestApp`, factories, HTTP helpers, what to test.
- [docs/deploy.md](docs/deploy.md): releases, backfills, production access, CI.
- [docs/agentic-workflow.md](docs/agentic-workflow.md): design checkpoint, report format, review
  checklist, repo mechanics, parallel workspaces. Read it once at the start of any task.
- [docs/plans/](docs/plans/): dated plans for changes that are decided but not made, each tied to
  issues. Check the latest before building near the write path, `computeCharacter`, or the panel
  re-render code.

## Rules

Each rule has a reason; if the reason doesn't apply to your task, raise it, don't work around it.

1. **Everything a character gains or chooses is written to its history table when it happens**
   (creation, level-up, import). Existing characters get a one-off backfill script in `utils/`.
   Never derive grants from ruleset data at read time; pure formulas and tables (proficiency bonus,
   slot tables, hit die size) are computed. *The sheet must survive ruleset changes, and the history
   is the product.*
2. **Nothing writes to the database on a read path.** `computeCharacter`, `authorize*`, history
   routes and read-only tools only read. *Reads run before authorization and concurrently.*
3. **History tables are ledgers by default**: append-only, folded in `id` order, never `UPDATE`d.
   State tables are the documented exceptions. *Undo and audit depend on it.*
4. **Writes go through one service** taking `(db, char, formData)` and returning a `ServiceResult`;
   forms and Reed's tools share it. Multi-row writes run in `beginOrSavepoint`; writes that depend on
   current values use `withLockedCharacter`. *One validation path; no races between Reed and the
   sheet.*
5. **Everything rules-related is keyed by the character's ruleset.** Catalog ids are stable forever;
   remap with a migration if one must change. *Characters reference them.*
6. **Routes authorize first**, with `authorizeCharacter`/`authorizeCharacterView`, then call a
   service, then render. No business logic in routes or components.
7. **Tests are integration tests through HTTP**, using `useTestApp`, factories and the HTTP helpers.
8. **One-off scripts stay simple**: idempotent, a log line per character, `--prod`; no locks or
   dry-run flags.
9. **Follow-ups become GitHub issues**, not TODOs or notes in a report. Rules-coverage work goes
   under #114.
10. **Stop and write a plan** before a new table or column, a new shared helper or pattern, a change
    to a shared helper, or a deviation from these docs. See the design checkpoint in
    [docs/agentic-workflow.md](docs/agentic-workflow.md).
11. **Procedures become mise tasks.** If you would write steps for someone to follow (set up a
    workspace, run a backfill, regenerate a catalog), write a task in `mise.toml` instead, with the
    script in `bin/` or `utils/` if it is long, and document the task name. *A task runs the same way
    every time; a procedure is followed differently by every reader, and the doc rots.*

## Repo

Git, hosted on GitHub. `main` is protected: a PR with green Lint and Test, linear history, merged by
fast-forwarding `main` to the PR's commits rather than GitHub's merge button. Commit subjects are
`area: what changed` in the imperative; the body says why, for a human. Push and open PRs only when
asked. Other agents may be working in sibling workspaces on this machine with their own ports and
databases: browse your server at `127.0.0.1:<port>`, and don't stop processes you didn't start. The
maintainer's checkouts are jj workspaces; if `jj root` succeeds in yours, the `csheet-jj` skill in
`.claude/skills/` covers what that changes (gh without `.git`, pushing, workspaces).
