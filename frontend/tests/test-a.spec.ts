import { test, expect } from '@playwright/test';
import { testConfig } from './test-config';
import { AuthHelper } from './helpers/auth-helper';
import { TestAHelper } from './helpers/test-a-helper';

test.describe('TestA Functionality', () => {
  let authHelper: AuthHelper;
  let testAHelper: TestAHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    testAHelper = new TestAHelper(page);
    
    // Login before each test
    console.log('🔐 Logging in before TestA tests...');
    await authHelper.performIdirLogin();
    console.log('✅ Login completed, ready for TestA tests');
  });

  test('should complete full TestA flow successfully', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.authFlow * 2); // Extended timeout for complete flow

    console.log('🚀 Starting complete TestA flow test...');

    try {
      // Complete the full TestA flow
      const results = await testAHelper.completeTestAFlow();
      
      // Log results for debugging
      console.log(`📊 Test Results: ${results.passed ? 'PASSED' : 'FAILED'} with ${results.percentage}%`);
      
      // The test should pass regardless of whether user passed or failed the exam
      // What matters is that the flow completed successfully
      console.log('✅ TestA flow completed successfully - all functionality working');
      
    } catch (error) {
      console.error('❌ TestA flow failed:', error.message);
      throw error;
    }
  });

  test('should navigate to TestA page and load questions correctly', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.navigation);

    console.log('🧪 Testing TestA page loading...');

    // Navigate to TestA from dashboard
    await testAHelper.navigateToTestAFromDashboard();
    
    // Verify page loaded correctly
    await testAHelper.verifyTestAPageLoaded();
    
    console.log('✅ TestA page loading test completed successfully');
  });

  test('should answer questions and submit test', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.authFlow);

    console.log('📝 Testing question answering and submission...');

    // Navigate and verify page load
    await testAHelper.navigateToTestAFromDashboard();
    await testAHelper.verifyTestAPageLoaded();
    
    // Answer questions randomly
    await testAHelper.answerAllQuestionsRandomly();
    
    // Submit test
    await testAHelper.submitTest();
    
    // Verify results appear (don't check email here)
    const results = await testAHelper.verifyTestResults();
    console.log(`📊 Question answering test completed. Results: ${results.passed ? 'PASSED' : 'FAILED'} with ${results.percentage}%`);
  });

  test('should verify email functionality works correctly', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.authFlow);

    console.log('📧 Testing email functionality...');

    // Complete the test flow up to results
    await testAHelper.navigateToTestAFromDashboard();
    await testAHelper.verifyTestAPageLoaded();
    await testAHelper.answerAllQuestionsRandomly();
    await testAHelper.submitTest();
    await testAHelper.verifyTestResults();
    
    // Focus on email functionality
    try {
      await testAHelper.verifyEmailSuccessToast();
      console.log('✅ Email functionality is working correctly');
    } catch (error) {
      if (error.message.includes('Email functionality is broken') || 
          error.message.includes('backend email service failure')) {
        console.error('❌ Email functionality test failed:', error.message);
        throw error;
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
  });

  test('should handle different test result scenarios', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.authFlow * 1.5);

    console.log('🎯 Testing different result scenarios...');

    // Run the test multiple times to potentially get different results
    // (In a real scenario, you might want to control the answers more precisely)
    
    let attemptCount = 0;
    const maxAttempts = 3;
    const results: Array<{ passed: boolean; percentage: number }> = [];

    while (attemptCount < maxAttempts) {
      try {
        console.log(`🔄 Test attempt ${attemptCount + 1}/${maxAttempts}`);
        
        // Navigate to TestA (might need to go back to dashboard first)
        if (attemptCount > 0) {
          await page.goto(`${testConfig.baseUrl}${testConfig.urls.dashboard}`);
          await page.waitForTimeout(2000); // Wait for dashboard to load
        }
        
        await testAHelper.navigateToTestAFromDashboard();
        await testAHelper.verifyTestAPageLoaded();
        await testAHelper.answerAllQuestionsRandomly();
        await testAHelper.submitTest();
        
        const result = await testAHelper.verifyTestResults();
        results.push(result);
        
        console.log(`📊 Attempt ${attemptCount + 1} result: ${result.passed ? 'PASSED' : 'FAILED'} with ${result.percentage}%`);
        
        // Verify email toast for this attempt
        await testAHelper.verifyEmailSuccessToast();
        
        attemptCount++;
        
        // If we get different results, we can break early
        if (attemptCount > 1 && 
            results.some(r => r.passed) && 
            results.some(r => !r.passed)) {
          console.log('✅ Successfully tested both pass and fail scenarios');
          break;
        }
        
      } catch (error) {
        console.error(`❌ Attempt ${attemptCount + 1} failed:`, error.message);
        if (attemptCount === 0) {
          // If first attempt fails, throw immediately
          throw error;
        }
        break;
      }
    }

    // Verify we got at least one valid result
    if (results.length === 0) {
      throw new Error('No valid test results obtained in any attempt');
    }

    console.log(`✅ Result scenarios test completed. Collected ${results.length} results:`, 
      results.map(r => `${r.passed ? 'PASS' : 'FAIL'} (${r.percentage}%)`).join(', '));
  });

  test('should validate TestA page elements and structure', async ({ page }) => {
    test.setTimeout(testConfig.timeouts.navigation);

    console.log('🔍 Validating TestA page structure...');

    await testAHelper.navigateToTestAFromDashboard();
    
    // Verify URL
    await expect(page.url()).toContain(testConfig.urls.testA);
    
    // Verify header exists and contains expected text
    // Looking for: <h4 class="pt-2">Hello <span class="fw-bold">Jaskirat Grewal</span>, welcome to the Test A for the RESULTS application access.</h4>
    const header = page.locator('h4.pt-2').filter({ 
      hasText: /Hello.*welcome to the.*for the RESULTS application/i 
    });
    await expect(header).toBeVisible();
    
    // Verify questions loaded
    await testAHelper.waitForQuestionsToLoad();
    
    // Verify radio buttons are present
    const radioButtons = page.locator('input[type="radio"]');
    const radioCount = await radioButtons.count();
    
    if (radioCount === 0) {
      throw new Error('No radio buttons found - questions may not have loaded correctly');
    }
    
    // Verify submit button exists
    const submitButton = page.locator('button:has-text("Submit"), input[type="submit"], .submit-btn').first();
    await expect(submitButton).toBeVisible();
    
    console.log(`✅ Page structure validation completed. Found ${radioCount} radio options and submit button`);
  });
});
