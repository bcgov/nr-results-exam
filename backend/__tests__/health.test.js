const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');

// Import the health routes
const healthRoutes = require('../routes/healthRoutes');
const dependencyHealth = require('../services/dependencyHealth');

describe('Health Routes', () => {
  test('GET /health should return dependency snapshot', async () => {
    const app = express();
    app.use('/health', healthRoutes);

    const response = await request(app)
      .get('/health')
      .expect(200);

    assert.strictEqual(response.body.status, 'ok');
    assert(typeof response.body.uptime === 'number');
    assert(typeof response.body.timestamp === 'number');
    assert.deepStrictEqual(
      Object.keys(response.body.dependencies).sort(),
      ['ches', 'federatedAuth', 'objectStorage'].sort()
    );
    assert.strictEqual(response.body.dependencies.ches.status, 'skipped');
  });

  test('GET /health should return 503 when dependency fails', async () => {
    const app = express();
    app.use('/health', healthRoutes);

    const restore = mock.method(dependencyHealth, 'getHealthStatus', () =>
      Promise.resolve({
        status: 'error',
        checkedAt: Date.now(),
        dependencies: {
          ches: { status: 'error', error: 'boom' },
          federatedAuth: { status: 'ok' },
          objectStorage: { status: 'ok' }
        }
      })
    );

    const response = await request(app)
      .get('/health')
      .expect(503);

    assert.strictEqual(response.body.status, 'error');
    restore.mock.restore();
  });

  test('GET /health?deep=true should trigger fresh check', async () => {
    const app = express();
    app.use('/health', healthRoutes);

    const restore = mock.method(dependencyHealth, 'getHealthStatus', ({ forceRefresh }) =>
      Promise.resolve({
        status: forceRefresh ? 'ok' : 'error',
        checkedAt: Date.now(),
        dependencies: {
          ches: { status: 'skipped' },
          federatedAuth: { status: 'skipped' },
          objectStorage: { status: 'skipped' }
        }
      })
    );

    const response = await request(app)
      .get('/health?deep=true')
      .expect(200);

    assert.strictEqual(response.body.status, 'ok');
    restore.mock.restore();
  });
});

