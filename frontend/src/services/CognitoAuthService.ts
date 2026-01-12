import { env } from '../env';
import { JWT } from '../types/amplify';

/**
 * Cognito OAuth Authentication Service
 * 
 * Direct implementation of Cognito OAuth flow without AWS Amplify dependency.
 * Handles OAuth authorization code flow, token exchange, and cookie management.
 */

interface TokenResponse {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface CookieOptions {
  domain: string;
  path: string;
  expires: number;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
}

class CognitoAuthService {
  private readonly userPoolId: string;
  private readonly clientId: string;
  private readonly domain: string;
  private readonly region: string;
  private readonly redirectUri: string;
  private readonly cookieOptions: CookieOptions;

  constructor() {
    this.userPoolId = env.VITE_USER_POOLS_ID || '';
    this.clientId = env.VITE_USER_POOLS_WEB_CLIENT_ID || '';
    this.domain =
      env.VITE_AWS_DOMAIN ||
      'lza-prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com';
    this.region = env.VITE_COGNITO_REGION || 'ca-central-1';
    this.redirectUri = `${window.location.origin}/dashboard`;

    // Cookie security configuration matching Amplify's CookieStorage settings
    // See docs/COOKIE_SECURITY.md for detailed documentation
    this.cookieOptions = {
      domain: window.location.hostname,
      path: '/',
      expires: 365, // days
      sameSite: 'lax',
      secure: true,
    };
  }

  /**
   * Constructs OAuth authorization URL for Cognito Hosted UI
   */
  private buildAuthUrl(provider: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'openid',
      identity_provider: provider,
    });

    return `https://${this.domain}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    const tokenEndpoint = `https://${this.domain}/oauth2/token`;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      code: code,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
    }

    return (await response.json()) as TokenResponse;
  }

  /**
   * Refreshes tokens using the refresh token
   */
  private async refreshTokens(): Promise<TokenResponse | null> {
    const baseCookieName = `CognitoIdentityServiceProvider.${this.clientId}`;
    const userId = this.getCookie(`${baseCookieName}.LastAuthUser`);

    if (!userId) {
      return null;
    }

    const refreshToken = this.getCookie(`${baseCookieName}.${userId}.refreshToken`);

    if (!refreshToken) {
      return null;
    }

    const tokenEndpoint = `https://${this.domain}/oauth2/token`;

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token refresh failed: ${response.status} - ${errorText}`);
        return null;
      }

      return (await response.json()) as TokenResponse;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return null;
    }
  }

  /**
   * Checks if a token is expired or about to expire (within 5 minutes)
   */
  private isTokenExpiringSoon(tokenString: string): boolean {
    try {
      const payload = JSON.parse(atob(tokenString.split('.')[1]));
      const exp = payload.exp as number;
      if (!exp) {
        return true; // No expiration claim, treat as expired
      }

      // Check if token expires within 5 minutes (300 seconds)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = exp - now;
      return timeUntilExpiry < 300; // 5 minutes
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // If we can't parse, treat as expired
    }
  }

  /**
   * Sets a cookie with security attributes
   */
  private setCookie(name: string, value: string, options: CookieOptions): void {
    const expiresDate = new Date();
    expiresDate.setTime(expiresDate.getTime() + options.expires * 24 * 60 * 60 * 1000);

    const cookieValue = `${name}=${encodeURIComponent(value)}; expires=${expiresDate.toUTCString()}; path=${options.path}; domain=${options.domain}; SameSite=${options.sameSite}; ${options.secure ? 'Secure' : ''}`;

    document.cookie = cookieValue;
  }

  /**
   * Gets a cookie value by name
   */
  private getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
      }
    }
    return null;
  }

  /**
   * Deletes a cookie
   */
  private deleteCookie(name: string, options: CookieOptions): void {
    this.setCookie(name, '', { ...options, expires: -1 });
  }

  /**
   * Stores tokens in cookies (matching Amplify's cookie format)
   */
  private storeTokens(tokens: TokenResponse): void {
    // Decode the ID token to get user ID
    const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
    const userId = encodeURIComponent(idTokenPayload.sub);

    const baseCookieName = `CognitoIdentityServiceProvider.${this.clientId}`;

    // Store LastAuthUser
    this.setCookie(`${baseCookieName}.LastAuthUser`, userId, this.cookieOptions);

    // Store tokens
    this.setCookie(`${baseCookieName}.${userId}.idToken`, tokens.id_token, this.cookieOptions);
    this.setCookie(
      `${baseCookieName}.${userId}.accessToken`,
      tokens.access_token,
      this.cookieOptions,
    );
    this.setCookie(
      `${baseCookieName}.${userId}.refreshToken`,
      tokens.refresh_token,
      this.cookieOptions,
    );

    // Store clock drift (set to 0 for simplicity, Amplify uses this for token validation)
    this.setCookie(`${baseCookieName}.${userId}.clockDrift`, '0', this.cookieOptions);
  }

  /**
   * Retrieves ID token from cookies, automatically refreshing if expired or about to expire
   */
  async getTokens(): Promise<{ idToken: JWT | undefined } | undefined> {
    const baseCookieName = `CognitoIdentityServiceProvider.${this.clientId}`;
    const userId = this.getCookie(`${baseCookieName}.LastAuthUser`);

    if (!userId) {
      return undefined;
    }

    let idTokenString = this.getCookie(`${baseCookieName}.${userId}.idToken`);

    if (!idTokenString) {
      return undefined;
    }

    // Check if token is expiring soon and refresh if needed
    if (this.isTokenExpiringSoon(idTokenString)) {
      const refreshedTokens = await this.refreshTokens();
      if (refreshedTokens) {
        this.storeTokens(refreshedTokens);
        // Update idTokenString with the new token
        const newUserId = encodeURIComponent(
          JSON.parse(atob(refreshedTokens.id_token.split('.')[1])).sub,
        );
        idTokenString = this.getCookie(`${baseCookieName}.${newUserId}.idToken`) || idTokenString;
      } else {
        // Refresh failed, token may be expired - return undefined to trigger re-login
        return undefined;
      }
    }

    // Parse JWT and return in format compatible with existing code
    try {
      const payload = JSON.parse(atob(idTokenString.split('.')[1]));
      const idToken: JWT = {
        payload,
        toString: () => idTokenString,
      };
      return { idToken };
    } catch (error) {
      console.error('Error parsing ID token:', error);
      return undefined;
    }
  }

  /**
   * Initiates OAuth login flow with redirect
   */
  signInWithRedirect(provider: 'idir' | 'bceid'): void {
    const zone = (env.VITE_ZONE ?? 'DEV').toUpperCase();
    const envProvider =
      provider === 'idir' ? `${zone}-IDIR` : `${zone}-BCEIDBUSINESS`;

    const authUrl = this.buildAuthUrl(envProvider);
    window.location.href = authUrl;
  }

  /**
   * Handles OAuth callback and exchanges code for tokens
   */
  async handleCallback(): Promise<boolean> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error, urlParams.get('error_description'));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return false;
    }

    if (!code) {
      return false;
    }

    try {
      const tokens = await this.exchangeCodeForTokens(code);
      this.storeTokens(tokens);

      // Clean up URL by removing query parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return false;
    }
  }

  /**
   * Signs out user by clearing cookies and redirecting to logout URL
   */
  signOut(): void {
    const baseCookieName = `CognitoIdentityServiceProvider.${this.clientId}`;
    const userId = this.getCookie(`${baseCookieName}.LastAuthUser`);

    // Clear all cookies
    if (userId) {
      this.deleteCookie(`${baseCookieName}.${userId}.idToken`, this.cookieOptions);
      this.deleteCookie(`${baseCookieName}.${userId}.accessToken`, this.cookieOptions);
      this.deleteCookie(`${baseCookieName}.${userId}.refreshToken`, this.cookieOptions);
      this.deleteCookie(`${baseCookieName}.${userId}.clockDrift`, this.cookieOptions);
    }
    this.deleteCookie(`${baseCookieName}.LastAuthUser`, this.cookieOptions);

    // Build logout URL (same logic as amplifyconfiguration.ts)
    const zone = (env.VITE_ZONE ?? 'DEV').toLowerCase();
    const redirectUri = window.location.origin;
    const logoutDomain = `https://logon${zone === 'prod' ? '' : 'test'}7.gov.bc.ca`;
    const returnUrlHost =
      zone === 'prod' ? 'loginproxy' : zone === 'test' ? 'test.loginproxy' : 'dev.loginproxy';
    const retUrl = `https://${returnUrlHost}.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout`;

    const redirectSignOut =
      env.VITE_REDIRECT_SIGN_OUT && env.VITE_REDIRECT_SIGN_OUT.trim() !== ''
        ? env.VITE_REDIRECT_SIGN_OUT
        : `${logoutDomain}/clp-cgi/logoff.cgi?retnow=1&returl=${retUrl}?redirect_uri=${redirectUri}/`;

    // Redirect to logout URL
    window.location.href = redirectSignOut;
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthService();
