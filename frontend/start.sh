#!/bin/sh
# Startup script for frontend container
# Runs both the health check server and Caddy

# Start health server in background
node /app/build/server/mount-health.js &
HEALTH_PID=$!

# Start Caddy in foreground
caddy run --config /etc/caddy/Caddyfile &
CADDY_PID=$!

# Trap signals and forward to both processes
trap 'kill -TERM $HEALTH_PID $CADDY_PID 2>/dev/null; wait' TERM INT

# Wait for either process to exit
wait -n

# If one exits, kill the other
kill -TERM $HEALTH_PID $CADDY_PID 2>/dev/null
wait
