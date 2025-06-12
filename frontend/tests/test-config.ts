// Test configuration variables
export const testConfig = {
  // Base URL for the application
  baseUrl: 'http://localhost:3000',
  
  // Authentication credentials
  auth: {
    idir: {
      username: 'jasgrewa',
      password: 'samplePassword123'
    }
  },
  
  // Timeouts
  timeouts: {
    navigation: 30000,
    authFlow: 60000,
    shortWait: 5000
  },
  
  // Expected URLs
  urls: {
    dashboard: '/dashboard',
    landing: '/',
    testA: '/testA',
    bcGovLoginBase: 'https://logontest7.gov.bc.ca',
    loginProxyBase: 'https://dev.loginproxy.gov.bc.ca'
  },
  
  // Test expectations
  testA: {
    expectedQuestions: 10,
    headerText: 'welcome to the Test A for the RESULTS application',
    successToast: {
      title: 'Success',
      message: 'Email report sent successfully. You can close this browser window now.'
    },
    resultMessages: {
      fail: 'Sorry! You have failed with',
      pass: 'Congratulations! You have passed with' // Assuming this is the pass message
    }
  }
};
