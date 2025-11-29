const {
  test, describe, beforeEach, afterEach
} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/authMiddleware');

// Store original environment variables
const originalEnv = {
  userPoolId: process.env.VITE_USER_POOLS_ID,
  cognitoRegion: process.env.VITE_COGNITO_REGION,
  hasUserPoolId: Object.prototype.hasOwnProperty.call(process.env, 'VITE_USER_POOLS_ID'),
  hasCognitoRegion: Object.prototype.hasOwnProperty.call(process.env, 'VITE_COGNITO_REGION')
};

function buildAppWithRateLimit(limitConfig, routePath, routeHandler) {
  const app = express();
  app.use(express.json());
  
  const limiter = rateLimit(limitConfig);
  app.use(routePath, limiter, authenticateToken, routeHandler);
  
  return app;
}

function createMockToken() {
  return 'mock-jwt-token';
}

describe('Rate Limiting', { concurrency: 1 }, () => {
  beforeEach(() => {
    process.env.VITE_USER_POOLS_ID = 'test-pool-id';
    process.env.VITE_COGNITO_REGION = 'ca-central-1';
  });

  afterEach(() => {
    if (originalEnv.hasUserPoolId) {
      process.env.VITE_USER_POOLS_ID = originalEnv.userPoolId;
    } else {
      delete process.env.VITE_USER_POOLS_ID;
    }

    if (originalEnv.hasCognitoRegion) {
      process.env.VITE_COGNITO_REGION = originalEnv.cognitoRegion;
    } else {
      delete process.env.VITE_COGNITO_REGION;
    }
  });

  test('should enforce rate limit on questions endpoint (100 requests per 15 minutes)', async () => {
    const questionsHandler = (req, res) => {
      res.json({ success: true });
    };

    const app = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 2, // Low limit for testing
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/questions',
      questionsHandler
    );

    // Make requests up to the limit
    for (let i = 0; i < 2; i++) {
      const response = await request(app)
        .get('/api/questions/test')
        .set('Authorization', `Bearer ${createMockToken()}`)
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.headers['ratelimit-limit']);
      assert.ok(response.headers['ratelimit-remaining']);
    }

    // Next request should be rate limited
    const rateLimitedResponse = await request(app)
      .get('/api/questions/test')
      .set('Authorization', `Bearer ${createMockToken()}`)
      .expect(429);

    assert.strictEqual(rateLimitedResponse.body.error, 'Too many requests, please try again later.');
    assert.ok(rateLimitedResponse.headers['ratelimit-limit']);
    assert.ok(rateLimitedResponse.headers['ratelimit-remaining']);
    assert.ok(rateLimitedResponse.headers['ratelimit-reset']);
  });

  test('should enforce rate limit on mail endpoint (20 requests per 15 minutes)', async () => {
    const mailHandler = (req, res) => {
      res.json({ success: true });
    };

    const app = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 2, // Low limit for testing
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/mail',
      mailHandler
    );

    // Make requests up to the limit
    for (let i = 0; i < 2; i++) {
      const response = await request(app)
        .post('/api/mail')
        .set('Authorization', `Bearer ${createMockToken()}`)
        .send({
          fromEmail: 'test@example.com',
          toEmails: ['recipient@example.com'],
          subject: 'Test',
          mailBody: '<p>Test</p>'
        })
        .expect(200);

      assert.strictEqual(response.body.success, true);
    }

    // Next request should be rate limited
    const rateLimitedResponse = await request(app)
      .post('/api/mail')
      .set('Authorization', `Bearer ${createMockToken()}`)
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test',
        mailBody: '<p>Test</p>'
      })
      .expect(429);

    assert.strictEqual(rateLimitedResponse.body.error, 'Too many requests, please try again later.');
  });

  test('should include rate limit headers in successful responses', async () => {
    const handler = (req, res) => {
      res.json({ success: true });
    };

    const app = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/test',
      handler
    );

    const response = await request(app)
      .get('/api/test')
      .set('Authorization', `Bearer ${createMockToken()}`)
      .expect(200);

    assert.ok(response.headers['ratelimit-limit'], 'Should include RateLimit-Limit header');
    assert.ok(response.headers['ratelimit-remaining'], 'Should include RateLimit-Remaining header');
    assert.ok(response.headers['ratelimit-reset'], 'Should include RateLimit-Reset header');
    assert.strictEqual(response.headers['ratelimit-limit'], '100');
  });

  test('should not include legacy rate limit headers', async () => {
    const handler = (req, res) => {
      res.json({ success: true });
    };

    const app = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/test',
      handler
    );

    const response = await request(app)
      .get('/api/test')
      .set('Authorization', `Bearer ${createMockToken()}`)
      .expect(200);

    assert.strictEqual(response.headers['x-ratelimit-limit'], undefined, 'Should not include legacy X-RateLimit-Limit header');
    assert.strictEqual(response.headers['x-ratelimit-remaining'], undefined, 'Should not include legacy X-RateLimit-Remaining header');
  });
});

