const axios = require('axios');
const Minio = require('minio');

const DEFAULT_TIMEOUT_MS = Number(process.env.HEALTH_DEPENDENCY_TIMEOUT_MS ?? 5000);
const CACHE_TTL_MS = Number(process.env.HEALTH_DEPENDENCY_CACHE_MS ?? 60000);

let lastSnapshot = null;
let lastUpdated = 0;
let refreshPromise = null;
let minioClient;

function formatAxiosError(error) {
  if (error.response) {
    return `${error.response.status} ${error.response.statusText}`;
  }
  if (error.code) {
    return `${error.code}`;
  }
  return error.message ?? 'Unknown error';
}

async function checkChes() {
  const clientId = process.env.CHES_CLIENT_ID;
  const clientSecret = process.env.CHES_CLIENT_SECRET;
  const tokenUrl =
    process.env.CHES_TOKEN_URL ??
    'https://test.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token';

  if (!clientId || !clientSecret) {
    return {
      status: 'skipped',
      message: 'CHES credentials are not configured'
    };
  }

  const started = Date.now();

  try {
    await axios.post('' + tokenUrl, 'grant_type=client_credentials', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: clientId, password: clientSecret },
      timeout: DEFAULT_TIMEOUT_MS
    });

    return {
      status: 'ok',
      latencyMs: Date.now() - started,
      endpoint: tokenUrl
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - started,
      error: formatAxiosError(error)
    };
  }
}

function getMinioClient() {
  if (minioClient) {
    return minioClient;
  }

  const endPoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESSKEY;
  const secretKey = process.env.S3_SECRETKEY;

  if (!endPoint || !accessKey || !secretKey) {
    return null;
  }

  const port = process.env.S3_PORT ? Number(process.env.S3_PORT) : undefined;
  const useSSL = process.env.S3_USE_SSL !== 'false';

  minioClient = new Minio.Client({
    endPoint,
    accessKey,
    secretKey,
    useSSL,
    port
  });

  return minioClient;
}

async function checkObjectStore() {
  const bucketName = process.env.S3_BUCKETNAME;
  if (!bucketName) {
    return {
      status: 'skipped',
      message: 'S3 bucket is not configured'
    };
  }

  const client = getMinioClient();
  if (!client) {
    return {
      status: 'skipped',
      message: 'S3 credentials are not configured'
    };
  }

  const started = Date.now();
  try {
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      return {
        status: 'error',
        latencyMs: Date.now() - started,
        error: `Bucket ${bucketName} does not exist`
      };
    }

    return {
      status: 'ok',
      latencyMs: Date.now() - started,
      bucket: bucketName
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - started,
      error: error.message ?? 'Unable to reach bucket'
    };
  }
}

async function checkCognito() {
  const userPoolId = process.env.VITE_USER_POOLS_ID;
  if (!userPoolId) {
    return {
      status: 'skipped',
      message: 'VITE_USER_POOLS_ID is not configured'
    };
  }

  const region = process.env.VITE_COGNITO_REGION || 'ca-central-1';
  const wellKnownUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/openid-configuration`;

  const started = Date.now();

  try {
    await axios.get(wellKnownUrl, { timeout: DEFAULT_TIMEOUT_MS });
    return {
      status: 'ok',
      latencyMs: Date.now() - started,
      endpoint: wellKnownUrl
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - started,
      error: formatAxiosError(error)
    };
  }
}

function normalize(dependencies) {
  return {
    ches: dependencies.ches,
    objectStorage: dependencies.objectStorage,
    federatedAuth: dependencies.federatedAuth
  };
}

async function runChecks() {
  const [ches, objectStorage, federatedAuth] = await Promise.all([
    checkChes(),
    checkObjectStore(),
    checkCognito()
  ]);

  return { ches, objectStorage, federatedAuth };
}

function computeOverallStatus(dependencies) {
  const statuses = Object.values(dependencies)
    .map((dep) => dep.status)
    .filter((status) => status !== 'skipped');

  if (statuses.includes('error')) {
    return 'error';
  }

  if (statuses.includes('degraded')) {
    return 'degraded';
  }

  return 'ok';
}

async function ensureFresh(forceRefresh = false) {
  const now = Date.now();
  const isFresh = lastSnapshot && now - lastUpdated < CACHE_TTL_MS;

  if (!forceRefresh && isFresh) {
    return lastSnapshot;
  }

  if (!refreshPromise) {
    refreshPromise = runChecks()
      .then((result) => {
        lastSnapshot = normalize(result);
        lastUpdated = Date.now();
        return lastSnapshot;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function getHealthStatus({ forceRefresh = false } = {}) {
  const dependencies = await ensureFresh(forceRefresh);
  const status = computeOverallStatus(dependencies);

  return {
    status,
    dependencies,
    checkedAt: lastUpdated
  };
}

module.exports = {
  getHealthStatus
};

