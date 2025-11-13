# Deployment Guide

This guide provides comprehensive information on deploying the Natural Resources RESULTS Exam application with exec-based readiness probes, authenticated health checks, and e2e smoke test validation.

## Table of Contents

- [Overview](#overview)
- [Exec-Based Readiness Probe](#exec-based-readiness-probe)
- [Building Container Images](#building-container-images)
- [OpenShift Deployment](#openshift-deployment)
- [Mounting Probe Authentication Tokens](#mounting-probe-authentication-tokens)
- [Recommended Probe Parameters](#recommended-probe-parameters)
- [Rollout Strategy](#rollout-strategy)
- [E2E Smoke Tests](#e2e-smoke-tests)
- [Troubleshooting](#troubleshooting)

## Overview

This application uses exec-based readiness probes instead of HTTP-based probes for several key benefits:

1. **Reliability**: Exec probes are more robust and less affected by network issues
2. **Authentication**: Support for token-based authenticated health checks
3. **Flexibility**: Can verify multiple dependencies (local health, API, DNS)
4. **Security**: Tokens can be mounted via secrets without exposing them in logs

## Exec-Based Readiness Probe

### What is an Exec-Based Probe?

An exec-based probe runs a command inside the container to determine if the application is ready. Our implementation uses the `readiness_check.sh` script which:

- Verifies the local `/health` endpoint is responding
- Optionally checks API dependencies
- Optionally verifies DNS resolution for external dependencies
- Supports authenticated checks via mounted token files
- Exits with code 0 on success, non-zero on failure

### Why Use Exec-Based Probes?

Traditional HTTP-based probes have limitations:

- **Network Sensitivity**: HTTP probes can fail due to network glitches even when the app is healthy
- **No Authentication**: Standard HTTP probes can't include authentication headers
- **Limited Checks**: Can only verify one endpoint at a time
- **Debugging**: Harder to debug failures without exec access

Exec-based probes overcome these limitations by running directly in the container with full access to mounted secrets and the local network stack.

### Script Configuration

The `readiness_check.sh` script accepts the following environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HEALTH_URL` | No | `http://localhost:3000/health` | Local health endpoint to verify |
| `API_URL` | No | - | Optional API dependency endpoint |
| `TIMEOUT` | No | `3` | HTTP request timeout in seconds |
| `PROBE_AUTH_TOKEN_FILE` | No | - | Path to mounted token file for authenticated checks |
| `EXTERNAL_DEPENDENCIES` | No | - | Comma-separated hostnames for DNS verification |

### Example Configuration

```yaml
readinessProbe:
  exec:
    command:
      - /opt/app/readiness_check.sh
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

## Building Container Images

### Integrating the Readiness Script

To include the readiness check script in your container images, follow the instructions in `Dockerfile.fragment`. The key steps are:

1. **Copy the script into the image**:
   ```dockerfile
   COPY scripts/readiness_check.sh /opt/app/readiness_check.sh
   RUN chmod +x /opt/app/readiness_check.sh
   ```

2. **Ensure curl is available**:
   - Alpine: `RUN apk add --no-cache curl`
   - Debian/Ubuntu: `RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*`

3. **Configure environment variables** (if needed):
   ```dockerfile
   ENV HEALTH_URL=http://localhost:3000/health
   ```

### Example: Frontend (Caddy)

```dockerfile
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts && npm run build

FROM caddy:2.10.2-alpine
# Install curl for readiness checks
RUN apk add --no-cache curl

# Copy built assets
COPY --from=build /app/build/ /srv
COPY Caddyfile /etc/caddy/Caddyfile

# Copy readiness check script
COPY scripts/readiness_check.sh /opt/app/readiness_check.sh
RUN chmod +x /opt/app/readiness_check.sh

# Configure for frontend
ENV HEALTH_URL=http://localhost:3000/health

USER 1001
EXPOSE 3000
```

### Example: Backend (Node.js)

```dockerfile
FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY . .
RUN npm ci --ignore-scripts --omit=dev

FROM node:20-bullseye-slim AS deploy
# Install curl for readiness checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app ./

# Copy readiness check script
COPY scripts/readiness_check.sh /opt/app/readiness_check.sh
RUN chmod +x /opt/app/readiness_check.sh

# Configure for backend
ENV HEALTH_URL=http://localhost:5000/health

EXPOSE 5000
CMD ["node", "index.js"]
```

## OpenShift Deployment

### Using the Template

Deploy using the provided OpenShift template:

```bash
oc process -f openshift/templates/readiness-probe-template.yaml \
  -p APP_NAME=nr-results-frontend \
  -p IMAGE=image-registry.openshift-image-registry.svc:5000/your-namespace/frontend:latest \
  -p HEALTH_URL=http://localhost:3000/health \
  -p CONTAINER_PORT=3000 \
  | oc apply -f -
```

### Manual Configuration

Alternatively, add the readiness probe to your existing deployment:

```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        env:
          - name: HEALTH_URL
            value: "http://localhost:3000/health"
        readinessProbe:
          exec:
            command:
              - /opt/app/readiness_check.sh
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          successThreshold: 1
          failureThreshold: 3
```

## Mounting Probe Authentication Tokens

If your health endpoints require authentication, you can mount tokens via OpenShift secrets.

### Creating the Secret

```bash
# Create a secret with the probe token
oc create secret generic readiness-probe-token \
  --from-literal=token='your-probe-token-here'
```

### Mounting the Secret

Add volume and volumeMount to your deployment:

```yaml
spec:
  template:
    spec:
      containers:
      - name: app
        env:
          - name: PROBE_AUTH_TOKEN_FILE
            value: "/var/run/secrets/probe-token/token"
        volumeMounts:
          - name: probe-token
            mountPath: /var/run/secrets/probe-token
            readOnly: true
      volumes:
        - name: probe-token
          secret:
            secretName: readiness-probe-token
            items:
              - key: token
                path: token
```

### Using the Template with Secrets

```bash
oc process -f openshift/templates/readiness-probe-template.yaml \
  -p APP_NAME=nr-results-frontend \
  -p IMAGE=your-image \
  -p PROBE_AUTH_TOKEN_FILE=/var/run/secrets/probe-token/token \
  -p PROBE_TOKEN_SECRET_NAME=readiness-probe-token \
  | oc apply -f -
```

## Recommended Probe Parameters

### Readiness Probe

Readiness probes determine when a pod can receive traffic. Conservative settings prevent premature traffic routing:

| Parameter | Recommended Value | Rationale |
|-----------|------------------|-----------|
| `initialDelaySeconds` | `10` | Allow app to start before first check |
| `periodSeconds` | `10` | Check every 10 seconds |
| `timeoutSeconds` | `5` | Allow up to 5 seconds for check to complete |
| `successThreshold` | `1` | One success marks pod as ready |
| `failureThreshold` | `3` | Three failures mark pod as not ready (30s total) |

### Liveness Probe

Liveness probes determine when to restart a pod. More lenient settings prevent unnecessary restarts:

| Parameter | Recommended Value | Rationale |
|-----------|------------------|-----------|
| `initialDelaySeconds` | `30` | Give app plenty of time to start |
| `periodSeconds` | `30` | Check every 30 seconds |
| `timeoutSeconds` | `5` | Allow up to 5 seconds for check to complete |
| `failureThreshold` | `3` | Three failures trigger restart (90s total) |

### Adjusting for Your Application

- **Fast Startup**: Reduce `initialDelaySeconds`
- **Slow Startup**: Increase `initialDelaySeconds` to prevent premature failures
- **Heavy Traffic**: Increase `timeoutSeconds` if checks occasionally time out
- **Critical Stability**: Increase `failureThreshold` to tolerate transient issues

## Rollout Strategy

Follow this strategy for safe deployments to production:

### 1. Deploy to Development

```bash
# Deploy to dev namespace
oc project nr-results-dev
oc process -f openshift/templates/readiness-probe-template.yaml \
  -p APP_NAME=nr-results-frontend \
  -p IMAGE=dev-image \
  | oc apply -f -

# Watch rollout
oc rollout status deployment/nr-results-frontend
```

### 2. Test in Development

- Verify pods reach ready state: `oc get pods`
- Check probe logs: `oc logs deployment/nr-results-frontend --tail=50`
- Test application functionality manually
- Run integration tests

### 3. Deploy to Staging with CSP Report-Only

Before deploying to staging, enable Content Security Policy (CSP) in report-only mode to catch potential issues without breaking functionality:

```yaml
env:
  - name: CSP_REPORT_ONLY
    value: "true"
```

This allows you to:
- Monitor CSP violations without blocking requests
- Identify problematic third-party scripts or resources
- Adjust CSP policies before enforcing them

Check CSP reports in your browser console and monitoring tools.

### 4. Run E2E Smoke Tests

After deploying to staging, run the Playwright smoke tests to validate critical user flows:

```bash
# Locally
cd tests
npm install
export APP_URL=https://staging.example.com
export SMOKE_USER=test@example.com
export SMOKE_PASSWORD=test-password
npm run test:e2e

# Or trigger via GitHub Actions
# Manual workflow dispatch from Actions tab
```

The smoke tests validate:
- Application loads successfully
- Authentication flow works end-to-end
- Post-login UI elements are visible
- Error handling for invalid credentials

### 5. Monitor Staging

- Check application logs for errors
- Review CSP reports
- Monitor pod health and restarts
- Verify no unexpected probe failures
- Test with real user scenarios

### 6. Deploy to Production

Only after successful staging validation:

```bash
# Deploy to production namespace
oc project nr-results-prod
oc process -f openshift/templates/readiness-probe-template.yaml \
  -p APP_NAME=nr-results-frontend \
  -p IMAGE=prod-image \
  -p REPLICAS=3 \
  | oc apply -f -

# Monitor rollout closely
oc rollout status deployment/nr-results-frontend -w

# If issues occur, rollback immediately
oc rollout undo deployment/nr-results-frontend
```

### 7. Post-Deployment Validation

- Run smoke tests against production (if safe to do so)
- Monitor application metrics
- Check for increased error rates
- Verify user workflows are functioning

## E2E Smoke Tests

### Local Execution

Run Playwright smoke tests locally to validate application functionality:

```bash
cd tests

# Install dependencies (first time only)
npm install
npx playwright install --with-deps chromium

# Set environment variables
export APP_URL=https://your-app-url.com
export SMOKE_USER=test@example.com
export SMOKE_PASSWORD=test-password

# Run tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Debug a specific test
npm run test:e2e:debug
```

### CI/CD Integration

The e2e smoke tests run automatically via GitHub Actions (`.github/workflows/e2e-smoke.yml`) on:
- Push to main branch
- Pull requests
- Manual workflow dispatch
- Daily schedule (6 AM UTC)

#### Required Secrets

Configure these secrets in your GitHub repository settings:

- `STAGING_APP_URL`: The staging environment URL
- `SMOKE_USER`: Test account username/email
- `SMOKE_PASSWORD`: Test account password

#### Manual Trigger

Manually trigger tests from the GitHub Actions UI:
1. Go to Actions tab
2. Select "E2E Smoke Tests" workflow
3. Click "Run workflow"
4. Optionally specify a custom staging URL

### Test Results

Test results are available as workflow artifacts:
- **playwright-report**: HTML report with test details
- **playwright-artifacts**: Videos and traces
- **playwright-screenshots**: Screenshots on failure

## Troubleshooting

### Probe Failures

**Symptom**: Pods never reach ready state

**Diagnosis**:
```bash
# Check pod events
oc describe pod <pod-name>

# View container logs
oc logs <pod-name>

# Exec into pod to test manually
oc exec -it <pod-name> -- /opt/app/readiness_check.sh

# Check with debug output
oc exec -it <pod-name> -- sh -x /opt/app/readiness_check.sh
```

**Common Causes**:
- Health endpoint not responding (app not fully started)
- Incorrect `HEALTH_URL` configuration
- `curl` not installed in container image
- Network connectivity issues
- Authentication token issues

### Authentication Failures

**Symptom**: Probes fail with auth errors

**Diagnosis**:
```bash
# Check if secret is mounted
oc exec -it <pod-name> -- ls -la /var/run/secrets/probe-token/

# View token content (be careful in production!)
oc exec -it <pod-name> -- cat /var/run/secrets/probe-token/token

# Test with token manually
oc exec -it <pod-name> -- sh
export PROBE_AUTH_TOKEN_FILE=/var/run/secrets/probe-token/token
/opt/app/readiness_check.sh
```

**Common Causes**:
- Secret not created or wrong name
- Token file path mismatch
- Token expired or invalid
- Health endpoint not expecting auth

### E2E Test Failures

**Symptom**: Smoke tests fail in CI/CD

**Diagnosis**:
1. Download test artifacts from GitHub Actions
2. Review playwright-report HTML
3. Check screenshots and videos
4. Look for console errors in test output

**Common Causes**:
- Application not fully loaded (increase timeouts)
- UI selectors changed (update test selectors)
- Authentication issues (verify credentials)
- Network connectivity to staging
- Staging environment down or misconfigured

### Probe Taking Too Long

**Symptom**: Probes timeout or slow pod startup

**Diagnosis**:
```bash
# Time the check manually
oc exec -it <pod-name> -- time /opt/app/readiness_check.sh

# Check what's slow
oc exec -it <pod-name> -- sh -x /opt/app/readiness_check.sh
```

**Solutions**:
- Increase `timeoutSeconds` if checks are legitimately slow
- Remove unnecessary dependency checks
- Optimize health endpoint response time
- Increase `TIMEOUT` environment variable for HTTP requests

### High Restart Rate

**Symptom**: Pods frequently restart

**Check**:
- Liveness probe failures (too aggressive)
- Application crashes (check logs)
- Resource limits too low (OOMKilled)

**Solutions**:
- Increase liveness probe `initialDelaySeconds` and `failureThreshold`
- Fix application issues causing crashes
- Increase memory/CPU limits if resource-constrained

## Additional Resources

- [Kubernetes Liveness and Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [OpenShift Health Checks](https://docs.openshift.com/container-platform/latest/applications/application-health.html)
- [Playwright Documentation](https://playwright.dev/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Support

For issues or questions:
- Open an issue in the GitHub repository
- Contact the team on Rocket Chat: `@jazz.grewal`
- Review existing documentation in the `docs/` directory
