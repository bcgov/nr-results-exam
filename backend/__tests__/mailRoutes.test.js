const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');

// Track axios.post calls
let axiosPostCalls = [];

// Create a mock axios that tracks calls
const mockAxios = {
  post: async (...args) => {
    axiosPostCalls.push(args);
    // Return mock responses based on call order
    if (axiosPostCalls.length === 1) {
      // First call: token request
      return { data: { access_token: 'mock-token' } };
    } else if (axiosPostCalls.length === 2) {
      // Second call: email send
      return { data: { messageId: 'mock-message-id' } };
    }
    return { data: {} };
  }
};

// Replace axios in the module cache before requiring routes
const mailControllers = require('../controllers/mailControllers');
const originalAxios = require('axios');

// We need to stub axios at the controller level
// Since we can't easily mock it after import, we'll test the integration
// and verify the axios calls by checking the actual behavior

// Clear require cache and re-require with mock
delete require.cache[require.resolve('axios')];
delete require.cache[require.resolve('../controllers/mailControllers')];
delete require.cache[require.resolve('../routes/mailRoutes')];

// Set up axios mock
require.cache[require.resolve('axios')] = {
  exports: mockAxios,
  loaded: true
};

// Re-require routes with mocked axios
const mailRoutes = require('../routes/mailRoutes');

describe('Mail Routes', () => {
  let app;

  test('POST /api/mail should send email successfully', async () => {
    axiosPostCalls = [];
    app = express();
    app.use(express.json());
    app.use('/api/mail', mailRoutes);

    const emailData = {
      fromEmail: 'test@example.com',
      toEmails: ['recipient@example.com'],
      subject: 'Test Subject',
      mailBody: '<p>Test body</p>'
    };

    const response = await request(app)
      .post('/api/mail')
      .send(emailData)
      .expect(200);

    assert.strictEqual(response.body.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.message, 'Email sent successfully');
    assert(response.body.emailSent);
  });

  test('POST /api/mail should call token endpoint with correct parameters', async () => {
    // Set environment variables for the test
    process.env.CHES_CLIENT_ID = 'test-client-id';
    process.env.CHES_CLIENT_SECRET = 'test-client-secret';
    
    axiosPostCalls = [];
    app = express();
    app.use(express.json());
    app.use('/api/mail', mailRoutes);

    const emailData = {
      fromEmail: 'test@example.com',
      toEmails: ['recipient@example.com'],
      subject: 'Test Subject',
      mailBody: '<p>Test body</p>'
    };

    await request(app)
      .post('/api/mail')
      .send(emailData)
      .expect(200);

    // Verify token request was made with correct parameters
    assert.strictEqual(axiosPostCalls.length, 2, 'Should have 2 axios.post calls (token + email)');
    
    const [tokenUrl, tokenPayload, tokenConfig] = axiosPostCalls[0];
    
    // Verify token endpoint URL
    assert.strictEqual(
      tokenUrl,
      'https://test.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token',
      'Token endpoint URL should match'
    );
    
    // Verify payload
    assert.strictEqual(tokenPayload, 'grant_type=client_credentials', 'Token payload should be grant_type=client_credentials');
    
    // Verify headers
    assert.strictEqual(
      tokenConfig.headers['Content-Type'],
      'application/x-www-form-urlencoded',
      'Token request Content-Type should be application/x-www-form-urlencoded'
    );
    
    // Verify auth credentials exist
    assert(tokenConfig.auth, 'Token request should include auth credentials');
    assert.strictEqual(tokenConfig.auth.username, 'test-client-id', 'Token request username should match CHES_CLIENT_ID');
    assert.strictEqual(tokenConfig.auth.password, 'test-client-secret', 'Token request password should match CHES_CLIENT_SECRET');
  });

  test('POST /api/mail should call email endpoint with correct parameters', async () => {
    axiosPostCalls = [];
    app = express();
    app.use(express.json());
    app.use('/api/mail', mailRoutes);

    const emailData = {
      fromEmail: 'test@example.com',
      toEmails: ['recipient@example.com'],
      subject: 'Test Subject',
      mailBody: '<p>Test body</p>'
    };

    await request(app)
      .post('/api/mail')
      .send(emailData)
      .expect(200);

    // Verify email send request was made with correct parameters
    assert.strictEqual(axiosPostCalls.length, 2, 'Should have 2 axios.post calls (token + email)');
    
    const [emailUrl, emailPayload, emailConfig] = axiosPostCalls[1];
    
    // Verify email endpoint URL
    assert.strictEqual(
      emailUrl,
      'https://ches-test.api.gov.bc.ca/api/v1/email',
      'Email endpoint URL should match'
    );
    
    // Verify email payload structure
    assert.strictEqual(emailPayload.from, 'test@example.com', 'Email from should match request');
    assert.deepStrictEqual(emailPayload.to, ['recipient@example.com'], 'Email to should match request');
    assert.strictEqual(emailPayload.subject, 'Test Subject', 'Email subject should match request');
    assert.strictEqual(emailPayload.body, '<p>Test body</p>', 'Email body should match request');
    assert.strictEqual(emailPayload.bodyType, 'html', 'Email bodyType should be html');
    assert.deepStrictEqual(emailPayload.bcc, [], 'Email bcc should be empty array');
    assert.deepStrictEqual(emailPayload.cc, [], 'Email cc should be empty array');
    assert.strictEqual(emailPayload.encoding, 'utf-8', 'Email encoding should be utf-8');
    assert.strictEqual(emailPayload.priority, 'normal', 'Email priority should be normal');
    assert(emailPayload.tag, 'Email should have a tag');
    assert(emailPayload.tag.startsWith('email_'), 'Email tag should start with email_');
    
    // Verify headers
    assert.strictEqual(
      emailConfig.headers['Content-Type'],
      'application/json',
      'Email request Content-Type should be application/json'
    );
    assert.strictEqual(
      emailConfig.headers['Authorization'],
      'Bearer mock-token',
      'Email request Authorization header should include Bearer token from first call'
    );
  });

  test('POST /api/mail should return 400 if fromEmail is missing', async () => {
    axiosPostCalls = [];
    app = express();
    app.use(express.json());
    app.use('/api/mail', mailRoutes);

    const emailData = {
      toEmails: ['recipient@example.com'],
      subject: 'Test Subject',
      mailBody: '<p>Test body</p>'
    };

    const response = await request(app)
      .post('/api/mail')
      .send(emailData)
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Missing required field: fromEmail');
    
    // Verify no axios calls were made when validation fails
    assert.strictEqual(axiosPostCalls.length, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if toEmails is missing', async () => {
    axiosPostCalls = [];
    app = express();
    app.use(express.json());
    app.use('/api/mail', mailRoutes);

    const emailData = {
      fromEmail: 'test@example.com',
      subject: 'Test Subject',
      mailBody: '<p>Test body</p>'
    };

    const response = await request(app)
      .post('/api/mail')
      .send(emailData)
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.message.includes('toEmails'), 'Error message should mention toEmails');
    
    // Verify no axios calls were made when validation fails
    assert.strictEqual(axiosPostCalls.length, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if toEmails is empty array', async () => {
    axiosPostCalls = [];
    app = express();
    app.use(express.json());
    app.use('/api/mail', mailRoutes);

    const emailData = {
      fromEmail: 'test@example.com',
      toEmails: [],
      subject: 'Test Subject',
      mailBody: '<p>Test body</p>'
    };

    const response = await request(app)
      .post('/api/mail')
      .send(emailData)
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.message.includes('toEmails'), 'Error message should mention toEmails');
    
    // Verify no axios calls were made when validation fails
    assert.strictEqual(axiosPostCalls.length, 0, 'Should not make axios calls when validation fails');
  });
});
