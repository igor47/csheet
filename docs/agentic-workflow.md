# Working on csheet as an agent

Most work on csheet is done by coding agents, often several at once in parallel workspaces, with
the maintainer reviewing PRs. The architecture stays coherent because agents follow the docs and
reviewers check against them. This file is the process; the rules are in the other docs.

## Design checkpoint

Stop and write a short plan **before coding** when the issue needs any of:

- a new table or column;
- a new cross-cutting pattern, helper, or abstraction (anything other services or routes would
  call);
- a change to a shared helper (`computeCharacter`, `authorize`, `beginOrSavepoint`,
  `withLockedCharacter`, `ModalForm`, `registerTool`, the factories);
- deviating from anything stated in `CLAUDE.md` or `docs/`.

The plan is a few lines in the issue (or the PR description if the PR is already open):

```
Schema: <tables/columns, ledger or state, fold>
Writes: <which service(s), inside which transaction/lock>
Reuses: <the existing pattern this follows, with a file as the example>
Deviates: <anything that doesn't follow the docs, and why>
Backfill: <needed? what the script does>
```

If a documented rule seems wrong for the task, say so in `Deviates` and wait for an answer rather
than building the deviation. Rules exist mostly for reasons that aren't visible from the code.

## Filling gaps

When the docs don't cover something, look for the pattern in the code first (two or three existing
examples beat a reasonable-sounding default). If there isn't one, pick the simplest option, note it
in the final report's Decisions, and don't generalize it beyond the task.

Follow-up work becomes a GitHub issue (check for duplicates), not a TODO comment or a note in a
report. Rules-coverage work (features of the SRD the sheet doesn't track yet) goes under #114.

## Final report

Keep it short; the reviewer reads the diff. Include:

- **Decisions**: only precedent-setting choices, each tied to a rule in the docs or flagged as new.
  About a dozen is the most a reviewer can act on; one or two is normal.
- **Checks**: `mise run check` and `mise run test` output (pass/fail, not the full log).
- **Click-through**: the steps to see the change in a browser, for a UI change.
- **Issues filed** for follow-ups.
- The PR body, in the same voice as the commit messages: what changed and why, for a human.

## Review checklist

For an adversarial review of a branch, in order:

1. **Correctness**: races, transaction boundaries, validation gaps, HTML/HTMX hygiene
   ([htmx-ui.md](htmx-ui.md#hygiene-checklist)), tests that would pass with the feature removed.
2. **Conformance**: every rule in `CLAUDE.md` and the relevant doc. A deviation is a finding even if
   the code is good; it is not approved by default, it is raised to the maintainer.
3. **Precedent**: does the PR introduce a pattern others will copy? If so, is it in Decisions, and
   is it the right one?
4. **Scope**: did it do more than the issue asked?

## Repo mechanics

- The repo is git on GitHub. The maintainer's checkouts are jj workspaces; if `jj root` succeeds in
  yours, the `csheet-jj` skill in `.claude/skills/` has what that changes (gh without `.git`,
  pushing, sibling workspaces).
- **Commits**: one change per task, described up front and refined at the end. Subject line
  `area: what changed` in the imperative (`reed: run tool calls in order`); the body says why, for a
  human.
- **Pushing and PRs** happen when asked. `main` is protected: PR with green Lint and Test, linear
  history, no force pushes; it is merged by fast-forwarding `main` to the PR's commits, not by
  GitHub's merge button.
- **Releases** deploy; see [deploy.md](deploy.md).

## Parallel workspaces

Several agents work on one machine at once, each in its own workspace:

```bash
mise run workspace:add 119      # ../csheet-i119 on trunk: own databases, port 3119, shared postgres/minio
mise run workspace:rm 119       # once the work has landed
```

The task installs dependencies, copies `mise.local.toml` (secrets) and appends the workspace's env,
so `mise run app:dev` and `mise run test` there don't collide with anyone else's. When sharing the
machine:

- Browse your server at `127.0.0.1:<port>`, not `localhost`: cookies are shared across localhost
  ports, so logging in on one port logs out the session on another. Dev login is instant (no SMTP:
  the code is printed), and the ALTCHA challenge solves itself.
- Don't stop processes you didn't start; another workspace's dev server or test run owns them.
- Secrets (`ANTHROPIC_API_KEY`) are in `mise.local.toml`; run scripts that need them through
  `mise exec -- bun …`. Don't print them.
