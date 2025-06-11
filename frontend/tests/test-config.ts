// Test configuration variables
export const testConfig = {
  // Base URL for the application
  baseUrl: 'http://localhost:3000',
  
  // Authentication credentials
  auth: {
    idir: {
      username: 'jasgrewa',
      password: 'samplesP@$$'
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
    bcGovLoginBase: 'https://logontest7.gov.bc.ca',
    loginProxyBase: 'https://dev.loginproxy.gov.bc.ca'
  }
};
