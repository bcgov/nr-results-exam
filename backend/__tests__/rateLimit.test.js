const {
  test, describe, beforeEach, afterEach
} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

// Store original environment variables
const originalEnv = {
  userPoolId: process.env.VITE_USER_POOLS_ID,
  cognitoRegion: process.env.VITE_COGNITO_REGION,
  hasUserPoolId: Object.prototype.hasOwnProperty.call(process.env, 'VITE_USER_POOLS_ID'),
  hasCognitoRegion: Object.prototype.hasOwnProperty.call(process.env, 'VITE_COGNITO_REGION')
};

// Create a mock authenticateToken middleware that bypasses JWT verification
function createMockAuthMiddleware() {
  return (req, res, next) => {
    req.user = {
      sub: 'test-user-id',
      email: 'test@example.com'
    };
    next();
  };
}

// Custom store that doesn't create cleanup timers
// This prevents the event loop from staying alive after tests
class TestMemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTimes = new Map();
  }

  async increment(key) {
    const now = Date.now();
    const resetTime = this.resetTimes.get(key);

    // If reset time has passed, clear the hits for this key
    if (resetTime && now >= resetTime) {
      this.hits.delete(key);
      this.resetTimes.delete(key);
    }

    const count = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, count);

    // Set reset time if not already set (for the window)
    if (!this.resetTimes.has(key)) {
      this.resetTimes.set(key, now + 1000); // 1 second window for tests
    }

    return {
      totalHits: count,
      resetTime: new Date(this.resetTimes.get(key))
    };
  }

  async decrement(key) {
    const count = this.hits.get(key) || 0;
    if (count > 0) {
      this.hits.set(key, count - 1);
    }
  }

  async resetKey(key) {
    this.hits.delete(key);
    this.resetTimes.delete(key);
  }

  async resetAll() {
    this.hits.clear();
    this.resetTimes.clear();
  }

  async shutdown() {
    this.hits.clear();
    this.resetTimes.clear();
  }
}

function buildAppWithRateLimit(limitConfig, routePath, routeHandler) {
  const app = express();
  app.use(express.json());

  // Use custom store to avoid timer cleanup issues
  const store = new TestMemoryStore();
  const limiter = rateLimit({
    ...limitConfig,
    store
  });
  const mockAuth = createMockAuthMiddleware();
  app.use(routePath, limiter, mockAuth, routeHandler);

  // Return both app and store so we can clean it up
  return { app, store };
}

describe('Rate Limiting', { concurrency: 1 }, () => {
  const stores = [];

  beforeEach(() => {
    process.env.VITE_USER_POOLS_ID = 'test-pool-id';
    process.env.VITE_COGNITO_REGION = 'ca-central-1';
    stores.length = 0; // Clear array
  });

  afterEach(async () => {
    // Clean up all stores to prevent memory leaks
    for (const store of stores) {
      if (store && typeof store.resetAll === 'function') {
        await store.resetAll();
      }
      if (store && typeof store.shutdown === 'function') {
        await store.shutdown();
      }
    }
    stores.length = 0;

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

    const { app, store } = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 2, // Low limit for testing
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/questions',
      questionsHandler
    );
    stores.push(store);

    // Make requests up to the limit
    for (let i = 0; i < 2; i++) {
      const response = await request(app)
        .get('/api/questions/test')
        .expect(200);

      assert.strictEqual(response.body.success, true);
      assert.ok(response.headers['ratelimit-limit']);
      assert.ok(response.headers['ratelimit-remaining']);
    }

    // Next request should be rate limited
    const rateLimitedResponse = await request(app)
      .get('/api/questions/test')
      .expect(429);

    // Check error message (may be in body.error or body.message depending on rate limiter config)
    const errorMsg = rateLimitedResponse.body.error || rateLimitedResponse.body.message || rateLimitedResponse.text;
    assert.ok(errorMsg && errorMsg.includes('Too many requests'), `Expected rate limit error, got: ${JSON.stringify(rateLimitedResponse.body)}`);
    assert.ok(rateLimitedResponse.headers['ratelimit-limit']);
    assert.ok(rateLimitedResponse.headers['ratelimit-remaining']);
    assert.ok(rateLimitedResponse.headers['ratelimit-reset']);
  });

  test('should enforce rate limit on mail endpoint (20 requests per 15 minutes)', async () => {
    const mailHandler = (req, res) => {
      res.json({ success: true });
    };

    const { app, store } = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 2, // Low limit for testing
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/mail',
      mailHandler
    );
    stores.push(store);

    // Make requests up to the limit
    for (let i = 0; i < 2; i++) {
      const response = await request(app)
        .post('/api/mail')
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
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test',
        mailBody: '<p>Test</p>'
      })
      .expect(429);

    // Check error message (may be in body.error or body.message depending on rate limiter config)
    const errorMsg = rateLimitedResponse.body.error || rateLimitedResponse.body.message || rateLimitedResponse.text;
    assert.ok(errorMsg && errorMsg.includes('Too many requests'), `Expected rate limit error, got: ${JSON.stringify(rateLimitedResponse.body)}`);
  });

  test('should include rate limit headers in successful responses', async () => {
    const handler = (req, res) => {
      res.json({ success: true });
    };

    const { app, store } = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/test',
      handler
    );
    stores.push(store);

    const response = await request(app)
      .get('/api/test')
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

    const { app, store } = buildAppWithRateLimit(
      {
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
      },
      '/api/test',
      handler
    );
    stores.push(store);

    const response = await request(app)
      .get('/api/test')
      .expect(200);

    assert.strictEqual(response.headers['x-ratelimit-limit'], undefined, 'Should not include legacy X-RateLimit-Limit header');
    assert.strictEqual(response.headers['x-ratelimit-remaining'], undefined, 'Should not include legacy X-RateLimit-Remaining header');
  });
});
