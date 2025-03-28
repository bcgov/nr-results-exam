import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('health check endpoint returns success', async ({ request }) => {
    const response = await request.get(`${process.env.BACKEND_URL || 'http://localhost:5000'}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.message).toBe('OK');
  });

  test('index endpoint returns success', async ({ request }) => {
    const response = await request.get(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
  });
});
