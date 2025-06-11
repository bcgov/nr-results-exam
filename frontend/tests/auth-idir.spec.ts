import { test, expect } from '@playwright/test';
import { testConfig } from './test-config';
import { AuthHelper } from './helpers/auth-helper';

test.describe('IDIR Authentication Flow', () => {
  test('should complete full IDIR login flow and redirect to dashboard', async ({ page }) => {
    // Set longer timeout for this test as it involves external authentication
    test.setTimeout(testConfig.timeouts.authFlow);

    const authHelper = new AuthHelper(page);
    
    // Perform complete IDIR login flow
    await authHelper.performIdirLogin();
    
    // Verify successful login and dashboard access
    await authHelper.verifyDashboardAccess();
    
    console.log('✅ IDIR authentication flow completed successfully');
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.authFlow);

    const authHelper = new AuthHelper(page);
    
    try {
      // Navigate to landing and start login flow
      await authHelper.navigateToLanding();
      await authHelper.clickIdirLogin();
      
      // Fill invalid credentials
      await authHelper.fillIdirCredentials('invalid_user', 'invalid_password');
      
      // Try to continue - this should fail with authentication error
      await authHelper.clickContinue();
      
      // If we reach here, the test should fail because authentication should have failed
      throw new Error('Expected authentication to fail with invalid credentials, but it succeeded');
      
    } catch (error) {
      // Check if it's the expected authentication error
      if (error.message.includes('Authentication failed: Invalid credentials') || 
          error.message.includes('username or password you entered is incorrect')) {
        console.log('✅ Authentication properly failed with invalid credentials:', error.message);
        // Test passes - this is the expected behavior
      } else if (error.message.includes('Authentication failed:')) {
        console.log('✅ Authentication failed with error message:', error.message);
        // Test passes - any authentication failure is expected
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
  });

  test('should redirect back to landing page when user cancels login', async ({ page }) => {
    const authHelper = new AuthHelper(page);
    
    // Start login flow
    await authHelper.navigateToLanding();
    await authHelper.clickIdirLogin();
    
    // Verify we're on BC Gov login page
    await authHelper.verifyOnBcGovLogin();
    
    // Navigate back to landing page (simulating user canceling)
    await page.goto(testConfig.baseUrl);
    
    // Verify we're back on landing page
    await expect(page.getByTestId('landing-title')).toBeVisible();
    await expect(page.getByTestId('landing-title')).toHaveText('Welcome to RESULTS EXAM');
    
    console.log('✅ User can return to landing page without completing login');
  });

  test('should display specific error message for invalid credentials', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.authFlow);

    const authHelper = new AuthHelper(page);
    
    // Navigate to landing and start login flow
    await authHelper.navigateToLanding();
    await authHelper.clickIdirLogin();
    
    // Fill invalid credentials
    await authHelper.fillIdirCredentials('invalid_user', 'invalid_password');
    
    // Click Continue button manually to check error message display
    const continueButton = page.locator('input[type="submit"][name="btnSubmit"][value="Continue"]');
    await continueButton.click();
    
    // Wait for error message to appear
    await page.waitForTimeout(3000);
    
    // Check for the specific error message structure
    const errorBlock = page.locator('.help-block.field-help-block');
    const errorText = page.locator('.field-help-text');
    
    if (await errorBlock.isVisible()) {
      await expect(errorBlock).toBeVisible();
      await expect(errorText).toBeVisible();
      
      const errorMessage = await errorText.textContent();
      console.log('✅ Error message found:', errorMessage);
      
      // Verify the specific error message content
      await expect(errorText).toContainText('username or password you entered is incorrect');
      
      // Verify the error icon is present
      const errorIcon = page.locator('.help-block .fa-exclamation-circle');
      await expect(errorIcon).toBeVisible();
      
      console.log('✅ Error message structure and content verified');
    } else {
      throw new Error('Expected error message was not displayed for invalid credentials');
    }
  });
});
