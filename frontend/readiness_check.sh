#!/bin/sh
#
# Readiness Check Script
# 
# This script performs fast, local readiness checks for container orchestration
# platforms like Kubernetes/OpenShift. It supports:
# - Local health endpoint verification
# - Optional API dependency checks
# - Optional authentication via mounted token files
# - Optional DNS resolution checks for external dependencies
#
# Exit codes:
#   0 - Ready (all checks passed)
#   1 - Not ready (one or more checks failed)
#
# Environment variables:
#   HEALTH_URL              - Local health endpoint URL (default: http://localhost:3000/health)
#   API_URL                 - Optional API dependency endpoint to verify
#   PROBE_AUTH_TOKEN_FILE   - Optional path to mounted token file for authenticated checks
#   EXTERNAL_DEPENDENCIES   - Optional comma-separated list of hostnames to verify DNS resolution
#   TIMEOUT                 - Request timeout in seconds (default: 3)
#

set -e

# Configuration
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"
TIMEOUT="${TIMEOUT:-3}"

# Helper function to log messages
log() {
    echo "[readiness] $1"
}

# Helper function to check if curl is available
check_curl() {
    if ! command -v curl >/dev/null 2>&1; then
        log "ERROR: curl is not installed or not in PATH"
        exit 1
    fi
}

# Helper function to make authenticated HTTP request
make_request() {
    local url="$1"
    local auth_header=""
    
    # If token file is provided and exists, use it for authentication
    if [ -n "$PROBE_AUTH_TOKEN_FILE" ] && [ -f "$PROBE_AUTH_TOKEN_FILE" ]; then
        local token
        token=$(cat "$PROBE_AUTH_TOKEN_FILE")
        auth_header="Authorization: Bearer $token"
    fi
    
    # Make request with optional authentication
    if [ -n "$auth_header" ]; then
        curl -sf --max-time "$TIMEOUT" -H "$auth_header" "$url"
    else
        curl -sf --max-time "$TIMEOUT" "$url"
    fi
}

# Check 1: Verify curl is available
check_curl

# Check 2: Verify local health endpoint
log "Checking health endpoint: $HEALTH_URL"
if ! make_request "$HEALTH_URL" >/dev/null 2>&1; then
    log "ERROR: Health endpoint check failed"
    exit 1
fi
log "Health endpoint check: OK"

# Check 3: Optional API dependency check
if [ -n "$API_URL" ]; then
    log "Checking API dependency: $API_URL"
    if ! make_request "$API_URL" >/dev/null 2>&1; then
        log "ERROR: API dependency check failed"
        exit 1
    fi
    log "API dependency check: OK"
fi

# Check 4: Optional DNS resolution checks
if [ -n "$EXTERNAL_DEPENDENCIES" ]; then
    log "Checking DNS resolution for external dependencies"
    # Save IFS and split comma-separated list
    OLD_IFS="$IFS"
    IFS=','
    set -- $EXTERNAL_DEPENDENCIES
    IFS="$OLD_IFS"
    
    for hostname in "$@"; do
        # Trim whitespace
        hostname=$(echo "$hostname" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$hostname" ]; then
            log "Resolving: $hostname"
            if ! nslookup "$hostname" >/dev/null 2>&1 && ! getent hosts "$hostname" >/dev/null 2>&1; then
                log "ERROR: DNS resolution failed for $hostname"
                exit 1
            fi
            log "DNS resolution for $hostname: OK"
        fi
    done
fi

log "All readiness checks passed"
exit 0
