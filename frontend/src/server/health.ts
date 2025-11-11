/**
 * Health check router for frontend container probes
 * 
 * Provides /health/ready and /health/live endpoints with intelligent caching:
 * - Readiness: validates dependencies (backend, JWKS) before accepting traffic
 * - Liveness: quick check that the process is responsive
 * 
 * Implementation notes:
 * - Uses a 15-second cache TTL to keep probe latency low
 * - Performs HEAD requests to avoid downloading response bodies
 * - Logs detailed errors server-side but returns minimal probe responses
 * - Non-blocking async checks with timeout protection
 */

import express, { Request, Response } from 'express';

const router = express.Router();

// Cache for readiness check results
interface HealthCheckCache {
  status: boolean;
  timestamp: number;
  details?: string;
}

let readinessCache: HealthCheckCache | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds

/**
 * Performs a HEAD request to check if an endpoint is accessible
 */
async function checkEndpoint(url: string, timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      // Disable following redirects for security
      redirect: 'manual'
    });
    
    clearTimeout(timeoutId);
    
    // Accept 2xx and 3xx responses as healthy
    return response.ok || (response.status >= 300 && response.status < 400);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Health check failed for ${url}:`, error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Performs all readiness checks and caches the result
 */
async function performReadinessChecks(): Promise<HealthCheckCache> {
  const checks: string[] = [];
  let allHealthy = true;

  // Check 1: Required environment variable
  const backendUrl = process.env.BACKEND_SERVICE_URL || process.env.VITE_BACKEND_URL;
  if (!backendUrl) {
    checks.push('BACKEND_SERVICE_URL not configured');
    allHealthy = false;
  } else {
    checks.push('Backend URL configured');
    
    // Check 2: Backend health endpoint
    const backendHealthUrl = `${backendUrl}/health`;
    const backendHealthy = await checkEndpoint(backendHealthUrl);
    if (!backendHealthy) {
      checks.push(`Backend health check failed: ${backendHealthUrl}`);
      allHealthy = false;
    } else {
      checks.push('Backend health check passed');
    }
  }

  // Check 3: Optional JWKS endpoint (if Cognito is configured)
  const jwksUrl = process.env.COGNITO_JWKS_URL;
  if (jwksUrl) {
    const jwksHealthy = await checkEndpoint(jwksUrl);
    if (!jwksHealthy) {
      checks.push(`JWKS check failed: ${jwksUrl}`);
      allHealthy = false;
    } else {
      checks.push('JWKS check passed');
    }
  }

  const result: HealthCheckCache = {
    status: allHealthy,
    timestamp: Date.now(),
    details: checks.join('; ')
  };

  // Log the detailed check results
  if (allHealthy) {
    console.log('[Health] Readiness check passed:', result.details);
  } else {
    console.error('[Health] Readiness check FAILED:', result.details);
  }

  return result;
}

/**
 * Gets cached readiness status or performs fresh checks if cache expired
 */
async function getCachedReadiness(): Promise<HealthCheckCache> {
  const now = Date.now();
  
  // Return cached result if still valid
  if (readinessCache && (now - readinessCache.timestamp) < CACHE_TTL_MS) {
    return readinessCache;
  }

  // Perform fresh checks and update cache
  readinessCache = await performReadinessChecks();
  return readinessCache;
}

/**
 * Readiness probe endpoint
 * Returns 200 if the container is ready to accept traffic, 503 otherwise
 * 
 * OpenShift/Kubernetes uses this to gate traffic routing
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const health = await getCachedReadiness();
    
    if (health.status) {
      res.status(200).json({ status: 'ready' });
    } else {
      // Return 503 Service Unavailable when not ready
      res.status(503).json({ status: 'not ready' });
    }
  } catch (error) {
    console.error('[Health] Readiness check error:', error);
    res.status(503).json({ status: 'error' });
  }
});

/**
 * Liveness probe endpoint
 * Always returns 200 unless the process is completely unresponsive
 * 
 * OpenShift/Kubernetes uses this to detect if the container needs restart
 */
router.get('/live', (_req: Request, res: Response) => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({ status: 'alive', uptime: process.uptime() });
});

export default router;
