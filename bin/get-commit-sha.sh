#!/bin/sh
# Get commit SHA - works with both jj and git
set -e

if command -v jj >/dev/null 2>&1 && [ -d .jj ]; then
  jj log -r @ --no-graph -T 'commit_id'
elif command -v git >/dev/null 2>&1 && [ -d .git ]; then
  git rev-parse HEAD
else
  echo "Error: Neither jj nor git found" >&2
  exit 1
fi
