import { Page, expect } from '@playwright/test';
import { testConfig } from '../test-config';

/**
 * Utility functions for TestA testing
 */
export class TestAHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to TestA from dashboard
   */
  async navigateToTestAFromDashboard(): Promise<void> {
    // Look for TestA card on dashboard - try multiple strategies
    console.log('🔍 Looking for TestA card on dashboard...');
    
    // Strategy 1: Look for specific test IDs or cards
    let testACard = this.page.locator('[data-testid*="test-a"], [data-testid*="testA"]').first();
    
    if (!(await testACard.isVisible())) {
      // Strategy 2: Look for any card/link/button containing "Test A" text
      testACard = this.page.locator('a, button, .card, .btn').filter({ hasText: /test\s*a/i }).first();
    }
    
    if (!(await testACard.isVisible())) {
      // Strategy 3: Look for any clickable element with "Test A" text
      testACard = this.page.locator('[role="button"], [onclick], .clickable').filter({ hasText: /test\s*a/i }).first();
    }
    
    if (!(await testACard.isVisible())) {
      // Strategy 4: Look for any element that might be clickable and contains "Test A"
      testACard = this.page.getByText(/test\s*a/i).first();
    }

    // Verify we found the TestA card
    await expect(testACard).toBeVisible();
    console.log('✅ Found TestA card');
    
    // Click the card
    await testACard.click();

    // Wait for navigation to TestA page
    await this.page.waitForURL(`${testConfig.baseUrl}${testConfig.urls.testA}`, {
      timeout: testConfig.timeouts.navigation
    });

    console.log('✅ Successfully navigated to TestA page');
  }

  /**
   * Verify TestA page has loaded correctly
   */
  async verifyTestAPageLoaded(): Promise<void> {
    // Check URL
    await expect(this.page.url()).toContain(testConfig.urls.testA);

    // Check for the specific header structure from TestComponent
    // Looking for: <h4 class="pt-2">Hello <span class="fw-bold">Jaskirat Grewal</span>, welcome to the Test A for the RESULTS application access.</h4>
    const welcomeHeader = this.page.locator('h4.pt-2').filter({ 
      hasText: /Hello.*welcome to the.*for the RESULTS application/i 
    });
    await expect(welcomeHeader).toBeVisible();
    console.log('✅ Welcome header verified');

    // Check for "Online Test" title
    const onlineTestTitle = this.page.locator('h1:has-text("Online Test")');
    await expect(onlineTestTitle).toBeVisible();
    console.log('✅ Online Test title verified');

    // Wait for questions to load
    await this.waitForQuestionsToLoad();
  }

  /**
   * Wait for questions to load and verify count
   */
  async waitForQuestionsToLoad(): Promise<void> {
    console.log('⏳ Waiting for questions to load...');
    
    // Wait for questions container - looking for the specific h3 elements from TestComponent
    await this.page.waitForSelector('h3', {
      timeout: testConfig.timeouts.shortWait
    });

    // Count questions using the exact structure from TestComponent: <h3>Question ${index + 1}</h3>
    const questionHeaders = this.page.locator('h3').filter({ hasText: /^Question \d+$/ });
    const questionCount = await questionHeaders.count();

    console.log(`📊 Found ${questionCount} questions`);

    // Verify expected number of questions
    if (questionCount !== testConfig.testA.expectedQuestions) {
      throw new Error(
        `Expected ${testConfig.testA.expectedQuestions} questions, but found ${questionCount}. ` +
        'Questions may not have loaded correctly from the backend.'
      );
    }

    console.log(`✅ Successfully loaded ${questionCount} questions`);
  }

  /**
   * Answer all questions randomly
   */
  async answerAllQuestionsRandomly(): Promise<void> {
    console.log('🎲 Starting to answer questions randomly...');

    // Find all radio button groups using the exact naming from TestComponent: name="question_${index}"
    const radioButtons = this.page.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();

    if (radioCount === 0) {
      throw new Error('No radio buttons found. Questions may not have loaded correctly.');
    }

    console.log(`📊 Found ${radioCount} total radio button options`);

    // Answer each question group randomly based on TestComponent structure
    const questionHeaders = this.page.locator('h3').filter({ hasText: /^Question \d+$/ });
    const questionCount = await questionHeaders.count();

    for (let questionIndex = 0; questionIndex < questionCount; questionIndex++) {
      try {
        // Get all radio buttons for this specific question using the name attribute from TestComponent
        const questionRadios = this.page.locator(`input[type="radio"][name="question_${questionIndex}"]`);
        const optionCount = await questionRadios.count();
        
        if (optionCount === 0) {
          throw new Error(`No radio buttons found for question ${questionIndex + 1}`);
        }

        // Select a random option from this question
        const randomIndex = Math.floor(Math.random() * optionCount);
        const randomOption = questionRadios.nth(randomIndex);
        
        await expect(randomOption).toBeVisible();
        await randomOption.check();
        
        console.log(`✅ Question ${questionIndex + 1}: Selected option ${randomIndex + 1}/${optionCount}`);
        
        // Small delay between selections
        await this.page.waitForTimeout(500);
      } catch (error) {
        console.error(`❌ Failed to answer question ${questionIndex + 1}:`, error);
        throw new Error(`Failed to answer question ${questionIndex + 1}: ${error.message}`);
      }
    }

    console.log(`✅ Successfully answered ${questionCount} questions`);
  }

  /**
   * Submit the test
   */
  async submitTest(): Promise<void> {
    console.log('📤 Submitting test...');

    // Look for the specific submit button from TestComponent: <button className="btn btn-primary mt-4" type="submit">Submit</button>
    const submitButton = this.page.locator('button[type="submit"]:has-text("Submit")');
    
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    console.log('✅ Test submitted');
  }

  /**
   * Wait for and verify results
   */
  async verifyTestResults(): Promise<{ passed: boolean; percentage: number }> {
    console.log('⏳ Waiting for test results...');

    // Wait for results to appear - looking for the specific result messages from TestComponent
    // From renderPassFailMessage(): 'Congratulations! You have passed' or 'Sorry! You have failed'
    await this.page.waitForSelector('p.text-success, p.text-danger', {
      timeout: testConfig.timeouts.navigation
    });

    // Check for result message using the exact classes from TestComponent
    const successMessage = this.page.locator('p.text-success');
    const failMessage = this.page.locator('p.text-danger');

    let passed = false;
    let percentage = 0;

    if (await failMessage.isVisible()) {
      passed = false;
      const fullText = await failMessage.textContent();
      console.log('📊 Fail message found:', fullText);
      
      // Extract percentage from "Sorry! You have failed with X%."
      const percentMatch = fullText?.match(/(\d+)%/);
      percentage = percentMatch ? parseInt(percentMatch[1]) : 0;
      console.log(`📊 Test failed with ${percentage}%`);
    } else if (await successMessage.isVisible()) {
      passed = true;
      const fullText = await successMessage.textContent();
      console.log('🎉 Success message found:', fullText);
      
      // Extract percentage from "Congratulations! You have passed with X%."
      const percentMatch = fullText?.match(/(\d+)%/);
      percentage = percentMatch ? parseInt(percentMatch[1]) : 0;
      console.log(`🎉 Test passed with ${percentage}%`);
    } else {
      throw new Error('No valid result message found. Results may not have loaded correctly.');
    }

    return { passed, percentage };
  }

  /**
   * Verify email success toast
   */
  async verifyEmailSuccessToast(): Promise<void> {
    console.log('📧 Checking for email success notification...');

    // Wait for the InlineNotification component to appear
    // From EmailNotifications component: InlineNotification with kind="success"
    const successNotification = this.page.locator('.cds--inline-notification--success, .bx--inline-notification--success');
    
    await expect(successNotification).toBeVisible({ timeout: testConfig.timeouts.shortWait });

    // Verify notification content - looking for the specific text from EmailNotifications component
    const notificationText = this.page.locator('text="Email report sent successfully. You can close this browser window now."');
    await expect(notificationText).toBeVisible();

    // Verify the title shows "Success"
    const successTitle = this.page.locator('text="Success"');
    await expect(successTitle).toBeVisible();

    console.log('✅ Email success notification verified');
  }

  /**
   * Check for email error and fail appropriately
   */
  async checkForEmailError(): Promise<void> {
    // Check for error notifications using Carbon Design InlineNotification
    const errorNotification = this.page.locator('.cds--inline-notification--error, .bx--inline-notification--error');

    if (await errorNotification.isVisible()) {
      const errorContent = await errorNotification.textContent();
      throw new Error(
        `Email functionality is broken. Error notification: "${errorContent}". ` +
        'This indicates a backend email service failure.'
      );
    }

    // Also check for the specific error message from EmailNotifications component
    const errorMessage = this.page.locator('text="Failed to send the email report. Please take a screenshot of your results."');
    
    if (await errorMessage.isVisible()) {
      throw new Error(
        'Email functionality is broken. Backend email service failed to send emails. ' +
        'Error message: "Failed to send the email report."'
      );
    }

    // Check for success notification - if not found, email functionality may be broken
    try {
      await this.verifyEmailSuccessToast();
    } catch (error) {
      throw new Error(
        'Email success notification not found within expected timeframe. ' +
        'This may indicate email functionality is broken in the backend.'
      );
    }
  }

  /**
   * Complete full TestA flow
   */
  async completeTestAFlow(): Promise<{ passed: boolean; percentage: number }> {
    await this.navigateToTestAFromDashboard();
    await this.verifyTestAPageLoaded();
    await this.answerAllQuestionsRandomly();
    await this.submitTest();
    const results = await this.verifyTestResults();
    await this.checkForEmailError();
    
    return results;
  }
}
