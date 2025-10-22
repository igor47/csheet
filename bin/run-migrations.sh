#!/bin/sh
set -e

# Get config from bun
CONFIG=$(bun src/config.ts)

# Extract values using jq
PG_HOST=$(echo "$CONFIG" | jq -r '.postgresHost')
PG_PORT=$(echo "$CONFIG" | jq -r '.postgresPort')
PG_USER=$(echo "$CONFIG" | jq -r '.postgresUser')
PG_PASSWORD=$(echo "$CONFIG" | jq -r '.postgresPassword')
PG_DB=$(echo "$CONFIG" | jq -r '.postgresDb')

# Run dbmate with constructed DATABASE_URL
# Note: We don't set DBMATE_SCHEMA_FILE - schema should only be dumped during local dev
DATABASE_URL="postgres://$PG_USER:$PG_PASSWORD@$PG_HOST:$PG_PORT/$PG_DB?sslmode=disable" \
DBMATE_MIGRATIONS_DIR="./migrations" \
DBMATE_NO_DUMP_SCHEMA=true \
dbmate "$@"
