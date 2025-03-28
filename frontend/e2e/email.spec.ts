import { test, expect } from '@playwright/test';

test.describe('Email Notification Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show email notification form', async ({ page }) => {
    await page.getByRole('button', { name: /send notification/i }).click();
    const form = await page.getByTestId('email-notification-form');
    await expect(form).toBeVisible();
  });

  test('should validate email fields', async ({ page }) => {
    await page.getByRole('button', { name: /send notification/i }).click();
    await page.getByRole('button', { name: /submit/i }).click();
    
    const errorMessage = await page.getByText(/please fill in all required fields/i);
    await expect(errorMessage).toBeVisible();
  });

  test('should send email successfully', async ({ page }) => {
    await page.getByRole('button', { name: /send notification/i }).click();
    await page.getByLabel('From Email').fill('test@example.com');
    await page.getByLabel('To Email').fill('recipient@example.com');
    await page.getByLabel('Subject').fill('Test Subject');
    await page.getByLabel('Message').fill('Test Message');
    
    await page.getByRole('button', { name: /submit/i }).click();
    
    const successMessage = await page.getByText(/email sent successfully/i);
    await expect(successMessage).toBeVisible();
  });
});
