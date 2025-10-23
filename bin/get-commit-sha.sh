#!/bin/sh
# Get short commit SHA (12 chars) - works with both jj and git
set -e

if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then
  jj log -r @ --no-graph -T 'commit_id.short(12)'
elif command -v git >/dev/null 2>&1 && [ -d .git ]; then
  git rev-parse --short=12 HEAD
else
  echo "Error: Neither jj nor git found" >&2
  exit 1
fi
