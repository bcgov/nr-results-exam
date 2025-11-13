import { test, expect } from '@playwright/test';

/**
 * Authentication Smoke Test
 * 
 * This test validates the critical user authentication flow:
 * 1. Navigate to the application URL
 * 2. Perform login with test credentials
 * 3. Assert that a post-login element is visible
 * 
 * Environment Variables:
 *   APP_URL        - The application URL to test (required)
 *   SMOKE_USER     - Username/email for test account (required)
 *   SMOKE_PASSWORD - Password for test account (required)
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application URL
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      throw new Error('APP_URL environment variable is required');
    }
    await page.goto(appUrl);
  });

  test('should successfully login and display user dashboard', async ({ page }) => {
    // Validate required environment variables
    const username = process.env.SMOKE_USER;
    const password = process.env.SMOKE_PASSWORD;

    if (!username || !password) {
      throw new Error('SMOKE_USER and SMOKE_PASSWORD environment variables are required');
    }

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for login button or link (adjust selectors based on your app)
    // This is a generic approach - you may need to customize for your specific app
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In"), a:has-text("Sign In")').first();
    
    // If login button exists, click it
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      
      // Wait for authentication page to load
      await page.waitForLoadState('networkidle');
    }

    // Fill in login credentials
    // These selectors are generic and may need to be adjusted for your specific login form
    // Common patterns for Cognito/FAM login forms:
    const usernameInput = page.locator('input[name="username"], input[name="email"], input[type="email"], input[id*="username"], input[id*="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"], input[id*="password"]').first();
    
    await usernameInput.fill(username);
    await passwordInput.fill(password);

    // Submit the login form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]').first();
    await submitButton.click();

    // Wait for navigation after login
    await page.waitForLoadState('networkidle');

    // Assert that we're logged in by checking for post-login elements
    // Adjust these selectors based on your application's post-login UI
    // Common patterns:
    // - User menu/profile button
    // - Dashboard heading
    // - Logout button
    // - User's name displayed
    
    // Check for multiple possible post-login indicators
    const postLoginIndicators = [
      page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")'),
      page.locator('[data-testid="user-menu"], [aria-label="User menu"], [class*="user-menu"]'),
      page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard"), [data-testid="dashboard"]'),
      page.locator('[class*="user-profile"], [class*="profile-button"], [data-testid="user-profile"]'),
    ];

    // Wait for at least one post-login indicator to be visible
    let loginSuccessful = false;
    for (const indicator of postLoginIndicators) {
      if (await indicator.isVisible({ timeout: 10000 }).catch(() => false)) {
        loginSuccessful = true;
        console.log(`✓ Login successful - found post-login element`);
        break;
      }
    }

    // If none of the generic indicators are found, check if URL changed (indicating successful login)
    if (!loginSuccessful) {
      const currentUrl = page.url();
      const appUrl = process.env.APP_URL || '';
      
      // Check if we're no longer on a login/auth page
      const isNotOnLoginPage = !currentUrl.includes('/login') && 
                               !currentUrl.includes('/auth') && 
                               !currentUrl.includes('/signin') &&
                               currentUrl !== appUrl;
      
      if (isNotOnLoginPage) {
        loginSuccessful = true;
        console.log(`✓ Login successful - URL changed to: ${currentUrl}`);
      }
    }

    expect(loginSuccessful, 'Expected to find post-login element or URL change after successful login').toBe(true);

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/post-login.png', fullPage: true });
  });

  test('should handle invalid login credentials gracefully', async ({ page }) => {
    // This test ensures the app handles login failures properly
    const invalidUsername = 'invalid@example.com';
    const invalidPassword = 'wrongpassword';

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for login button
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login"), button:has-text("Sign In"), a:has-text("Sign In")').first();
    
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Fill in invalid credentials
    const usernameInput = page.locator('input[name="username"], input[name="email"], input[type="email"], input[id*="username"], input[id*="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"], input[id*="password"]').first();
    
    await usernameInput.fill(invalidUsername);
    await passwordInput.fill(invalidPassword);

    // Submit the login form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]').first();
    await submitButton.click();

    // Wait for error message or stay on login page
    await page.waitForTimeout(2000);

    // Check for error message (adjust selector based on your app)
    const errorIndicators = [
      page.locator('[role="alert"], [class*="error"], [class*="alert"]'),
      page.locator('text=/incorrect|invalid|failed|error/i'),
    ];

    let errorFound = false;
    for (const indicator of errorIndicators) {
      if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
        errorFound = true;
        console.log(`✓ Error message displayed for invalid credentials`);
        break;
      }
    }

    // Either error message should be shown OR we should still be on the login page
    const currentUrl = page.url();
    const stillOnLoginPage = currentUrl.includes('/login') || 
                             currentUrl.includes('/auth') || 
                             currentUrl.includes('/signin');

    expect(errorFound || stillOnLoginPage, 
      'Expected error message or to remain on login page with invalid credentials').toBe(true);
  });
});
