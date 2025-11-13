#!/bin/sh
#
# Readiness Check Script
# Verifies the application health endpoint is responding
#

set -e

# Configuration
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
TIMEOUT="${TIMEOUT:-3}"

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
    echo "[readiness] ERROR: curl is not installed"
    exit 1
fi

# Check health endpoint
if ! curl -sf --max-time "$TIMEOUT" "$HEALTH_URL" >/dev/null 2>&1; then
    echo "[readiness] ERROR: Health endpoint check failed: $HEALTH_URL"
    exit 1
fi

echo "[readiness] Health check passed"
exit 0
