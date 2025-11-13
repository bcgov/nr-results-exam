#!/bin/sh
#
# Readiness Check Script
# Verifies the application health endpoint is responding
#

set -e

HOST="${HOST:-localhost}"
PORT="${PORT:-3000}"
PATH_NAME="${PATH_NAME:-/health}"

if ! {
  printf "GET %s HTTP/1.0\r\nHost: %s\r\n\r\n" "$PATH_NAME" "$HOST"
  cat
} >/dev/tcp/"$HOST"/"$PORT" 2>/dev/null | head -n 1 | grep -q " 200 "
then
  echo "ERROR: Health endpoint check failed"
  exit 1
fi
