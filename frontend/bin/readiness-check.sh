#!/bin/sh
# Lightweight readiness check intended to be used as an exec probe.
# Returns 0 when quick checks pass, non-zero otherwise.
# Keep this short and deterministic.

set -eu

# Timeout values (seconds)
BACKEND_TIMEOUT=2
JWKS_TIMEOUT=1

# Required env var
if [ -z "${BACKEND_SERVICE_URL:-}" ]; then
  echo "BACKEND_SERVICE_URL missing" >&2
  exit 1
fi

# Normalize backend URL (strip trailing slash)
backend_url="$(printf '%s' "$BACKEND_SERVICE_URL" | sed 's:/*$::')"

# 1) Backend HEAD /health
if ! curl -sS --fail --head --max-time "${BACKEND_TIMEOUT}" "${backend_url}/health" > /dev/null 2>&1; then
  echo "backend unreachable at ${backend_url}/health" >&2
  exit 2
fi

# 2) Optional: JWKS / discovery
if [ -n "${COGNITO_JWKS_URL:-}" ]; then
  if ! curl -sS --fail --head --max-time "${JWKS_TIMEOUT}" "${COGNITO_JWKS_URL}" > /dev/null 2>&1; then
    echo "jwks unreachable at ${COGNITO_JWKS_URL}" >&2
    exit 3
  fi
fi

# All quick checks passed
exit 0
