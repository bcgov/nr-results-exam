const request = require('supertest');
const app = require('../app');

// Mock axios to avoid making real HTTP requests
jest.mock('axios');
const axios = require('axios');

describe('Mail Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/mail', () => {
    it('should return 400 if fromEmail is missing', async () => {
      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          toEmails: ['test@example.com'],
          subject: 'Test',
          mailBody: '<p>Test</p>'
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 400,
        message: 'Missing required field: fromEmail',
        success: false
      });
    });

    it('should return 400 if toEmails is missing', async () => {
      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          subject: 'Test',
          mailBody: '<p>Test</p>'
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 400,
        message: 'Missing or invalid required field: toEmails (must be a non-empty array)',
        success: false
      });
    });

    it('should return 400 if toEmails is not an array', async () => {
      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          toEmails: 'test@example.com',
          subject: 'Test',
          mailBody: '<p>Test</p>'
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 400,
        message: 'Missing or invalid required field: toEmails (must be a non-empty array)',
        success: false
      });
    });

    it('should return 400 if toEmails is an empty array', async () => {
      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          toEmails: [],
          subject: 'Test',
          mailBody: '<p>Test</p>'
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 400,
        message: 'Missing or invalid required field: toEmails (must be a non-empty array)',
        success: false
      });
    });

    it('should return 400 if subject is missing', async () => {
      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          toEmails: ['test@example.com'],
          mailBody: '<p>Test</p>'
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 400,
        message: 'Missing required field: subject',
        success: false
      });
    });

    it('should return 400 if mailBody is missing', async () => {
      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          toEmails: ['test@example.com'],
          subject: 'Test'
        })
        .expect(400);

      expect(response.body).toEqual({
        status: 400,
        message: 'Missing required field: mailBody',
        success: false
      });
    });

    it('should return 200 when email is sent successfully', async () => {
      // Mock the token request
      axios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-token' }
      });

      // Mock the email send request
      axios.post.mockResolvedValueOnce({
        data: { messageId: 'mock-message-id' }
      });

      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          toEmails: ['test@example.com'],
          subject: 'Test Subject',
          mailBody: '<p>Test Body</p>'
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 200);
      expect(response.body).toHaveProperty('message', 'Email sent successfully');
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('emailSent');
    });

    it('should return 500 when token request fails', async () => {
      // Mock the token request to fail
      axios.post.mockRejectedValueOnce(new Error('Token request failed'));

      const response = await request(app)
        .post('/api/mail')
        .set('Origin', 'http://localhost:3000')
        .send({
          fromEmail: 'sender@example.com',
          toEmails: ['test@example.com'],
          subject: 'Test Subject',
          mailBody: '<p>Test Body</p>'
        })
        .expect(500);

      expect(response.body).toHaveProperty('status', 500);
      expect(response.body).toHaveProperty('message', 'Failed to send email');
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });
});
