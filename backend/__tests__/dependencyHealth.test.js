const { describe, test, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
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
  'VITE_COGNITO_REGION'
];

const ORIGINAL_ENV = {};

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
    mock.method(axios, 'post', async () => ({}));
    mock.method(axios, 'get', async () => ({}));
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists: async () => true };
    });

    const service = loadService();
    const result = await service.getHealthStatus({ forceRefresh: true });

    assert.strictEqual(result.status, 'ok');
    assert.strictEqual(result.dependencies.ches.status, 'ok');
    assert.strictEqual(result.dependencies.objectStorage.status, 'ok');
    assert.strictEqual(result.dependencies.federatedAuth.status, 'ok');
  });

  test('marks dependency as error when checks fail', async () => {
    mock.method(axios, 'post', async () => {
      throw Object.assign(new Error('boom'), { response: { status: 500, statusText: 'fail' } });
    });
    mock.method(axios, 'get', async () => ({}));
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists: async () => false };
    });

    const service = loadService();
    const result = await service.getHealthStatus({ forceRefresh: true });

    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.dependencies.ches.status, 'error');
    assert.strictEqual(result.dependencies.objectStorage.status, 'error');
  });

  test('forceRefresh bypasses cached snapshot', async () => {
    const postMock = mock.method(axios, 'post', async () => ({}));
    mock.method(axios, 'get', async () => ({}));
    const bucketExists = mock.fn(async () => true);
    mock.method(Minio, 'Client', function FakeClient() {
      return { bucketExists };
    });

    const service = loadService();
    await service.getHealthStatus({ forceRefresh: true });

    postMock.mock.mockImplementation(async () => {
      throw Object.assign(new Error('later'), { response: { status: 500, statusText: 'fail' } });
    });

    const cached = await service.getHealthStatus();
    assert.strictEqual(cached.status, 'ok');

    const refreshed = await service.getHealthStatus({ forceRefresh: true });
    assert.strictEqual(refreshed.status, 'error');
  });
});

