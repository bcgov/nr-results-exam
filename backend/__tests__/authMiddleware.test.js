const {
  test, describe, beforeEach, afterEach
} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');

// Store original require to restore module later
const Module = require('module');
const originalRequire = Module.prototype.require;

// Store original environment variables
const originalEnv = {
  userPoolId: process.env.VITE_USER_POOLS_ID,
  cognitoRegion: process.env.VITE_COGNITO_REGION,
  hasUserPoolId: Object.prototype.hasOwnProperty.call(process.env, 'VITE_USER_POOLS_ID'),
  hasCognitoRegion: Object.prototype.hasOwnProperty.call(process.env, 'VITE_COGNITO_REGION')
};

/**
 * Create a test Express app with authentication middleware
 */
function buildApp(mockJwt) {
  // Clear the require cache for the middleware module to pick up the mock
  delete require.cache[require.resolve('../middleware/authMiddleware')];
  
  // Mock the jsonwebtoken module if mockJwt is provided
  if (mockJwt) {
    Module.prototype.require = function (id) {
      if (id === 'jsonwebtoken') {
        return mockJwt;
      }
      return originalRequire.apply(this, arguments);
    };
  }
  
  const { authenticateToken } = require('../middleware/authMiddleware');
  
  // Restore original require
  Module.prototype.require = originalRequire;
  
  const app = express();
  app.use(express.json());
  
  // Protected route
  app.get('/protected', authenticateToken, (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Access granted',
      user: req.user
    });
  });
  
  return app;
}

describe('Authentication Middleware', { concurrency: 1 }, () => {
  beforeEach(() => {
    sinon.restore();
    process.env.VITE_USER_POOLS_ID = 'ca-central-1_TestPool123';
    process.env.VITE_COGNITO_REGION = 'ca-central-1';
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
    // Clear require cache
    delete require.cache[require.resolve('../middleware/authMiddleware')];
    
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

  test('should deny access when no authorization header is provided', async () => {
    const response = await request(buildApp())
      .get('/protected')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication required');
    assert.strictEqual(response.body.error, 'No authorization header provided');
  });

  test('should deny access when authorization header is empty', async () => {
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', '')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication required');
  });

  test('should deny access when Bearer prefix is provided without token', async () => {
    // For this test, we need to build app without mock since we're testing the validation logic
    // Clear cache first
    delete require.cache[require.resolve('../middleware/authMiddleware')];
    
    const { authenticateToken } = require('../middleware/authMiddleware');
    const app = express();
    app.use(express.json());
    app.get('/protected', authenticateToken, (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Access granted',
        user: req.user
      });
    });
    
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer ')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    // Empty token after "Bearer " will be caught by early validation
    // Note: In some cases it may reach JWT validation which also properly rejects it
    assert(response.body.message === 'Authentication required' || response.body.message === 'Invalid token',
      `Expected 'Authentication required' or 'Invalid token', got '${response.body.message}'`);
  });

  test('should return 500 when user pool is not configured', async () => {
    delete process.env.VITE_USER_POOLS_ID;
    
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer mock-token')
      .expect(500);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication configuration error');
    assert.strictEqual(response.body.error, 'User pool not configured');
  });

  test('should deny access with invalid token', async () => {
    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        callback(error);
      },
      JsonWebTokenError: class JsonWebTokenError extends Error {
        constructor(message) {
          super(message);
          this.name = 'JsonWebTokenError';
        }
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Invalid token');
    assert.strictEqual(response.body.error, 'Authentication failed');
  });

  test('should deny access with expired token', async () => {
    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        callback(error);
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer expired-token')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Token expired');
    assert.strictEqual(response.body.error, 'Your session has expired. Please log in again.');
  });

  test('should allow access with valid token', async () => {
    const mockPayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      email: 'testuser@example.com',
      'custom:idp_username': 'testuser',
      'custom:idp_display_name': 'Test User',
      'custom:idp_name': 'IDIR',
      'cognito:username': 'testuser'
    };

    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.message, 'Access granted');
    assert.strictEqual(response.body.user.email, 'testuser@example.com');
    assert.strictEqual(response.body.user.username, 'testuser');
    assert.strictEqual(response.body.user.displayName, 'Test User');
    assert.strictEqual(response.body.user.idpProvider, 'IDIR');
    assert.strictEqual(response.body.user.sub, '12345678-1234-1234-1234-123456789012');
  });

  test('should extract username from cognito:username when custom:idp_username is not available', async () => {
    const mockPayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      email: 'testuser@example.com',
      'cognito:username': 'cognitouser',
      'custom:idp_display_name': 'Test User',
      'custom:idp_name': 'BCEID'
    };

    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.user.username, 'cognitouser');
  });

  test('should accept token without Bearer prefix', async () => {
    const mockPayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      email: 'testuser@example.com',
      'custom:idp_username': 'testuser',
      'cognito:username': 'testuser'
    };

    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'valid-token-without-bearer')
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.user.email, 'testuser@example.com');
  });

  test('should handle generic verification errors', async () => {
    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(new Error('Generic verification error'));
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer problematic-token')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication failed');
    assert.strictEqual(response.body.error, 'Generic verification error');
  });

  test('should include token payload in req.user', async () => {
    const mockPayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      email: 'testuser@example.com',
      'custom:idp_username': 'testuser',
      'custom:idp_display_name': 'Test User',
      'custom:idp_name': 'IDIR',
      'cognito:username': 'testuser',
      'custom:roles': ['admin', 'user']
    };

    // Create mock JWT module
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      }
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.deepStrictEqual(response.body.user.tokenPayload['custom:roles'], ['admin', 'user']);
  });
});
