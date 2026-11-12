# Session & Cookie Security Documentation

## Overview

This document provides information about token storage and cookies used in the NR Results Exam application.

## Token Storage (BC Gov SSO / Keycloak)

Authentication uses **BC Gov SSO (Keycloak)** via `oidc-client-ts` with Authorization Code + PKCE.

- **OIDC Tokens & State**: Stored in browser `sessionStorage` (`WebStorageStateStore`), scoped to the active browser tab/session and cleared automatically when the tab closes or on sign-out (`removeUser()`).
- **No Application Auth Cookies**: The application does not set custom cookies for storing JWTs or refresh tokens.
- **Identity Provider Session Cookies**: Managed by BC Gov SSO (`*.loginproxy.gov.bc.ca`) during login/logout redirects and silent renewal.

### Why SameSite=Lax Instead of Strict?

`SameSite=Lax` is chosen over `Strict` because:
- **Compatible with OAuth flows:** OAuth redirect callbacks from Cognito Hosted UI require cookies to be sent
- **User experience:** Allows users to navigate to the application from external links while maintaining session
- **Security:** Still protects against CSRF attacks for state-changing operations (POST, PUT, DELETE requests)

`SameSite=Strict` would break:
- OAuth login redirects from `*.amazoncognito.com` to the application
- Bookmarked links to authenticated pages
- Email links to the application

### Why Not SameSite=None?

`SameSite=None` is NOT used because:
- **Not required:** The application does not embed content in cross-site iframes
- **Not required:** Authentication flows do not require cross-site cookie sharing
- **Security risk:** Would expose cookies to cross-site request forgery attacks
- **Compliance:** ZAP security scanner flags `SameSite=None` as a vulnerability

## Configuration

The cookie security configuration is set in `/frontend/src/services/CognitoAuthService.ts`:

```typescript
this.cookieOptions = {
  domain: window.location.hostname,
  path: '/',
  expires: 365, // days
  sameSite: 'lax',
  secure: true,
};
```

This configuration is applied when storing authentication tokens in cookies via the `setCookie()` method.

## Testing

Cookie security configuration is validated in automated tests:
- `/frontend/src/__tests__/services/CognitoAuthService.test.ts` - Verifies cookie management and security settings

## Compliance

This configuration aligns with:
- OWASP Secure Cookie Recommendations
- Modern browser security best practices
- BC Government security policies
- CHES security requirements

## Exceptions and Unavoidable Cases

### Exception: Cognito Hosted UI Cookies

**Issue:** AWS Cognito Hosted UI sets cookies with `SameSite=None` that we cannot control.

**Cookies Affected:**
- `XSRF-TOKEN` (set by Cognito during OAuth flows)
- Session cookies on `*.amazoncognito.com` domain

**Justification:**
- These cookies are required for OAuth/OIDC authentication flows
- Managed entirely by AWS Cognito infrastructure
- Not accessible or configurable by the application
- Follow AWS security best practices
- Properly scoped to Cognito domain (`*.amazoncognito.com`)
- Not accessible to the application domain

**Risk Assessment:** Low
- Cookies are scoped to AWS infrastructure
- Used only during authentication flows
- Not accessible by application JavaScript
- Protected by AWS security controls

## Monitoring and Maintenance

- Regular security scans with OWASP ZAP
- Annual review of cookie security settings
- Monitor AWS Cognito updates for security improvements
- Track browser changes to SameSite cookie handling
- Review OAuth implementation for security best practices

## References

- [OWASP Cookie Security](https://owasp.org/www-community/controls/SecureFlag)
- [MDN SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [AWS Cognito OAuth 2.0](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oauth-flows.html)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

## Last Updated

2026-01-12 - Updated to reflect direct Cognito OAuth implementation (removed AWS Amplify dependency)
