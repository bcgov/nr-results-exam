import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle theme', async ({ page }) => {
    const themeToggle = await page.getByRole('button', { name: /toggle theme/i });
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    
    // Click theme toggle
    await themeToggle.click();
    
    // Get new theme
    const newTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should show/hide profile menu', async ({ page }) => {
    const profileButton = await page.getByRole('button', { name: /profile/i });
    await profileButton.click();
    
    const menu = await page.getByRole('menu');
    await expect(menu).toBeVisible();
    
    // Click outside to close
    await page.mouse.click(0, 0);
    await expect(menu).toBeHidden();
  });

  test('should navigate using side navigation', async ({ page }) => {
    // Login first if needed
    await page.goto('/login');
    await page.getByLabel('Username').fill(process.env.TEST_USERNAME || '');
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD || '');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    const sideNav = await page.getByRole('navigation');
    await sideNav.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    await sideNav.getByRole('link', { name: /test a/i }).click();
    await expect(page).toHaveURL('/test-a');
  });
});
