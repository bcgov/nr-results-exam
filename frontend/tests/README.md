# Playwright Test Configuration

This directory contains end-to-end tests using Playwright for the RESULTS EXAM application.

## Test Structure

### Configuration Files
- `test-config.ts` - Centralized configuration for URLs, credentials, and timeouts
- `helpers/auth-helper.ts` - Reusable authentication helper functions

### Test Files
- `landing-page.spec.ts` - Tests for the landing page functionality
- `auth-idir.spec.ts` - Tests for IDIR authentication flow

## Configuration Variables

### Customizing Test Environment

You can modify the test configuration in `test-config.ts`:

```typescript
export const testConfig = {
  // Base URL for the application
  baseUrl: 'http://localhost:3000',
  
  // Authentication credentials
  auth: {
    idir: {
      username: 'your-username',
      password: 'your-password'
    }
  },
  
  // Timeouts (in milliseconds)
  timeouts: {
    navigation: 30000,
    authFlow: 60000,
    shortWait: 5000
  },
  
  // Expected URLs
  urls: {
    dashboard: '/dashboard',
    landing: '/',
    bcGovLoginBase: 'https://logontest7.gov.bc.ca'
  }
};
```

### Environment-Specific Configuration

For different environments (dev, test, prod), you can:

1. **Create environment-specific config files:**
   - `test-config.dev.ts`
   - `test-config.test.ts`
   - `test-config.prod.ts`

2. **Use environment variables** (requires updating the config):
   ```typescript
   baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000'
   ```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### With UI (Recommended for development)
```bash
npm run test:e2e:ui
```

### Specific Test File
```bash
npx playwright test landing-page.spec.ts
npx playwright test auth-idir.spec.ts
```

### In Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

## Test Scenarios

### Landing Page Tests
- ✅ Display all required elements (title, subtitle, buttons, logo)
- ✅ Verify buttons are clickable
- ✅ Check proper page structure

### IDIR Authentication Tests
- ✅ Complete login flow with valid credentials
- ✅ Handle invalid credentials gracefully with proper error detection
- ✅ Display specific error message format verification
- ✅ Allow user to cancel login process

## Error Handling

### Authentication Error Detection

The tests now properly detect and handle authentication errors:

```html
<div class="help-block field-help-block">
  <i class="fa fa-fw fa-exclamation-circle"></i>
  <span class="field-help-text">The username or password you entered is incorrect</span>
</div>
```

**Error Handling Features:**
- ✅ **Immediate Failure**: Tests fail fast when invalid credentials are detected
- ✅ **Specific Error Messages**: Checks for exact error text content
- ✅ **Error Structure Validation**: Verifies error icon and message format
- ✅ **No Infinite Waiting**: Prevents tests from waiting forever for dashboard redirect

**Test Scenarios:**
1. **Valid Credentials**: Complete authentication flow to dashboard
2. **Invalid Credentials**: Detect error message and fail appropriately  
3. **Error Message Format**: Verify specific error structure and content
4. **User Cancellation**: Allow navigation back to landing page

## Authentication Flow

The IDIR authentication test follows this multi-step flow:

1. **Navigate to landing page** (`/`)
2. **Click "Login with IDIR"** button
3. **AWS Cognito redirect** (automatic)
4. **Login Proxy redirect** (`https://dev.loginproxy.gov.bc.ca/auth/realms/idir/broker/idir/login?session_code=...`)
5. **BC Gov login page** (`https://logontest7.gov.bc.ca/...`)
6. **Fill credentials** (username/password)
7. **Click Continue** button
8. **Authentication redirects** (multiple automatic redirects)
9. **Final redirect to dashboard** (`/dashboard`)
10. **Verify successful login**

### Multi-Step Redirect Handling

The authentication flow involves several automatic redirects:
- **Step 3-4**: AWS Cognito → Login Proxy
- **Step 4-5**: Login Proxy → BC Gov Login
- **Step 8-9**: BC Gov → Login Proxy → Cognito → Dashboard

The test helper automatically handles these redirects and waits for each step to complete.

## Security Notes

⚠️ **Important**: Never commit real credentials to version control!

- Use test accounts specifically created for automated testing
- Consider using environment variables for sensitive data
- Rotate test credentials regularly
- Use different credentials for different environments

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase timeout values in `test-config.ts`
2. **Navigation failures**: Check if application is running on correct port
3. **Authentication failures**: Verify test credentials are valid
4. **Element not found**: Check if selectors match current application state

### Debug Mode
Run tests with debug flag to step through:
```bash
npx playwright test --debug auth-idir.spec.ts
```

### Trace Viewer
After test failures, view traces:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```
