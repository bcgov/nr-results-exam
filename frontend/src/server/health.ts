import express from 'express';

type CheckResult = { ok: boolean; details?: string };

const router = express.Router();

let cachedReady = false;
let lastChecked = 0;
const CACHE_TTL_MS = 15 * 1000; // 15s

/**
 * Timeout helper for fetch
 */
async function fetchHead(url: string, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Use global fetch (Node 18+) — fallback callers should polyfill if necessary.
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Quick checks for readiness
 */
async function quickChecks(): Promise<CheckResult> {
  // 1) Required env
  const backend = process.env.BACKEND_SERVICE_URL;
  if (!backend) return { ok: false, details: 'BACKEND_SERVICE_URL missing' };

  // 2) Internal backend health (fast HEAD)
  try {
    const url = `${backend.replace(/\/$/, '')}/health`;
    const resp = await fetchHead(url, 2000);
    if (!resp.ok) return { ok: false, details: `backend unhealthy: ${resp.status}` };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { ok: false, details: `backend unreachable: ${errMsg}` };
  }

  // 3) Optional: JWKS/discovery HEAD (fast)
  const jwks = process.env.COGNITO_JWKS_URL;
  if (jwks) {
    try {
      const r = await fetchHead(jwks, 1500);
      if (!r.ok) return { ok: false, details: `jwks unreachable: ${r.status}` };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { ok: false, details: `jwks error: ${errMsg}` };
    }
  }

  // All quick checks OK
  return { ok: true };
}

/**
 * Refresh the cache
 */
async function refreshCache() {
  try {
    const now = Date.now();
    if (now - lastChecked < CACHE_TTL_MS) return;
    const res = await quickChecks();
    cachedReady = res.ok;
    lastChecked = now;
    if (!res.ok) {
      console.warn('[readiness] quickChecks failed:', res.details);
    }
  } catch (err) {
    console.error('[readiness] refreshCache error', err);
    cachedReady = false;
    lastChecked = Date.now();
  }
}

// Start periodic refresh (non-blocking)
setInterval(() => refreshCache(), CACHE_TTL_MS).unref();
refreshCache().catch(() => {
  /* initial best-effort */
});

// Readiness probe (used by OpenShift/Kubernetes)
// Returns 200 when cached quick-check says OK, 503 otherwise.
// Minimal body to avoid leaking infra details.
router.get('/health/ready', async (_req, res) => {
  await refreshCache();
  if (cachedReady) return res.status(200).send('OK');
  return res.status(503).send('NOT READY');
});

// Liveness probe: very lightweight — process is alive.
router.get('/health/live', (_req, res) => {
  res.status(200).send('ALIVE');
});

// Optional diagnostic endpoint for humans (not used by probes).
router.get('/health/diag', (_req, res) => {
  const info = {
    ready: cachedReady,
    lastCheckedAt: lastChecked ? new Date(lastChecked).toISOString() : null
  };
  res.status(200).json(info);
});

export default router;
