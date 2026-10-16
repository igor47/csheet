---
name: csheet-jj
description: Version control in a csheet checkout that is a jj workspace (`jj root` succeeds). Covers running gh without a .git directory, pushing with the maintainer's YubiKey, how main is merged, sibling agent workspaces, and the schema.sql churn from dbmate. Use before any jj, gh, push, or workspace action in this repo; generic jj usage is not covered here.
---

# jj in csheet

The repo is git on GitHub, but the maintainer's checkouts are jj workspaces without a `.git`
directory. Use jj for every version-control action, including reads; never run `git` here. This
file is only what is specific to csheet.

## gh

There is no `.git`, so `gh` needs to be pointed at jj's git store. In the root checkout:

```bash
GIT_DIR=$PWD/.jj/repo/store/git gh pr list
```

In a sibling workspace `.jj/repo` is a file holding the path of the root's repo, so use
`GIT_DIR="$(cat .jj/repo)/store/git"` there.

## Commits, bookmarks, pushing

- One change per task; `jj desc -m` up front, refined at the end. Subject `area: what changed` in
  the imperative (`reed: run tool calls in order`); the body says why, for a human.
- Bookmarks are `igor/<slug>`, created and pushed in one step: `jj git push --named igor/<slug>=<change>`.
  Push only when asked.
- The SSH key is a YubiKey. A push blocks until it is touched and looks like a hang: run pushes in
  the background and tell the maintainer the key needs a tap.
- `main` is protected and moves only by fast-forward, which the maintainer does with
  `jj bookmark move main --to <change>` once the PR is green. Never move or push `main` yourself.

## Sibling workspaces

Several agents work on this machine at once, each in a workspace made by `mise run workspace:add <n>`
(`../csheet-i<n>`, port `3000+n`, databases `csheet_i<n>` and `csheet_i<n>_test`, shared postgres and
minio). `mise run workspace:rm <n>` removes one. In `jj log` the others appear as `i<n>@`; never
`jj edit` them, and check for one among a change's descendants before rewriting it.

- The maintainer runs `mise run app:dev` (`bun --watch`) on :3000. Never `pkill` bun or `main.ts`.
- Browse your own server at `127.0.0.1:<port>`, not `localhost`, so logging in doesn't log the
  maintainer out of :3000.
- `mise run dbmate up` rewrites the `\restrict` token in `db/schema.sql`; `jj restore db/schema.sql`
  if that is the only change to it.
