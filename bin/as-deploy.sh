#!/bin/bash
# Run commands as the deploy service account via impersonation
# Usage: bin/as-deploy.sh <command> [args...]
set -euo pipefail

export CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT="csheet-app-deploys@csheet-475917.iam.gserviceaccount.com"

echo "Running command as: $CLOUDSDK_AUTH_IMPERSONATE_SERVICE_ACCOUNT"
echo "Command: $*"
echo ""

exec "$@"
