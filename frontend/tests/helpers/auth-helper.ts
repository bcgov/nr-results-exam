import { Page, expect } from '@playwright/test';
import { testConfig } from '../test-config';

/**
 * Utility functions for authentication testing
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to landing page and verify it's loaded
   */
  async navigateToLanding(): Promise<void> {
    await this.page.goto(testConfig.urls.landing);
    await expect(this.page.getByTestId('landing-title')).toBeVisible();
  }

  /**
   * Click IDIR login button and wait for navigation through Cognito/Login Proxy
   */
  async clickIdirLogin(): Promise<void> {
    const idirButton = this.page.getByTestId('landing-button__idir');
    await expect(idirButton).toBeVisible();
    await expect(idirButton).toBeEnabled();
    
    // Click the button and wait for the first navigation (to Cognito/AWS)
    await Promise.all([
      this.page.waitForNavigation({ timeout: testConfig.timeouts.navigation }),
      idirButton.click()
    ]);
    
    // Wait for potential redirect through login proxy
    await this.handleLoginProxyRedirect();
    
    // Finally, wait for BC Gov login page
    await this.waitForBcGovLogin();
  }

  /**
   * Handle the intermediate redirect through login proxy if it occurs
   */
  async handleLoginProxyRedirect(): Promise<void> {
    // Check if we're on the login proxy page
    if (this.page.url().includes('loginproxy.gov.bc.ca')) {
      console.log('📍 Detected login proxy redirect:', this.page.url());
      
      // Wait for automatic redirect to BC Gov login
      // The login proxy typically redirects automatically
      await this.page.waitForNavigation({ 
        timeout: testConfig.timeouts.navigation,
        waitUntil: 'networkidle' // Wait for network to be idle
      });
      
      console.log('📍 Redirected to:', this.page.url());
    }
  }

  /**
   * Wait for BC Gov login page to load
   */
  async waitForBcGovLogin(): Promise<void> {
    // Wait for either the BC Gov login page or continue waiting for redirects
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const currentUrl = this.page.url();
      console.log(`📍 Current URL (attempt ${attempts + 1}):`, currentUrl);
      
      if (currentUrl.includes(testConfig.urls.bcGovLoginBase)) {
        // We've reached the BC Gov login page
        await this.page.waitForSelector('input[name="user"]', { 
          timeout: testConfig.timeouts.shortWait 
        });
        console.log('✅ BC Gov login page loaded successfully');
        return;
      }
      
      // If we're still on a redirect page, wait a bit more
      if (currentUrl.includes('loginproxy.gov.bc.ca') || 
          currentUrl.includes('amazoncognito.com') ||
          currentUrl.includes('auth/realms')) {
        console.log('⏳ Still in redirect flow, waiting...');
        await this.page.waitForTimeout(2000);
        attempts++;
      } else {
        // If we're somewhere unexpected, break out
        console.log('⚠️  Unexpected URL in auth flow:', currentUrl);
        break;
      }
    }
    
    // Final verification
    await expect(this.page.url()).toContain(testConfig.urls.bcGovLoginBase);
  }

  /**
   * Fill in IDIR credentials on BC Gov login page
   */
  async fillIdirCredentials(username?: string, password?: string): Promise<void> {
    const user = username || testConfig.auth.idir.username;
    const pass = password || testConfig.auth.idir.password;

    // Wait for login form
    await this.page.waitForSelector('input[name="user"]', { timeout: testConfig.timeouts.shortWait });
    
    // Fill username
    const usernameField = this.page.locator('input[name="user"]');
    await expect(usernameField).toBeVisible();
    await usernameField.fill(user);
    
    // Fill password
    const passwordField = this.page.locator('input[name="password"]');
    await expect(passwordField).toBeVisible();
    await passwordField.fill(pass);
  }

  /**
   * Click continue button on BC Gov login page
   */
  async clickContinue(): Promise<void> {
    const continueButton = this.page.locator('input[type="submit"][name="btnSubmit"][value="Continue"]');
    await expect(continueButton).toBeVisible();
    
    // Click the button and wait for either navigation or error message
    await continueButton.click();
    
    // Wait a moment for potential error messages to appear
    await this.page.waitForTimeout(2000);
    
    // Check for authentication error before waiting for navigation
    await this.checkForAuthenticationError();
    
    // If no error, wait for navigation
    await this.page.waitForNavigation({ timeout: testConfig.timeouts.navigation });
  }

  /**
   * Check for authentication error messages on BC Gov login page
   */
  async checkForAuthenticationError(): Promise<void> {
    // Check for the specific error message structure
    const errorBlock = this.page.locator('.help-block.field-help-block');
    const errorText = this.page.locator('.field-help-text');
    
    if (await errorBlock.isVisible()) {
      const errorMessage = await errorText.textContent();
      console.log('❌ Authentication error detected:', errorMessage);
      
      // Check for specific error messages
      if (errorMessage && errorMessage.includes('username or password you entered is incorrect')) {
        throw new Error(`Authentication failed: Invalid credentials - ${errorMessage}`);
      } else if (errorMessage) {
        throw new Error(`Authentication failed: ${errorMessage}`);
      } else {
        throw new Error('Authentication failed: Unknown error displayed on login page');
      }
    }
    
    // Also check for other common error patterns
    const generalError = this.page.locator('.error, .alert-danger, [class*="error"]');
    if (await generalError.first().isVisible()) {
      const errorMessage = await generalError.first().textContent();
      console.log('❌ General authentication error detected:', errorMessage);
      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Complete full IDIR login flow with enhanced redirect handling
   */
  async performIdirLogin(username?: string, password?: string): Promise<void> {
    console.log('🚀 Starting IDIR authentication flow...');
    
    await this.navigateToLanding();
    console.log('✅ Landing page loaded');
    
    await this.clickIdirLogin();
    console.log('✅ Navigated through authentication redirects');
    
    await this.fillIdirCredentials(username, password);
    console.log('✅ Credentials filled');
    
    await this.clickContinue();
    console.log('✅ Continue button clicked');
    
    // Wait for redirect to dashboard with retries
    await this.waitForDashboardRedirect();
    console.log('✅ Successfully redirected to dashboard');
  }

  /**
   * Wait for final redirect to dashboard with enhanced error handling
   */
  async waitForDashboardRedirect(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 15; // Allow more time for auth flow
    
    console.log('⏳ Waiting for dashboard redirect...');
    
    while (attempts < maxAttempts) {
      const currentUrl = this.page.url();
      console.log(`📍 Current URL (redirect attempt ${attempts + 1}):`, currentUrl);
      
      if (currentUrl.includes(testConfig.urls.dashboard)) {
        console.log('✅ Dashboard reached successfully');
        return;
      }
      
      // Check if we're still in the authentication flow
      if (currentUrl.includes('loginproxy.gov.bc.ca') || 
          currentUrl.includes('amazoncognito.com') ||
          currentUrl.includes('logontest7.gov.bc.ca') ||
          currentUrl.includes('auth/realms')) {
        console.log('⏳ Still in authentication flow, waiting...');
        await this.page.waitForTimeout(3000);
        attempts++;
      } else if (currentUrl.includes(testConfig.baseUrl)) {
        // We're back in our app, check if it's the dashboard
        if (currentUrl.includes(testConfig.urls.dashboard)) {
          console.log('✅ Dashboard reached successfully');
          return;
        } else {
          console.log('📍 Back in app but not dashboard yet:', currentUrl);
          await this.page.waitForTimeout(2000);
          attempts++;
        }
      } else {
        console.log('⚠️  Unexpected URL during dashboard redirect:', currentUrl);
        await this.page.waitForTimeout(2000);
        attempts++;
      }
    }
    
    // Final attempt with Playwright's waitForURL
    try {
      await this.page.waitForURL(`${testConfig.baseUrl}${testConfig.urls.dashboard}`, { 
        timeout: testConfig.timeouts.navigation 
      });
    } catch (error) {
      console.error('❌ Failed to reach dashboard. Current URL:', this.page.url());
      throw new Error(`Authentication flow did not complete successfully. Current URL: ${this.page.url()}`);
    }
  }

  /**
   * Verify user is successfully logged in and on dashboard
   */
  async verifyDashboardAccess(): Promise<void> {
    await expect(this.page.url()).toContain(testConfig.urls.dashboard);
    // Add more specific dashboard verification as needed
    await expect(this.page.locator('body')).toBeVisible();
  }

  /**
   * Check if user is on BC Gov login page
   */
  async verifyOnBcGovLogin(): Promise<void> {
    // Wait for BC Gov login page and form to be ready
    await this.waitForBcGovLogin();
  }

  /**
   * Logout user (if logout functionality exists)
   */
  async logout(): Promise<void> {
    // This would depend on your logout implementation
    // You might have a logout button or menu item
    // Example:
    // const logoutButton = this.page.getByTestId('logout-button');
    // if (await logoutButton.isVisible()) {
    //   await logoutButton.click();
    // }
    
    // For now, just navigate back to landing page
    await this.page.goto(testConfig.urls.landing);
  }
}
