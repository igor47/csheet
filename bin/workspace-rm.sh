#!/bin/sh
# Remove a workspace made by workspace-add.sh: forget it in jj or git, drop its
# databases, delete the directory. Refuses while the workspace has uncommitted
# work (jj: a non-empty working-copy change; git: a dirty tree).
#
#   mise run workspace:rm <n>
set -eu

N="${1:-}"
case "$N" in
  ''|*[!0-9]*) echo "usage: mise run workspace:rm <number>" >&2; exit 1 ;;
esac

ROOT="$(pwd)"
NAME="i$N"
DIR="$(dirname "$ROOT")/$(basename "$ROOT")-$NAME"

if [ -d .jj ]; then
  if jj workspace list | grep -q "^$NAME:"; then
    if [ "$(jj log -r "$NAME@" --no-graph -T 'empty' 2>/dev/null)" = "false" ]; then
      echo "error: $NAME@ has uncommitted changes; squash or abandon them first:" >&2
      jj log -r "$NAME@" --no-graph -T 'change_id.short() ++ " " ++ description.first_line() ++ "\n"' >&2
      exit 1
    fi
    jj workspace forget "$NAME"
  fi
elif [ -d .git ]; then
  if [ -d "$DIR" ] && [ -n "$(git -C "$DIR" status --porcelain)" ]; then
    echo "error: $DIR has uncommitted changes" >&2
    exit 1
  fi
  [ -d "$DIR" ] && git worktree remove "$DIR"
fi

CONFIG=$(bun src/config.ts)
PG_HOST=$(echo "$CONFIG" | jq -r '.postgresHost')
PG_PORT=$(echo "$CONFIG" | jq -r '.postgresPort')
PG_USER=$(echo "$CONFIG" | jq -r '.postgresUser')
export PGPASSWORD
PGPASSWORD=$(echo "$CONFIG" | jq -r '.postgresPassword')
for DB in "csheet_$NAME" "csheet_${NAME}_test"; do
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -q -c "DROP DATABASE IF EXISTS $DB"
done

[ -d "$DIR" ] && rm -rf "$DIR"
echo "Removed workspace $NAME ($DIR)"
