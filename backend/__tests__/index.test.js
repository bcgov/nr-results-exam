const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');

// Import the index routes
const indexRoutes = require('../routes/indexRoutes');

describe('Index Routes', () => {
  test('GET /api/ should return 200 with status and success', async () => {
    const app = express();
    app.use('/api', indexRoutes);

    const response = await request(app)
      .get('/api/')
      .expect(200);

    assert.strictEqual(response.body.status, 200);
    assert.strictEqual(response.body.success, true);
  });
});

