#!/bin/sh
# Create a parallel workspace next to this checkout, with its own databases and
# port, sharing this checkout's Docker services. Works with jj or git.
#
#   mise run workspace:add <n>    # e.g. the issue number
#
# Makes ../<repo>-i<n> on trunk, installs dependencies, copies mise.local.toml
# (secrets) and appends the workspace's env, creates its dev database.
set -eu

N="${1:-}"
case "$N" in
  ''|*[!0-9]*) echo "usage: mise run workspace:add <number>" >&2; exit 1 ;;
esac

ROOT="$(pwd)"
NAME="i$N"
DIR="$(dirname "$ROOT")/$(basename "$ROOT")-$NAME"
PORT=$((3000 + N))

if [ -e "$DIR" ]; then
  echo "error: $DIR already exists" >&2
  exit 1
fi

if [ -d .jj ]; then
  jj workspace add --name "$NAME" -r 'trunk()' "$DIR"
elif [ -d .git ]; then
  git worktree add --detach "$DIR" "$(git rev-parse --abbrev-ref origin/HEAD)"
else
  echo "error: not a jj or git checkout" >&2
  exit 1
fi

cd "$DIR"
bun install

# The workspace env goes into mise.local.toml, which is gitignored and also
# holds the secrets, so copy the root one when there is one. Appending only
# works when [env] is the last table in the file.
if [ -f "$ROOT/mise.local.toml" ]; then
  cp "$ROOT/mise.local.toml" mise.local.toml
  LAST_TABLE=$(grep '^\[' mise.local.toml | tail -1 || true)
  if [ -n "$LAST_TABLE" ] && [ "$LAST_TABLE" != "[env]" ]; then
    echo "error: $ROOT/mise.local.toml ends with $LAST_TABLE, not [env]; add the workspace env by hand" >&2
    exit 1
  fi
  [ -n "$LAST_TABLE" ] || printf '\n[env]\n' >> mise.local.toml
else
  printf '[env]\n' > mise.local.toml
fi

cat >> mise.local.toml <<EOF

# workspace $NAME (mise run workspace:add $N)
COMPOSE_PROJECT_NAME = "csheet"   # share the root checkout's postgres and minio
POSTGRES_DB = "csheet_$NAME"
POSTGRES_DB_TEST = "csheet_${NAME}_test"
PORT = "$PORT"
EOF

mise trust --quiet
DBMATE_NO_DUMP_SCHEMA=true mise run dbmate up

cat <<EOF

Workspace $NAME is ready:
  cd $DIR
  mise run app:dev            # serves on 127.0.0.1:$PORT
  mise run test               # uses csheet_${NAME}_test

Browse at 127.0.0.1:$PORT, not localhost: cookies are shared across localhost
ports, so logging in there would log out the session on another port.
Remove with: mise run workspace:rm $N
EOF
