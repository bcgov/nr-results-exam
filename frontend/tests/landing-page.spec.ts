import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display landing page elements correctly', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');

    // Check if the main title is visible
    await expect(page.getByTestId('landing-title')).toBeVisible();
    await expect(page.getByTestId('landing-title')).toHaveText('Welcome to RESULTS EXAM');

    // Check if the subtitle is visible
    await expect(page.getByTestId('landing-subtitle')).toBeVisible();
    await expect(page.getByTestId('landing-subtitle')).toHaveText('Login to take a RESULTS exam');

    // Check if both login buttons are visible
    await expect(page.getByTestId('landing-button__idir')).toBeVisible();
    await expect(page.getByTestId('landing-button__idir')).toHaveText('Login with IDIR');

    await expect(page.getByTestId('landing-button__bceid')).toBeVisible();
    await expect(page.getByTestId('landing-button__bceid')).toHaveText('Login with Business BCeID');

    // Check if the BC Gov logo is present
    await expect(page.locator('img.logo')).toBeVisible();
    await expect(page.locator('img.logo')).toHaveAttribute('alt', 'BCGov Logo');

    // Check if the lottie animation container is present
    await expect(page.locator('.lottie-container')).toBeVisible();
  });

  test('should have clickable login buttons', async ({ page }) => {
    await page.goto('/');

    // Check that buttons are enabled and clickable
    const idirButton = page.getByTestId('landing-button__idir');
    const bceidButton = page.getByTestId('landing-button__bceid');

    await expect(idirButton).toBeEnabled();
    await expect(bceidButton).toBeEnabled();

    // Note: We're not actually clicking the buttons in this test
    // since that would trigger the authentication flow
    // If you want to test the click behavior, you'd need to mock the auth context
  });

  test('should have proper page structure', async ({ page }) => {
    await page.goto('/');

    // Check that the page has the expected Bootstrap grid structure
    await expect(page.locator('.container-fluid')).toBeVisible();
    await expect(page.locator('.row').first()).toBeVisible();
    
    // Check that content is organized in proper columns
    await expect(page.locator('.col-lg-7')).toBeVisible();
    await expect(page.locator('.col-lg-5')).toBeVisible();

    // Check that the button group row exists
    await expect(page.locator('.row.gy-3')).toBeVisible();
  });
});
