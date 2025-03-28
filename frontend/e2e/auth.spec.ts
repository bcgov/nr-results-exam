import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    expect(page.url()).toContain('/login');
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const errorMessage = await page.getByText(/invalid username or password/i);
    await expect(errorMessage).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(process.env.TEST_USERNAME || '');
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || '');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should maintain session after refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Username').fill(process.env.TEST_USERNAME || '');
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || '');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
