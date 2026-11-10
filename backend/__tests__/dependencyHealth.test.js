const { describe, test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const Minio = require('minio');

const SERVICE_PATH = '../services/dependencyHealth';
const ENV_KEYS = [
  'CHES_CLIENT_ID',
  'CHES_CLIENT_SECRET',
  'CHES_TOKEN_URL',
  'S3_ENDPOINT',
  'S3_ACCESSKEY',
  'S3_SECRETKEY',
  'S3_BUCKETNAME',
  'VITE_USER_POOLS_ID',
  'VITE_COGNITO_REGION',
];

const ORIGINAL_ENV = {};

function mockFetch(handler) {
  return mock.method(globalThis, 'fetch', async (url, init) => handler(url, init));
}

const ok = () => new Response('{}', { status: 200 });

function loadService() {
  delete require.cache[require.resolve(SERVICE_PATH)];
  return require(SERVICE_PATH);
}

beforeEach(() => {
  ENV_KEYS.forEach((key) => {
    ORIGINAL_ENV[key] = process.env[key];
  });

  process.env.CHES_CLIENT_ID = 'client';
  process.env.CHES_CLIENT_SECRET = 'secret';
  process.env.CHES_TOKEN_URL = 'https://example.com/token';
  process.env.S3_ENDPOINT = 's3.example.com';
  process.env.S3_ACCESSKEY = 'access';
  process.env.S3_SECRETKEY = 'secret';
  process.env.S3_BUCKETNAME = 'bucket';
  process.env.VITE_USER_POOLS_ID = 'pool';
  process.env.VITE_COGNITO_REGION = 'ca-central-1';
});

afterEach(() => {
  mock.restoreAll();
  ENV_KEYS.forEach((key) => {
    const value = ORIGINAL_ENV[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
});

describe('dependencyHealth', () => {
  test('reports ok when all dependencies succeed', async () => {
    const fetchMock = mockFetch(ok);
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists: async () => true };
    });

    const service = loadService();
    const result = await service.getHealthStatus({ forceRefresh: true });

    const calls = fetchMock.mock.calls.map(({ arguments: [url, init] }) => ({ url, init }));
    const tokenCall = calls.find(({ url }) => url === 'https://example.com/token');
    assert.strictEqual(tokenCall.init.method, 'POST');
    assert.strictEqual(tokenCall.init.body, 'grant_type=client_credentials');
    assert.strictEqual(
      tokenCall.init.headers.get('Authorization'),
      `Basic ${Buffer.from('client:secret').toString('base64')}`,
    );
    assert.ok(tokenCall.init.signal instanceof AbortSignal);
    const cognitoCall = calls.find(({ url }) =>
      url.startsWith('https://cognito-idp.ca-central-1.amazonaws.com/pool/'),
    );
    assert.strictEqual(cognitoCall.init.method, 'GET');
    assert.ok(cognitoCall.init.signal instanceof AbortSignal);

    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.dependencies.ches.status, 'ok');
    assert.strictEqual(result.dependencies.objectStorage.status, 'ok');
    assert.strictEqual(result.dependencies.federatedAuth.status, 'ok');
  });

  test('marks dependency as error when checks fail', async () => {
    mockFetch((url, init) =>
      init.method === 'POST' ? new Response('', { status: 500, statusText: 'fail' }) : ok(),
    );
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists: async () => false };
    });

    const service = loadService();
    const result = await service.getHealthStatus({ forceRefresh: true });

    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.dependencies.ches.status, 'error');
    assert.strictEqual(result.dependencies.ches.error, '500 fail');
    assert.strictEqual(result.dependencies.federatedAuth.status, 'ok');
    assert.strictEqual(result.dependencies.objectStorage.status, 'error');
  });

  test('forceRefresh bypasses cached snapshot', async () => {
    let tokenStatus = 200;
    mockFetch((url, init) =>
      init.method === 'POST' ? new Response('{}', { status: tokenStatus }) : ok(),
    );
    const bucketExists = mock.fn(async () => true);
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists };
    });

    const service = loadService();
    await service.getHealthStatus({ forceRefresh: true });

    tokenStatus = 500;

    const cached = await service.getHealthStatus();
    assert.strictEqual(cached.status, 'ok');

    const refreshed = await service.getHealthStatus({ forceRefresh: true });
    assert.strictEqual(refreshed.status, 'error');
  });

  test('reports the error code for network failures and timeouts', async () => {
    mockFetch((url, init) => {
      if (init.method === 'POST') {
        const cause = Object.assign(new Error('getaddrinfo ENOTFOUND example.com'), {
          code: 'ENOTFOUND',
        });
        throw new TypeError('fetch failed', { cause });
      }
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    });
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists: async () => true };
    });

    const service = loadService();
    const result = await service.getHealthStatus({ forceRefresh: true });

    assert.strictEqual(result.dependencies.ches.error, 'ENOTFOUND');
    assert.strictEqual(result.dependencies.federatedAuth.error, 'ECONNABORTED');
  });
});
