#!/bin/sh
#
# Readiness Check Script
# Verifies the application health endpoint is responding
#

set -e

HOST="${HOST:-localhost}"
PORT="${PORT:-3000}"
PATH_NAME="${PATH_NAME:-/health}"
TIMEOUT="${TIMEOUT:-5}"
URL="http://$HOST:$PORT$PATH_NAME"

if ! wget -q -O - -T "$TIMEOUT" -t 1 "$URL" >/dev/null; then
  echo "ERROR: Health endpoint check failed ($URL)"
  exit 1
fi
