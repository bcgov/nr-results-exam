# Security Headers Documentation

## Overview

This document describes the security headers implemented in the RESULTS Exam application to protect against various web vulnerabilities, including Spectre-class attacks.

## Cross-Origin Isolation Headers

### Cross-Origin-Opener-Policy (COOP)

**Value:** `same-origin-allow-popups`

**Purpose:** COOP helps protect against Spectre-class timing attacks by controlling how documents can share browsing context groups.

**Why `same-origin-allow-popups`?**
- Provides site isolation benefits while maintaining compatibility with AWS Cognito authentication
- Allows authentication flows that may use popup windows
- Prevents other origins from directly accessing the window object
- More permissive than `same-origin` but still provides protection against cross-origin attacks

**Alternative Considered:**
- `same-origin`: Strictest option but may break OAuth/OIDC authentication flows that use popups

### Cross-Origin-Embedder-Policy (COEP)

**Value:** `credentialless`

**Purpose:** COEP requires all cross-origin resources to explicitly opt-in to being loaded, helping prevent information leaks.

**Why `credentialless`?**
- Allows cross-origin resources to be loaded without credentials
- Compatible with CDN resources (Bootstrap CSS/JS from cdn.jsdelivr.net) that already use `crossorigin="anonymous"`
- Provides Spectre protection while being less restrictive than `require-corp`
- No need to modify third-party resources or add CORP headers

**Cross-Origin Resources Inventory:**
- Bootstrap 5.3.0-alpha3 CSS from cdn.jsdelivr.net (with `crossorigin="anonymous"`)
- Bootstrap 5.3.0-alpha3 JS from cdn.jsdelivr.net (with `crossorigin="anonymous"`)
- Popper.js 2.11.7 from cdn.jsdelivr.net (with `crossorigin="anonymous"`)
- AWS Cognito authentication endpoints
- Backend API (served from same origin in production)

**Alternative Considered:**
- `require-corp`: Strictest option requiring all cross-origin resources to send CORP headers, but would require modifications to external CDN resources

## Spectre Vulnerability Mitigation

These headers work together to enable "cross-origin isolation," which:
1. Separates the application into its own process/browsing context
2. Prevents attackers from using timing attacks to read cross-origin data
3. Addresses ZAP finding: `Insufficient Site Isolation Against Spectre Vulnerability [90004]`

## Browser Support

- **COOP:** Chrome 83+, Firefox 79+, Safari 15+
- **COEP credentialless:** Chrome 96+, Firefox 121+, Safari 16.4+

Older browsers will ignore these headers without breaking functionality.

## Testing and Validation

To verify the headers are set correctly:

1. **Development Server:**
   ```bash
   cd frontend
   npm start
   # Open browser DevTools → Network tab → Check response headers
   ```

2. **Production Build (with Docker/Caddy):**
   ```bash
   docker compose --profile caddy up caddy
   # Visit http://localhost:3000
   # Check response headers
   ```

3. **Verify Cross-Origin Isolation:**
   ```javascript
   // In browser console:
   console.log(self.crossOriginIsolated);
   // Should return: true
   ```

## Implementation Locations

- **Production:** `/frontend/Caddyfile` (lines 18-19)
- **Development:** `/frontend/vite.config.ts` (server.headers)

## Future Considerations

If authentication issues arise with AWS Cognito:
- Consider switching COOP to `same-origin` if popup authentication is not used
- Monitor for any cross-origin resource loading issues

If stricter isolation is desired:
- Upgrade COEP to `require-corp` and add appropriate CORS/CORP headers to all resources
- Upgrade COOP to `same-origin` and adjust authentication flow if needed

## References

- [COOP MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
- [COEP MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
- [Making your website "cross-origin isolated"](https://web.dev/cross-origin-isolation-guide/)
- [Mitigating Spectre with Site Isolation](https://security.googleblog.com/2021/03/a-spectre-proof-of-concept-for-spectre.html)
