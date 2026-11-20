const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');

// Store original require to restore module later
const Module = require('module');
const originalRequire = Module.prototype.require;

// Store original environment variables
const originalEnv = {
  issuerUri: process.env.KEYCLOAK_ISSUER_URI,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  hasIssuerUri: Object.prototype.hasOwnProperty.call(process.env, 'KEYCLOAK_ISSUER_URI'),
  hasClientId: Object.prototype.hasOwnProperty.call(process.env, 'KEYCLOAK_CLIENT_ID'),
};

/**
 * Create a test Express app with authentication middleware
 */
function buildApp(mockJwt, mockJwks) {
  // Clear the require cache for the middleware module to pick up the mock
  delete require.cache[require.resolve('../middleware/authMiddleware')];

  // Mock the jsonwebtoken module if mockJwt is provided
  Module.prototype.require = function (id) {
    if (id === 'jsonwebtoken' && mockJwt) {
      return mockJwt;
    }
    if (id === 'jwks-rsa' && mockJwks) {
      return mockJwks;
    }
    return originalRequire.apply(this, arguments);
  };

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
      user: req.user,
    });
  });

  return app;
}

describe('Authentication Middleware', { concurrency: 1 }, () => {
  beforeEach(() => {
    sinon.restore();
    process.env.KEYCLOAK_ISSUER_URI = 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard';
    process.env.KEYCLOAK_CLIENT_ID = 'test-client-id';
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
    delete require.cache[require.resolve('../middleware/authMiddleware')];

    if (originalEnv.hasIssuerUri) {
      process.env.KEYCLOAK_ISSUER_URI = originalEnv.issuerUri;
    } else {
      delete process.env.KEYCLOAK_ISSUER_URI;
    }

    if (originalEnv.hasClientId) {
      process.env.KEYCLOAK_CLIENT_ID = originalEnv.clientId;
    } else {
      delete process.env.KEYCLOAK_CLIENT_ID;
    }
  });

  test('should deny access when no authorization header is provided', async () => {
    const response = await request(buildApp()).get('/protected').expect(401);

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
    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer ')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication required');
    assert.strictEqual(response.body.error, 'No token provided');
  });

  test('should return 500 when Keycloak issuer URI is not configured', async () => {
    delete process.env.KEYCLOAK_ISSUER_URI;

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer mock-token')
      .expect(500);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication configuration error');
    assert.strictEqual(response.body.error, 'Keycloak issuer URI not configured');
  });

  test('should return 500 when Keycloak client ID is not configured', async () => {
    delete process.env.KEYCLOAK_CLIENT_ID;

    const response = await request(buildApp())
      .get('/protected')
      .set('Authorization', 'Bearer mock-token')
      .expect(500);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication configuration error');
    assert.strictEqual(response.body.error, 'Keycloak client ID not configured');
  });

  test('should deny access with invalid token', async () => {
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        callback(error);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Invalid token');
    assert.strictEqual(response.body.error, 'Invalid or expired token');
  });

  test('should deny access with expired token', async () => {
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        callback(error);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer expired-token')
      .expect(401);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Token expired');
    assert.strictEqual(response.body.error, 'Your session has expired. Please log in again.');
  });

  test('should reject token with mismatched azp (authorized party)', async () => {
    const mockPayload = {
      sub: 'user-sub-123',
      azp: 'different-app-client-id',
      email: 'user@example.com',
    };

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token-wrong-azp')
      .expect(401);

    assert.strictEqual(response.body.message, 'Invalid token');
  });

  test('should reject token missing azp', async () => {
    const mockPayload = {
      sub: 'user-sub-123',
      email: 'user@example.com',
    };

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer token-without-azp')
      .expect(401);

    assert.strictEqual(response.body.message, 'Invalid token');
  });

  test('should allow access with valid token matching azp', async () => {
    const mockPayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      azp: 'test-client-id',
      email: 'testuser@example.com',
      idir_username: 'jsmith',
      idir_user_guid: '11223344-5566-7788-9900-aabbccddeeff',
      display_name: 'Smith, John',
      identity_provider: 'azureidir',
      client_roles: ['RESULTS_USER', 'FAM:EXPIRES:2026-12-31:RESULTS_USER'],
    };

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.message, 'Access granted');
    assert.strictEqual(response.body.user.email, 'testuser@example.com');
    // Username casing preserved exactly as issued
    assert.strictEqual(response.body.user.username, 'jsmith');
    assert.strictEqual(response.body.user.displayName, 'Smith, John');
    // azureidir normalized to IDIR
    assert.strictEqual(response.body.user.idpProvider, 'IDIR');
    // GUID uppercased
    assert.strictEqual(response.body.user.userGuid, '11223344-5566-7788-9900-AABBCCDDEEFF');
    // FAM: bookkeeping roles filtered out
    assert.deepStrictEqual(response.body.user.roles, ['RESULTS_USER']);
  });

  test('should normalize idir and uppercase lower-case GUID', async () => {
    const mockPayload = {
      sub: '1234',
      azp: 'test-client-id',
      idir_username: 'JDOE',
      idir_user_guid: 'abcdef12-3456-7890-abcd-ef1234567890',
      identity_provider: 'idir',
    };

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer token')
      .expect(200);

    assert.strictEqual(response.body.user.idpProvider, 'IDIR');
    assert.strictEqual(response.body.user.username, 'JDOE');
    assert.strictEqual(response.body.user.userGuid, 'ABCDEF12-3456-7890-ABCD-EF1234567890');
  });

  test('should normalize bceidbusiness and extract BCeID claims', async () => {
    const mockPayload = {
      sub: '5678',
      azp: 'test-client-id',
      bceid_username: 'biz_user',
      bceid_user_guid: 'bc1234-abcd',
      name: 'Business User',
      identity_provider: 'bceidbusiness',
      resource_access: {
        'test-client-id': {
          roles: ['EXAM_TAKER'],
        },
      },
    };

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer token')
      .expect(200);

    assert.strictEqual(response.body.user.idpProvider, 'BCEIDBUSINESS');
    assert.strictEqual(response.body.user.username, 'biz_user');
    assert.strictEqual(response.body.user.userGuid, 'BC1234-ABCD');
    assert.strictEqual(response.body.user.displayName, 'Business User');
    assert.deepStrictEqual(response.body.user.roles, ['EXAM_TAKER']);
  });

  test('should accept token without Bearer prefix', async () => {
    const mockPayload = {
      sub: '1234',
      azp: 'test-client-id',
      email: 'test@example.com',
      preferred_username: 'user1',
    };

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(null, mockPayload);
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'token-without-bearer')
      .expect(200);

    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.user.username, 'user1');
  });

  test('should handle generic verification errors', async () => {
    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        callback(new Error('Generic verification error'));
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer problematic-token')
      .expect(500);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication configuration error');
    assert.strictEqual(response.body.error, 'Unable to verify token');
  });

  test('should handle synchronous errors from jwt.verify', async () => {
    const mockJwt = {
      verify: () => {
        throw new Error('Synchronous verification failure');
      },
    };

    const response = await request(buildApp(mockJwt))
      .get('/protected')
      .set('Authorization', 'Bearer token')
      .expect(500);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication configuration error');
    assert.strictEqual(response.body.error, 'Unable to verify token');
  });

  test('should obtain signing key from Keycloak certs endpoint', async () => {
    let jwksClientCalls = 0;
    let lastJwksOptions = null;
    let getSigningKeyCalls = 0;

    const mockPayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      azp: 'test-client-id',
      email: 'jwksuser@example.com',
      idir_username: 'jwksuser',
      identity_provider: 'idir',
    };

    const mockJwks = sinon.stub().callsFake((options) => {
      jwksClientCalls += 1;
      lastJwksOptions = options;
      return {
        getSigningKey: sinon.stub().callsFake((kid, callback) => {
          getSigningKeyCalls += 1;
          assert.strictEqual(kid, 'test-kid');
          callback(null, { publicKey: 'mock-public-key' });
        }),
      };
    });

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        assert.strictEqual(options.algorithms[0], 'RS256');
        assert.strictEqual(options.issuer, 'https://dev.loginproxy.gov.bc.ca/auth/realms/standard');
        getKey({ kid: 'test-kid' }, (err, signingKey) => {
          assert.ifError(err);
          assert.strictEqual(signingKey, 'mock-public-key');
          callback(null, mockPayload);
        });
      },
    };

    const app = buildApp(mockJwt, mockJwks);

    await request(app).get('/protected').set('Authorization', 'Bearer valid-token').expect(200);

    // Second request should reuse cached JWKS client
    await request(app).get('/protected').set('Authorization', 'Bearer valid-token').expect(200);

    assert.strictEqual(jwksClientCalls, 1);
    assert.strictEqual(getSigningKeyCalls, 2);
    assert.strictEqual(
      lastJwksOptions.jwksUri,
      'https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/certs',
    );
  });

  test('should return 500 when JWKS signing key retrieval fails', async () => {
    const mockJwks = () => ({
      getSigningKey: (kid, callback) => {
        callback(new Error('JWKS key retrieval failed'));
      },
    });

    const mockJwt = {
      verify: (token, getKey, options, callback) => {
        getKey({ kid: 'bad-kid' }, (err) => {
          callback(err);
        });
      },
    };

    const response = await request(buildApp(mockJwt, mockJwks))
      .get('/protected')
      .set('Authorization', 'Bearer token')
      .expect(500);

    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Authentication configuration error');
    assert.strictEqual(response.body.error, 'Unable to verify token');
  });
});
