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

COOP and COEP headers work together to enable "cross-origin isolation," which:
1. Separates the application into its own process/browsing context
2. Prevents attackers from using timing attacks to read cross-origin data
3. Addresses ZAP finding: `Insufficient Site Isolation Against Spectre Vulnerability [90004]`

## Other Security Headers

The application also implements other security headers as part of a defense-in-depth strategy:

### Permissions-Policy

**Value:** `camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), vibrate=(), ambient-light-sensor=(), accelerometer=(), autoplay=(), encrypted-media=(), picture-in-picture=()`

**Purpose:** Restricts which browser features and APIs can be used by the application and any embedded content.

**Key Features Disabled:**
- Camera and microphone access
- Geolocation
- Payment APIs
- USB device access
- Motion sensors (accelerometer, gyroscope, magnetometer)
- Interest-cohort (FLoC)
- Various media features

### Proxy Disclosure Header Mitigation

Security scanning tools (like OWASP ZAP) may report "Proxy Disclosure" alerts when HTTP response headers reveal information about the reverse proxy infrastructure. In OpenShift deployments, the HAProxy router automatically adds the following headers:

- `Via`: Indicates the protocol and recipient of a proxy
- `X-Forwarded-For`: Original client IP address
- `X-Forwarded-Host`: Original host requested by the client
- `X-Forwarded-Port`: Original port requested by the client  
- `X-Forwarded-Proto`: Original protocol (HTTP/HTTPS)
- `Forwarded`: Standardized version of X-Forwarded-* headers

**Why These Headers Exist:**

These headers are added by OpenShift's HAProxy router and serve important purposes:
1. **Request Routing**: Help backend services understand the original request context
2. **Protocol Detection**: Allow applications to detect if the original request was HTTPS
3. **IP Tracking**: Enable proper client IP logging and rate limiting

**Security Mitigation Strategy:**

While these headers are necessary for backend processing, they should not be exposed to end users in responses. Our mitigation strategy:

#### Application-Level Header Removal (Caddy)

The frontend Caddy server is configured to strip proxy disclosure headers from all HTTP responses:

```caddyfile
header {
    # Remove proxy disclosure headers
    -Via
    -X-Forwarded-For
    -X-Forwarded-Host
    -X-Forwarded-Port
    -X-Forwarded-Proto
    -Forwarded
}
```

The `-` prefix in Caddy configuration removes the header from responses.

#### OpenShift Route Configuration

The Route resources in `openshift.deploy.yml` files use edge TLS termination, which means:
- TLS is terminated at the router
- The router adds the X-Forwarded headers for backend communication
- These headers do not leak sensitive cluster-internal information

**Verification:**

To verify that proxy headers are removed:

1. **Local Testing**: Build and run the Caddy container locally, inspect response headers
2. **Deployed Environment**: Use browser developer tools or curl to inspect response headers:
   ```bash
   curl -I https://nr-results-exam-test-frontend.apps.silver.devops.gov.bc.ca
   ```

Response headers should NOT include Via or X-Forwarded-* headers.

**Risk Assessment:**
- **Risk Level**: Low
- **Justification**: The proxy headers added by OpenShift HAProxy are standard HTTP headers and do not expose sensitive cluster-internal information. The headers only indicate that a reverse proxy exists, which is expected for modern web applications.
- **Mitigation**: Headers are removed at the application level to prevent information disclosure while maintaining backend functionality.

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

- **Production:** `/frontend/Caddyfile` (lines 38-41)
- **Development:** `/frontend/vite.config.ts` (server.headers)

Note: The Permissions-Policy header is configured in the Caddyfile but not in the Vite dev server configuration.

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
- [Caddy Header Directive](https://caddyserver.com/docs/caddyfile/directives/header)
- [OpenShift Routes Documentation](https://docs.openshift.com/container-platform/latest/networking/routes/route-configuration.html)
- [OWASP Proxy Disclosure](https://owasp.org/www-community/attacks/Proxy_Disclosure)
