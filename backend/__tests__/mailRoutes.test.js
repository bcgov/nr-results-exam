const {
  test, describe, beforeEach, afterEach
} = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const axios = require('axios');

// Import routes
const mailRoutes = require('../routes/mailRoutes');

const originalEnv = {
  clientId: process.env.CHES_CLIENT_ID,
  clientSecret: process.env.CHES_CLIENT_SECRET,
  hasClientId: Object.prototype.hasOwnProperty.call(process.env, 'CHES_CLIENT_ID'),
  hasClientSecret: Object.prototype.hasOwnProperty.call(process.env, 'CHES_CLIENT_SECRET')
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/mail', mailRoutes);
  return app;
}

// Tests in this suite manipulate process.env (environment variables) in beforeEach/afterEach.
// To avoid race conditions and interference between tests, we must run them sequentially.
// Therefore, we set { concurrency: 1 } below. Do not remove unless environment variable usage is refactored.
// Tests in this suite mutate process.env credentials before and after each test.
// Running sequentially avoids race conditions between tests that read/write the same env vars.
describe('Mail Routes', { concurrency: 1 }, () => {
  beforeEach(() => {
    sinon.restore();
    process.env.CHES_CLIENT_ID = 'test-client-id';
    process.env.CHES_CLIENT_SECRET = 'test-client-secret';
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();

    if (originalEnv.hasClientId) {
      process.env.CHES_CLIENT_ID = originalEnv.clientId;
    } else {
      delete process.env.CHES_CLIENT_ID;
    }

    if (originalEnv.hasClientSecret) {
      process.env.CHES_CLIENT_SECRET = originalEnv.clientSecret;
    } else {
      delete process.env.CHES_CLIENT_SECRET;
    }
  });

  test('POST /api/mail should send email successfully', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).resolves({ data: { access_token: 'mock-token' } });
    axiosPostStub.onCall(1).resolves({ data: { messageId: 'mock-message-id' } });

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(200);

    assert.strictEqual(response.body.status, 200);
    assert.strictEqual(response.body.success, true);
    assert.strictEqual(response.body.message, 'Email sent successfully');
    assert(response.body.emailSent);
  });

  test('POST /api/mail should call token endpoint with correct parameters', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).resolves({ data: { access_token: 'mock-token' } });
    axiosPostStub.onCall(1).resolves({ data: { messageId: 'mock-message-id' } });

    await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(200);

    assert.strictEqual(axiosPostStub.callCount, 2, 'Should have 2 axios.post calls (token + email)');

    const tokenCall = axiosPostStub.getCall(0);
    const [tokenUrl, tokenPayload, tokenConfig] = tokenCall.args;

    assert.strictEqual(
      tokenUrl,
      'https://test.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token',
      'Token endpoint URL should match'
    );

    assert.strictEqual(tokenPayload, 'grant_type=client_credentials', 'Token payload should be grant_type=client_credentials');

    assert.strictEqual(
      tokenConfig.headers['Content-Type'],
      'application/x-www-form-urlencoded',
      'Token request Content-Type should be application/x-www-form-urlencoded'
    );

    assert(tokenConfig.auth, 'Token request should include auth credentials');
    assert.strictEqual(tokenConfig.auth.username, 'test-client-id', 'Token request username should match CHES_CLIENT_ID');
    assert.strictEqual(tokenConfig.auth.password, 'test-client-secret', 'Token request password should match CHES_CLIENT_SECRET');
  });

  test('POST /api/mail should call email endpoint with correct parameters', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).resolves({ data: { access_token: 'mock-token' } });
    axiosPostStub.onCall(1).resolves({ data: { messageId: 'mock-message-id' } });

    await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(200);

    assert.strictEqual(axiosPostStub.callCount, 2, 'Should have 2 axios.post calls (token + email)');

    const emailCall = axiosPostStub.getCall(1);
    const [emailUrl, emailPayload, emailConfig] = emailCall.args;

    assert.strictEqual(
      emailUrl,
      'https://ches-test.api.gov.bc.ca/api/v1/email',
      'Email endpoint URL should match'
    );

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
    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Missing required field: fromEmail');
    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if toEmails is missing', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.message.includes('toEmails'), 'Error message should mention toEmails');
    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if toEmails is not an array', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: 'recipient@example.com',
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.message.includes('toEmails'), 'Error message should mention toEmails');
    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if subject is missing', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        mailBody: '<p>Test body</p>'
      })
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Missing required field: subject');
    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if mailBody is missing', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject'
      })
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Missing required field: mailBody');
    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 400 if toEmails is empty array', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: [],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(400);

    assert.strictEqual(response.body.status, 400);
    assert.strictEqual(response.body.success, false);
    assert(response.body.message.includes('toEmails'), 'Error message should mention toEmails');
    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not make axios calls when validation fails');
  });

  test('POST /api/mail should return 500 if CHES credentials are missing', async () => {
    delete process.env.CHES_CLIENT_ID;
    delete process.env.CHES_CLIENT_SECRET;

    assert.strictEqual(process.env.CHES_CLIENT_ID, undefined);
    assert.strictEqual(process.env.CHES_CLIENT_SECRET, undefined);

    const axiosPostStub = sinon.stub(axios, 'post');

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(500);

    assert.strictEqual(axiosPostStub.callCount, 0, 'Should not call axios when credentials are missing');
    assert.strictEqual(response.body.status, 500);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Failed to send email');
    assert.strictEqual(response.body.error, 'CHES credentials are not configured');
  });

  test('POST /api/mail should return 500 if token request fails', async () => {
    const error = new Error('Unauthorized');
    error.response = { status: 401, data: { error: 'invalid_client' } };

    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).rejects(error);

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(500);

    assert.strictEqual(axiosPostStub.callCount, 1, 'Should stop after token failure');
    assert.strictEqual(response.body.status, 500);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Failed to send email');
    assert.match(response.body.error, /Failed to fetch token/);
  });

  test('POST /api/mail should return 500 if token request fails without response', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).rejects(new Error('Network error'));

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(500);

    assert.strictEqual(axiosPostStub.callCount, 1, 'Should stop after token failure');
    assert.strictEqual(response.body.status, 500);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Failed to send email');
    assert.strictEqual(response.body.error, 'Failed to fetch token');
  });

  test('POST /api/mail should return 500 if email send fails', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).resolves({ data: { access_token: 'mock-token' } });

    const emailError = new Error('Service unavailable');
    emailError.response = { status: 503, data: { error: 'ches_down' } };
    axiosPostStub.onCall(1).rejects(emailError);

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(500);

    assert.strictEqual(axiosPostStub.callCount, 2, 'Should attempt to send email after obtaining token');
    assert.strictEqual(response.body.status, 500);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Failed to send email');
    assert.match(response.body.error, /Failed to send email:/);
  });

  test('POST /api/mail should return 500 if email send fails without response', async () => {
    const axiosPostStub = sinon.stub(axios, 'post');
    axiosPostStub.onCall(0).resolves({ data: { access_token: 'mock-token' } });
    axiosPostStub.onCall(1).rejects(new Error('Socket hang up'));

    const response = await request(buildApp())
      .post('/api/mail')
      .send({
        fromEmail: 'test@example.com',
        toEmails: ['recipient@example.com'],
        subject: 'Test Subject',
        mailBody: '<p>Test body</p>'
      })
      .expect(500);

    assert.strictEqual(axiosPostStub.callCount, 2, 'Should attempt to send email after obtaining token');
    assert.strictEqual(response.body.status, 500);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.message, 'Failed to send email');
    assert.strictEqual(response.body.error, 'Failed to send email');
  });
});
