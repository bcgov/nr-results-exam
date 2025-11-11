# Health Check Endpoints

This document describes the health check endpoints added to the frontend container for OpenShift/Kubernetes probe configuration.

## Overview

The frontend container now runs two services:
1. **Caddy** (port 3000) - Serves the static React application
2. **Health Server** (port 3001) - Provides health check endpoints for probes

## Endpoints

### `/health/live` (Liveness Probe)

**Purpose**: Determines if the container is responsive and doesn't need to be restarted.

**Response**:
- `200 OK` - Process is alive and responsive
```json
{
  "status": "alive",
  "uptime": 123.45
}
```

**Use Case**: Used by Kubernetes liveness probes to detect deadlocks or completely unresponsive processes.

### `/health/ready` (Readiness Probe)

**Purpose**: Determines if the container is ready to accept traffic.

**Implementation Details**:
- Performs dependency checks with a 15-second cache TTL
- Uses HEAD requests to minimize overhead
- Logs detailed failures server-side but returns minimal responses to probes

**Checks Performed**:
1. ✅ `BACKEND_SERVICE_URL` or `VITE_BACKEND_URL` environment variable is set
2. ✅ Backend `/health` endpoint is accessible (HEAD request)
3. ✅ Optional: JWKS endpoint is accessible if `COGNITO_JWKS_URL` is configured

**Responses**:
- `200 OK` - All checks passed, ready for traffic
```json
{
  "status": "ready"
}
```

- `503 Service Unavailable` - One or more checks failed
```json
{
  "status": "not ready"
}
```

**Use Case**: Used by Kubernetes readiness probes to gate traffic routing. Prevents routing requests to containers that can't properly handle them due to dependency unavailability.

## Architecture

```
┌─────────────────────────────────────┐
│  Frontend Container                 │
│                                     │
│  ┌──────────┐      ┌─────────────┐ │
│  │  Caddy   │      │   Health    │ │
│  │ :3000    │      │   Server    │ │
│  │          │      │   :3001     │ │
│  │ Static   │      │             │ │
│  │ Files    │      │ /health/    │ │
│  │          │      │ - live      │ │
│  │          │      │ - ready     │ │
│  └──────────┘      └─────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## OpenShift/Kubernetes Configuration

The probes are configured in `frontend/openshift.deploy.yml` and documented in `openshift/probes/frontend-probes-patch.yaml`.

### Recommended Probe Settings

```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
    scheme: HTTP
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health/live
    port: 3001
    scheme: HTTP
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 60  # Up to 5 minutes for slow starts
```

## Environment Variables

### Required
- `BACKEND_SERVICE_URL` or `VITE_BACKEND_URL` - URL of the backend service

### Optional
- `COGNITO_JWKS_URL` - If set, the readiness check will validate JWKS endpoint accessibility
- `HEALTH_PORT` - Port for health server (default: 3001)

## Performance Characteristics

- **Liveness probe**: ~1ms response time (simple process check)
- **Readiness probe**: 
  - Cached: ~1ms response time (returns cached result)
  - Uncached: ~50-100ms (performs actual dependency checks)
  - Cache TTL: 15 seconds

## Development

### Local Testing

```bash
# Build the server
npm run build:server

# Start the health server
BACKEND_SERVICE_URL=http://localhost:5000 npm run start:health

# Test endpoints
curl http://localhost:3001/health/live
curl http://localhost:3001/health/ready
```

### Running Tests

```bash
npm test -- src/server/__tests__/health.test.ts
```

## Container Startup

The container runs both services using `start.sh`:
1. Starts the health server in the background
2. Starts Caddy in the foreground
3. Handles graceful shutdown of both processes

## Logging

Health check results are logged to stdout:
- Success: `[Health] Readiness check passed: Backend URL configured; Backend health check passed`
- Failure: `[Health] Readiness check FAILED: Backend URL configured; Backend health check failed: http://backend:5000/health`

## Troubleshooting

### Pod is not becoming ready

Check the logs:
```bash
kubectl logs <pod-name> | grep Health
```

Common issues:
- `BACKEND_SERVICE_URL` not set or incorrect
- Backend service not accessible
- JWKS endpoint not accessible (if configured)

### Health server not starting

Check if Node.js is installed in the container and if the build files exist:
```bash
kubectl exec <pod-name> -- ls -la /app/build/server/
kubectl exec <pod-name> -- node --version
```

## Related Files

- `frontend/src/server/health.ts` - Health check implementation
- `frontend/src/server/mount-health.ts` - Health server bootstrap
- `frontend/start.sh` - Container startup script
- `frontend/Dockerfile` - Container build configuration
- `frontend/openshift.deploy.yml` - OpenShift deployment configuration
- `openshift/probes/frontend-probes-patch.yaml` - Probe configuration reference
