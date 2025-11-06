const request = require('supertest');
const app = require('../app');

describe('Index Routes', () => {
  describe('GET /api/', () => {
    it('should return success status', async () => {
      const response = await request(app)
        .get('/api/')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.body).toEqual({
        status: 200,
        success: true
      });
    });
  });
});
