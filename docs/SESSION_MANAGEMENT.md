# Session Management Security

## Overview

This document describes the session management implementation in the NR Results Exam application and addresses ZAP Session Management Response alerts [10112].

## Implementation

The application uses **AWS Amplify v6** with **Amazon Cognito** for authentication and session management. Authentication tokens are stored in browser cookies using Amplify's `CookieStorage` mechanism.

### Cookie Security Configuration

The application configures CookieStorage with the following security settings (see `frontend/src/index.tsx`):

```typescript
cognitoUserPoolsTokenProvider.setKeyValueStorage(new CookieStorage({
  domain: window.location.hostname,
  path: '/',
  expires: 1, // 1 day
  secure: true,
  sameSite: 'strict'
}));
```

#### Security Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `secure` | `true` | Ensures cookies are only sent over HTTPS connections |
| `sameSite` | `'strict'` | Prevents cookies from being sent in cross-site requests (CSRF protection) |
| `expires` | `1` day | Sets cookie expiration to 1 day, limiting exposure window |
| `path` | `'/'` | Restricts cookie to application root path |
| `domain` | `window.location.hostname` | Limits cookie to current domain only |

### Token Lifecycle

#### Token Refresh
- Tokens are automatically refreshed by AWS Amplify when they expire
- The `AuthProvider` component calls `fetchAuthSession()` every 3 minutes to maintain session freshness
- Cognito handles token rotation automatically using refresh tokens

#### Logout
- The logout process uses Amplify's `signOut()` function (see `frontend/src/contexts/AuthProvider.tsx`)
- This properly clears all authentication tokens and cookies
- Users are redirected through the BC Government logout flow
- All session state is cleared from both client storage and application context

## AWS Amplify/Cognito Limitations

### HttpOnly Flag

**Limitation**: The `HttpOnly` cookie flag **cannot** be set by JavaScript code running in the browser.

**Impact**: AWS Amplify authentication tokens stored in cookies are accessible to JavaScript, which is required for the library to function but creates a potential XSS vector.

**Why This Is Necessary**:
- AWS Amplify is a client-side library that needs to read tokens from storage to include them in API requests
- Cognito tokens must be accessible to JavaScript for the authentication flow to work
- This is a fundamental architectural constraint of client-side authentication libraries

**Mitigations**:
1. **Strict Content Security Policy (CSP)**: Implemented to prevent XSS attacks
2. **SameSite=strict**: Prevents CSRF attacks by blocking cross-site cookie transmission
3. **Secure flag**: Ensures cookies are only transmitted over HTTPS
4. **Input sanitization**: All user inputs are properly sanitized to prevent XSS
5. **Short token lifetimes**: Cognito ID tokens expire after 1 hour by default
6. **Regular dependency updates**: Keeping AWS Amplify and other dependencies up to date

### Token Storage Architecture

AWS Amplify/Cognito uses three types of tokens:
- **ID Token**: Contains user identity information (1 hour lifetime)
- **Access Token**: Used for API authorization (1 hour lifetime)  
- **Refresh Token**: Used to obtain new ID and Access tokens (configurable, typically 30 days)

All tokens are stored client-side because:
1. This is a Single Page Application (SPA) architecture
2. There is no server-side session store
3. Cognito is designed for client-side token management

## Acceptance Criteria Coverage

### ✅ Secure, SameSite Attributes
- [x] CookieStorage configured with `secure: true`
- [x] CookieStorage configured with `sameSite: 'strict'`
- [x] Cookie domain restricted to application hostname
- [x] Cookie path limited to application root

### ✅ Logout Flow
- [x] `signOut()` properly clears all tokens
- [x] Session state cleared from application context
- [x] User redirected through BC Gov logout flow

### ✅ Token Refresh
- [x] Automatic token refresh via `fetchAuthSession()` every 3 minutes
- [x] Cognito handles token rotation transparently
- [x] Expired tokens are replaced with fresh ones

### ⚠️ HttpOnly Flag  
- [x] Documented limitation: Cannot be set by client-side JavaScript
- [x] Architectural constraint of AWS Amplify/Cognito
- [x] Mitigations implemented (CSP, SameSite, Secure, input sanitization)

## Testing

Cookie security configuration is validated in `frontend/src/__tests__/index.test.tsx`:
- Verifies CookieStorage is instantiated with correct security options
- Ensures `secure: true` is set
- Ensures `sameSite: 'strict'` is set
- Validates cookie expiration is set to 1 day

## ZAP Alert Resolution

The ZAP "Session Management Response Identified [10112]" alert is addressed as follows:

1. **Alert Finding**: Session cookies lack security attributes
2. **Resolution**: 
   - Added `secure: true` to ensure HTTPS-only transmission
   - Added `sameSite: 'strict'` for CSRF protection
   - Set explicit expiration (1 day) to limit exposure window
   - Restricted domain and path scope
3. **Status**: ✅ **Resolved** with documented limitation on HttpOnly flag

## References

- [AWS Amplify Authentication Documentation](https://docs.amplify.aws/javascript/build-a-backend/auth/)
- [AWS Cognito Token Handling](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN Web Docs: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
