const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');

// Import the health routes
const healthRoutes = require('../routes/healthRoutes');

describe('Health Routes', () => {
  test('GET /health should return 200 with uptime and message', async () => {
    const app = express();
    app.use('/health', healthRoutes);

    const response = await request(app)
      .get('/health')
      .expect(200);

    assert.strictEqual(response.body.message, 'OK');
    assert(typeof response.body.uptime === 'number');
    assert(typeof response.body.timestamp === 'number');
    assert(response.body.uptime >= 0);
  });

  test('GET /health should return valid JSON', async () => {
    const app = express();
    app.use('/health', healthRoutes);

    const response = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.deepStrictEqual(Object.keys(response.body).sort(), ['message', 'timestamp', 'uptime'].sort());
  });
});

