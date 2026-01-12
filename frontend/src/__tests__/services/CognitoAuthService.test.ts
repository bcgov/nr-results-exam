import { describe, beforeEach, expect, test, vi } from 'vitest';
import { cognitoAuth } from '../../services/CognitoAuthService';

// Mock environment variables
vi.mock('../../env', () => ({
  env: {
    VITE_USER_POOLS_ID: 'test-pool-id',
    VITE_USER_POOLS_WEB_CLIENT_ID: 'test-client-id',
    VITE_AWS_DOMAIN: 'test-domain.auth.ca-central-1.amazoncognito.com',
    VITE_COGNITO_REGION: 'ca-central-1',
    VITE_ZONE: 'TEST',
  },
}));

describe('CognitoAuthService', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    vi.clearAllMocks();
  });

  describe('getTokens', () => {
    test('returns undefined when no tokens are stored', async () => {
      const tokens = await cognitoAuth.getTokens();
      expect(tokens).toBeUndefined();
    });

    test('returns tokens when stored in cookies', async () => {
      // Create a valid JWT token with expiration far in the future
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'test@gov.bc.ca', exp: futureExp }));
      const signature = 'signature';
      const mockIdToken = `${header}.${payload}.${signature}`;
      
      const baseCookieName = 'CognitoIdentityServiceProvider.test-client-id';
      const userId = 'user-123';

      // Set cookies
      document.cookie = `${baseCookieName}.LastAuthUser=${encodeURIComponent(userId)}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.idToken=${mockIdToken}; path=/`;

      const tokens = await cognitoAuth.getTokens();
      expect(tokens).toBeDefined();
      expect(tokens?.idToken).toBeDefined();
      expect(tokens?.idToken.toString()).toBe(mockIdToken);
      expect(tokens?.idToken.payload.sub).toBe(userId);
    });

    test('automatically refreshes tokens when expiring soon', async () => {
      // Create a token that expires in 2 minutes (less than 5 minute threshold)
      const nearExp = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'test@gov.bc.ca', exp: nearExp }));
      const signature = 'signature';
      const oldToken = `${header}.${payload}.${signature}`;
      
      const newFutureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const newPayload = btoa(JSON.stringify({ sub: 'user-123', email: 'test@gov.bc.ca', exp: newFutureExp }));
      const newToken = `${header}.${newPayload}.${signature}`;

      const baseCookieName = 'CognitoIdentityServiceProvider.test-client-id';
      const userId = 'user-123';

      // Set cookies with old token and refresh token
      document.cookie = `${baseCookieName}.LastAuthUser=${encodeURIComponent(userId)}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.idToken=${oldToken}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.refreshToken=refresh-token-value; path=/`;

      // Mock the refresh token endpoint
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id_token: newToken,
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      const tokens = await cognitoAuth.getTokens();
      expect(tokens).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
      // Verify new token is stored
      const storedToken = document.cookie
        .split(';')
        .find((c) => c.includes(`${baseCookieName}.${userId}.idToken`));
      expect(storedToken).toBeDefined();
    });

    test('handles token refresh failure when endpoint returns non-OK response', async () => {
      // Create a token that expires soon
      const nearExp = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'test@gov.bc.ca', exp: nearExp }));
      const signature = 'signature';
      const oldToken = `${header}.${payload}.${signature}`;

      const baseCookieName = 'CognitoIdentityServiceProvider.test-client-id';
      const userId = 'user-123';

      // Set cookies with old token and refresh token
      document.cookie = `${baseCookieName}.LastAuthUser=${encodeURIComponent(userId)}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.idToken=${oldToken}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.refreshToken=invalid-refresh-token; path=/`;

      // Mock the refresh token endpoint to return error
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid refresh token',
      });

      const tokens = await cognitoAuth.getTokens();
      // Should return undefined when refresh fails
      expect(tokens).toBeUndefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    test('handles malformed JWT tokens gracefully', async () => {
      const baseCookieName = 'CognitoIdentityServiceProvider.test-client-id';
      const userId = 'user-123';

      // Set cookie with malformed token (not a valid JWT)
      document.cookie = `${baseCookieName}.LastAuthUser=${encodeURIComponent(userId)}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.idToken=not-a-valid-jwt; path=/`;

      const tokens = await cognitoAuth.getTokens();
      // Should return undefined for malformed tokens
      expect(tokens).toBeUndefined();
    });

    test('handles tokens without expiration claims', async () => {
      // Create a token without exp claim
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'test@gov.bc.ca' })); // No exp field
      const signature = 'signature';
      const tokenWithoutExp = `${header}.${payload}.${signature}`;

      const baseCookieName = 'CognitoIdentityServiceProvider.test-client-id';
      const userId = 'user-123';

      // Set cookies
      document.cookie = `${baseCookieName}.LastAuthUser=${encodeURIComponent(userId)}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.idToken=${tokenWithoutExp}; path=/`;
      document.cookie = `${baseCookieName}.${userId}.refreshToken=refresh-token-value; path=/`;

      // Token without exp should be treated as expiring soon, triggering refresh
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id_token: tokenWithoutExp, // Return same token (refresh would normally give new one)
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
        }),
      });

      const tokens = await cognitoAuth.getTokens();
      // Should attempt refresh and return token (or undefined if refresh fails)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('signInWithRedirect', () => {
    test('redirects to Cognito OAuth URL for idir', () => {
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      window.location = { ...originalLocation, href: '' };

      cognitoAuth.signInWithRedirect('idir');

      expect(window.location.href).toContain('test-domain.auth.ca-central-1.amazoncognito.com');
      expect(window.location.href).toContain('oauth2/authorize');
      expect(window.location.href).toContain('client_id=test-client-id');
      expect(window.location.href).toContain('response_type=code');
      expect(window.location.href).toContain('identity_provider=TEST-IDIR');

      window.location = originalLocation;
    });

    test('redirects to Cognito OAuth URL for bceid', () => {
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      window.location = { ...originalLocation, href: '' };

      cognitoAuth.signInWithRedirect('bceid');

      expect(window.location.href).toContain('identity_provider=TEST-BCEIDBUSINESS');

      window.location = originalLocation;
    });
  });

  describe('handleCallback', () => {
    test('returns false when no code or error in URL', async () => {
      const originalSearch = window.location.search;
      Object.defineProperty(window, 'location', {
        value: { search: '' },
        writable: true,
      });

      const result = await cognitoAuth.handleCallback();
      expect(result).toBe(false);

      Object.defineProperty(window, 'location', {
        value: { search: originalSearch },
        writable: true,
      });
    });

    test('handles error in callback URL', async () => {
      const originalSearch = window.location.search;
      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = vi.fn();

      Object.defineProperty(window, 'location', {
        value: { search: '?error=access_denied&error_description=User%20denied' },
        writable: true,
      });

      const result = await cognitoAuth.handleCallback();
      expect(result).toBe(false);
      expect(window.history.replaceState).toHaveBeenCalled();

      window.history.replaceState = originalReplaceState;
      Object.defineProperty(window, 'location', {
        value: { search: originalSearch },
        writable: true,
      });
    });

    test('exchanges code for tokens on successful callback', async () => {
      // Create a valid JWT token for the test with expiration
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-123', email: 'test@gov.bc.ca', exp: futureExp }));
      const signature = 'signature';
      const mockIdToken = `${header}.${payload}.${signature}`;

      const mockTokenResponse = {
        id_token: mockIdToken,
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const originalSearch = window.location.search;
      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = vi.fn();

      Object.defineProperty(window, 'location', {
        value: { search: '?code=test-auth-code', pathname: '/dashboard' },
        writable: true,
      });

      const result = await cognitoAuth.handleCallback();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/oauth2/token'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      // Verify tokens were stored in cookies
      const tokens = await cognitoAuth.getTokens();
      expect(tokens).toBeDefined();

      window.history.replaceState = originalReplaceState;
      Object.defineProperty(window, 'location', {
        value: { search: originalSearch },
        writable: true,
      });
    });

    test('handles token exchange failure during callback', async () => {
      const originalSearch = window.location.search;
      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = vi.fn();

      // Mock fetch to return error response
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid authorization code',
      });

      Object.defineProperty(window, 'location', {
        value: { search: '?code=invalid-code', pathname: '/dashboard' },
        writable: true,
      });

      const result = await cognitoAuth.handleCallback();
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalled();
      expect(window.history.replaceState).toHaveBeenCalled(); // URL should be cleaned up

      window.history.replaceState = originalReplaceState;
      Object.defineProperty(window, 'location', {
        value: { search: originalSearch },
        writable: true,
      });
    });

    test('handles network error during token exchange', async () => {
      const originalSearch = window.location.search;
      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = vi.fn();

      // Mock fetch to throw network error
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      Object.defineProperty(window, 'location', {
        value: { search: '?code=test-code', pathname: '/dashboard' },
        writable: true,
      });

      const result = await cognitoAuth.handleCallback();
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalled();
      expect(window.history.replaceState).toHaveBeenCalled(); // URL should be cleaned up

      window.history.replaceState = originalReplaceState;
      Object.defineProperty(window, 'location', {
        value: { search: originalSearch },
        writable: true,
      });
    });
  });

  describe('signOut', () => {
    test('clears cookies and redirects to logout URL', () => {
      // Set some cookies first
      const baseCookieName = 'CognitoIdentityServiceProvider.test-client-id';
      document.cookie = `${baseCookieName}.LastAuthUser=user-123; path=/`;
      document.cookie = `${baseCookieName}.user-123.idToken=token; path=/`;

      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      window.location = { ...originalLocation, href: '', origin: 'https://test.example.com' };

      cognitoAuth.signOut();

      // Verify redirect happened
      expect(window.location.href).toContain('logontest7.gov.bc.ca');
      expect(window.location.href).toContain('clp-cgi/logoff.cgi');

      // Verify cookies were cleared (they should be expired)
      const cookies = document.cookie;
      expect(cookies).not.toContain('CognitoIdentityServiceProvider');

      window.location = originalLocation;
    });
  });
});
