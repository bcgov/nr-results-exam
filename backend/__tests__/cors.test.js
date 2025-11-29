const {
  test, describe, beforeEach, afterEach
} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Import the CORS configuration logic from index.js
// We'll need to replicate the getCorsOptions function for testing
function getCorsOptions(whitelist) {
  return (req) => ({
    origin: function (origin, callback) {
      // Allow requests with no origin only if they come from the internal proxy
      if (!origin) {
        if (req.headers['x-forwarded-by'] === 'caddy-proxy') {
          return callback(null, true);
        }
        return callback(new Error('CORS: Requests with no origin must come from trusted proxy'));
      }
      
      // Check if origin matches any whitelisted domain (by hostname)
      try {
        const originUrl = new URL(origin);
        const isAllowed = whitelist.some((allowed) => {
          try {
            const allowedUrl = new URL(allowed);
            const getEffectivePort = (url) => {
              if (url.port) return url.port;
              if (url.protocol === 'http:') return '80';
              if (url.protocol === 'https:') return '443';
              return '';
            };
            return (
              originUrl.hostname === allowedUrl.hostname &&
              getEffectivePort(originUrl) === getEffectivePort(allowedUrl)
            );
          } catch (_e) {
            const [allowedHost, allowedPort] = allowed.split(':');
            if (allowedPort) {
              return (
                originUrl.hostname === allowedHost &&
                originUrl.port === allowedPort
              );
            } else {
              return originUrl.hostname === allowedHost;
            }
          }
        });
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch (_e) {
        callback(new Error('Not allowed by CORS'));
      }
    }
  });
}

function buildApp(whitelist) {
  const app = express();
  app.use(express.json());
  app.use(cors(getCorsOptions(whitelist)));
  
  app.get('/api/test', (req, res) => {
    res.json({ success: true });
  });
  
  return app;
}

describe('CORS Configuration', () => {
  test('should allow requests from whitelisted origin', async () => {
    const whitelist = ['http://localhost:3000'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should reject requests from non-whitelisted origin', async () => {
    const whitelist = ['http://localhost:3000'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'http://malicious-site.com')
      .expect(500); // CORS error results in 500

    // CORS middleware will reject, but Express will handle it
    // The exact error handling depends on CORS middleware behavior
  });

  test('should allow requests with no origin if X-Forwarded-By header is present', async () => {
    const whitelist = ['http://localhost:3000'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('X-Forwarded-By', 'caddy-proxy')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should reject requests with no origin if X-Forwarded-By header is missing', async () => {
    const whitelist = ['http://localhost:3000'];
    const app = buildApp(whitelist);

    // Request without Origin header and without X-Forwarded-By
    const response = await request(app)
      .get('/api/test')
      .expect(500); // CORS error

    // Should be rejected
  });

  test('should match origins by hostname and port', async () => {
    const whitelist = ['http://localhost:3000'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should match origins by hostname when port is default HTTP', async () => {
    const whitelist = ['http://localhost'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:80')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should match origins by hostname when port is default HTTPS', async () => {
    const whitelist = ['https://example.com'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'https://example.com:443')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should handle multiple whitelisted origins', async () => {
    const whitelist = ['http://localhost:3000', 'https://production.example.com'];
    const app = buildApp(whitelist);

    // Test first origin
    const response1 = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    assert.strictEqual(response1.body.success, true);

    // Test second origin
    const response2 = await request(app)
      .get('/api/test')
      .set('Origin', 'https://production.example.com')
      .expect(200);

    assert.strictEqual(response2.body.success, true);
  });

  test('should handle whitelist entries with hostname:port format', async () => {
    const whitelist = ['localhost:3000'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should handle whitelist entries with hostname only', async () => {
    const whitelist = ['localhost'];
    const app = buildApp(whitelist);

    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    assert.strictEqual(response.body.success, true);
  });

  test('should reject invalid origin URLs', async () => {
    const whitelist = ['http://localhost:3000'];
    const app = buildApp(whitelist);

    // This will be caught by the try-catch in getCorsOptions
    const response = await request(app)
      .get('/api/test')
      .set('Origin', 'not-a-valid-url')
      .expect(500);

    // Should be rejected due to invalid URL format
  });
});

