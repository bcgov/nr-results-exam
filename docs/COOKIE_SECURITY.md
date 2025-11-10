# Cookie Security Documentation

## Overview

This document provides detailed information about cookies used in the NR Results Exam application, their security configurations, and rationale for specific settings.

## Cookie Inventory

### 1. AWS Cognito Authentication Cookies

The application uses AWS Amplify with Cognito for authentication, which sets the following cookies:

#### Application-Controlled Cookies

**Cookies Set by AWS Amplify CookieStorage:**
- `CognitoIdentityServiceProvider.<client-id>.LastAuthUser` - Stores the last authenticated user identifier
- `CognitoIdentityServiceProvider.<client-id>.<user-id>.idToken` - JWT ID token containing user identity
- `CognitoIdentityServiceProvider.<client-id>.<user-id>.accessToken` - JWT access token for API authorization
- `CognitoIdentityServiceProvider.<client-id>.<user-id>.refreshToken` - Refresh token for obtaining new tokens
- `CognitoIdentityServiceProvider.<client-id>.<user-id>.clockDrift` - Clock drift for token validation

**Security Configuration:**
- **SameSite:** `Lax` - Prevents cross-site request forgery (CSRF) attacks while allowing normal navigation
- **Secure:** `true` - Ensures cookies are only sent over HTTPS connections
- **Domain:** Application domain (window.location.hostname)
- **Path:** `/` - Cookies available to entire application
- **Expires:** 365 days - Matches Cognito token lifetime

**Rationale:**
- `SameSite=Lax` is appropriate because:
  - The application does NOT require cross-site cookie sharing
  - Authentication flows are initiated from the same site
  - OAuth redirect flows work correctly with `Lax` mode
  - Provides better CSRF protection than `None`
- `Secure=true` ensures cookies are only transmitted over encrypted connections
- HttpOnly is NOT set on these cookies because AWS Amplify JavaScript SDK needs to read them for token management

#### Cognito-Hosted UI Cookies

**Note:** When using Cognito Hosted UI for OAuth flows, Cognito itself may set additional cookies:
- `XSRF-TOKEN` - CSRF protection token (set by Cognito, not controllable by application)
- Session cookies from `*.amazoncognito.com` domain

These cookies are managed entirely by AWS Cognito and cannot be configured by the application. They may use `SameSite=None; Secure` to support OAuth redirect flows across domains.

## Security Considerations

### Why Not HttpOnly?

The AWS Amplify JavaScript SDK requires programmatic access to authentication tokens stored in cookies. Setting `HttpOnly=true` would prevent the SDK from:
- Reading tokens for API requests
- Validating token expiration
- Refreshing expired tokens
- Managing user session state

**Mitigation:** While cookies are not HttpOnly, the application implements:
- Content Security Policy (CSP) headers to prevent XSS attacks
- Regular security scanning with ZAP
- Input validation and output encoding
- Strict CORS policies

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

The cookie security configuration is set in `/frontend/src/index.tsx`:

```typescript
cognitoUserPoolsTokenProvider.setKeyValueStorage(
  new CookieStorage({
    domain: window.location.hostname,
    path: '/',
    expires: 365,
    sameSite: 'lax',
    secure: true
  })
);
```

## Testing

Cookie security configuration is validated in automated tests:
- `/frontend/src/__tests__/index.test.tsx` - Verifies CookieStorage initialization with correct parameters

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
- Monitor AWS Amplify/Cognito updates for security improvements
- Track browser changes to SameSite cookie handling

## References

- [OWASP Cookie Security](https://owasp.org/www-community/controls/SecureFlag)
- [MDN SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [AWS Amplify Authentication](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [AWS Amplify Cookie Storage](https://docs.amplify.aws/javascript/build-a-backend/auth/connect-your-frontend/manage-user-session/)

## Last Updated

2025-11-10 - Initial documentation
