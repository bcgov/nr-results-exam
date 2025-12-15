# ZAP Accepted Alerts Documentation

## Overview

This document records the acceptance rationale for informational and low-risk alerts identified by OWASP ZAP (Zed Attack Proxy) security scans of the Natural Resources RESULTS Exam Web Application frontend. These findings have been reviewed and deemed acceptable based on the application's architecture, risk profile, and implemented security controls.

**Purpose**: 
- Provide context for security scan findings
- Prevent duplicate triage of known alerts
- Document risk acceptance decisions for future reviewers
- Maintain institutional knowledge about security posture

**Last Updated**: 2025-11-13  
**Review Frequency**: Quarterly or when major architectural changes occur

---

## Accepted Informational/Low-Risk Alerts

### 1. Base64 Disclosure (10094)

**Risk Level**: Informational  
**ZAP Alert ID**: 10094

**Description**:  
ZAP detects Base64-encoded strings in application responses, which could potentially contain sensitive information.

**Findings**:
- Base64-encoded strings found in JavaScript bundles and API responses
- Common in React applications using bundlers (Vite)
- May include encoded assets, configuration data, or identifiers

**Risk Assessment**:
- **Potential Risk**: Encoded strings could contain credentials, tokens, or sensitive data
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **No Sensitive Data in Bundles**: Application build process does not embed credentials or secrets in frontend code
2. **Asset Encoding**: Base64 encoding is used for legitimate purposes:
   - Small images and icons bundled inline
   - Font files embedded in CSS
   - Lottie animation data
3. **Environment Variables**: Sensitive configuration uses environment variables at runtime, not build-time embedding
4. **Authentication**: Uses AWS Cognito with secure token handling (HttpOnly cookies where applicable)

**Mitigation**:
- Regular code reviews to prevent accidental credential commits
- Pre-commit hooks scanning for secrets (if implemented)
- Build-time validation that no sensitive patterns exist in bundles

**References**:
- [OWASP ZAP Alert 10094](https://www.zaproxy.org/docs/alerts/10094/)

---

### 2. Timestamp Disclosure - Unix (10096)

**Risk Level**: Informational  
**ZAP Alert ID**: 10096

**Description**:  
Unix timestamps detected in application responses, potentially revealing when resources were created or modified.

**Findings**:
- Timestamps present in API responses for data records
- Build timestamps in JavaScript bundle comments
- Cache control headers with timestamp values

**Risk Assessment**:
- **Potential Risk**: Timestamps could aid attackers in understanding system behavior or data freshness
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **Legitimate Business Function**: Timestamps are necessary for:
   - Displaying record creation/modification dates to users
   - Cache validation and freshness checking
   - Audit logging and compliance
2. **No Security-Sensitive Timing**: Timestamps don't reveal:
   - Security-relevant system activities
   - Vulnerability windows
   - Attack opportunities
3. **Public Information**: Application operates in government context where data timestamps are part of public records

**Mitigation**:
- Timestamps are limited to business-relevant data
- No exposure of system-level timing that could aid reconnaissance

**References**:
- [OWASP ZAP Alert 10096](https://www.zaproxy.org/docs/alerts/10096/)

---

### 3. Information Disclosure - Suspicious Comments (10027)

**Risk Level**: Informational  
**ZAP Alert ID**: 10027

**Description**:  
ZAP identifies comments in HTML, JavaScript, or CSS that contain potentially suspicious keywords like "TODO", "FIXME", "BUG", etc.

**Findings**:
- Developer comments in source code and bundled JavaScript
- TODO markers for future enhancements
- Code comments explaining implementation details

**Risk Assessment**:
- **Potential Risk**: Comments could reveal implementation details, vulnerabilities, or developer intentions
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **Production Builds**: Vite production builds minimize and tree-shake code, removing most comments
2. **No Sensitive Information**: Code review process ensures comments don't contain:
   - Credentials or API keys
   - Specific vulnerability details
   - Architectural weaknesses
3. **Developer Quality**: TODOs and FIXMEs are normal development practice and don't indicate exploitable issues
4. **Open Source Context**: Government BC open source policy means code is publicly accessible anyway

**Mitigation**:
- Code review process catches sensitive comments before merge
- Build process removes development comments in production bundles
- Security-focused TODOs tracked separately in private channels

**References**:
- [OWASP ZAP Alert 10027](https://www.zaproxy.org/docs/alerts/10027/)

---

### 4. Modern Web Application (10109)

**Risk Level**: Informational  
**ZAP Alert ID**: 10109

**Description**:  
ZAP detects indicators of modern web development frameworks and technologies (React, Vue, Angular, etc.).

**Findings**:
- React framework signatures in page source
- Vite build tool artifacts
- Modern JavaScript patterns (ES modules, async/await)

**Risk Assessment**:
- **Potential Risk**: Framework fingerprinting could help attackers identify known vulnerabilities in specific versions
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **Dependency Management**: Automated dependency updates via Renovate bot
2. **Security Scanning**: SonarCloud and other tools scan for known vulnerabilities
3. **Minimal Version Disclosure**: Build process doesn't expose detailed version numbers in easily accessible locations
4. **Rapid Patching**: CI/CD pipeline enables quick deployment of security updates
5. **Standard Practice**: Framework usage is industry standard and provides security benefits

**Mitigation**:
- Regular dependency updates via Renovate bot
- Monitoring security advisories for React and dependencies
- Automated vulnerability scanning in CI/CD pipeline

**References**:
- [OWASP ZAP Alert 10109](https://www.zaproxy.org/docs/alerts/10109/)

---

### 5. Sec-Fetch-Dest Header Not Set (90005)

**Risk Level**: Informational  
**ZAP Alert ID**: 90005

**Description**:  
The Fetch Metadata Request Headers (Sec-Fetch-Site, Sec-Fetch-Mode, Sec-Fetch-Dest) are not set or validated by the server.

**Findings**:
- Server does not require or validate Sec-Fetch-* headers
- Headers may be set by modern browsers but not enforced server-side

**Risk Assessment**:
- **Potential Risk**: Without validation, server cannot use Fetch Metadata for resource isolation policies
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **Browser Feature**: Sec-Fetch headers are set by modern browsers automatically; application doesn't need to manage them
2. **Server-Side Validation Optional**: For this application architecture:
   - Backend is not publicly accessible (internal OpenShift network only)
   - Frontend Caddy proxy handles external requests
   - CORS policies already in place
3. **Defense-in-Depth**: Other security controls provide protection:
   - Network policies restrict backend access
   - CORS headers configured appropriately
   - Authentication required for sensitive operations
   - Proxy header validation (`X-Forwarded-By: caddy-proxy`)

**Future Consideration**:
- May implement Fetch Metadata validation if application requirements change
- Could be added to Caddy proxy configuration for additional defense-in-depth

**References**:
- [Fetch Metadata Request Headers](https://web.dev/fetch-metadata/)
- [OWASP ZAP Alert 90005](https://www.zaproxy.org/docs/alerts/90005/)

---

### 6. Sec-Fetch-Site Header Not Set (90006)

**Risk Level**: Informational  
**ZAP Alert ID**: 90006

**Description**:  
Similar to 90005, the Sec-Fetch-Site header specifically is not enforced.

**Risk Assessment**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
- Same rationale as Sec-Fetch-Dest above
- Browser-generated header, not application-controlled
- Other security controls (network policies, CORS, authentication) provide equivalent protection
- Backend isolation via internal-only access reduces risk

**References**:
- [Fetch Metadata Request Headers](https://web.dev/fetch-metadata/)
- [OWASP ZAP Alert 90006](https://www.zaproxy.org/docs/alerts/90006/)

---

### 7. Sec-Fetch-User Header Not Set (90007)

**Risk Level**: Informational  
**ZAP Alert ID**: 90007

**Description**:  
The Sec-Fetch-User header is not set or validated.

**Risk Assessment**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
- Same rationale as other Sec-Fetch headers
- Browser-controlled header indicating user activation
- Application relies on authentication and authorization rather than request metadata
- Other controls provide equivalent security

**References**:
- [Fetch Metadata Request Headers](https://web.dev/fetch-metadata/)
- [OWASP ZAP Alert 90007](https://www.zaproxy.org/docs/alerts/90007/)

---

### 8. Retrieved from Cache (10050)

**Risk Level**: Informational  
**ZAP Alert ID**: 10050

**Description**:  
ZAP detects that resources are being retrieved from browser cache rather than the server.

**Findings**:
- Static assets (JavaScript, CSS, images) cached by browser
- Cache-Control headers properly configured
- ETag and Last-Modified headers present

**Risk Assessment**:
- **Potential Risk**: Cached sensitive data could be accessed by unauthorized users on shared devices
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **Intentional Caching**: Browser caching of static assets improves performance and is expected behavior
2. **Appropriate Cache Headers**: Application correctly sets cache headers:
   - Long cache times for immutable versioned assets
   - No-cache for HTML entry point
   - Private cache for user-specific data
3. **No Sensitive Data in Static Assets**: Cached resources are public assets (JS bundles, CSS, images)
4. **Session-Based Security**: User-specific data protected by authentication, not cache headers

**Mitigation**:
- Sensitive API responses include appropriate cache-control headers (no-store, private)
- HTML documents use no-cache to ensure fresh authentication checks
- Authentication state managed securely via cookies, not cached resources

**References**:
- [OWASP ZAP Alert 10050](https://www.zaproxy.org/docs/alerts/10050/)
- [HTTP Caching - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

### 9. X-Content-Type-Options Header Missing (10021)

**Risk Level**: Low  
**ZAP Alert ID**: 10021

**Description**:  
The X-Content-Type-Options header is not set on some responses.

**Status**: ✅ **Resolved/Mitigated**

**Implementation**:
- Security headers are configured in Caddy server
- X-Content-Type-Options: nosniff applied to responses
- See [SECURITY-HEADERS.md](../SECURITY-HEADERS.md) for full documentation

**Note**: If this alert still appears in ZAP scans, verify that:
1. Scan is targeting the correct environment (production-like with Caddy)
2. All response types include the header
3. No proxy stripping the header

**References**:
- [OWASP ZAP Alert 10021](https://www.zaproxy.org/docs/alerts/10021/)
- [X-Content-Type-Options - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)

---

### 10. Cookie with SameSite Attribute None (10054)

**Risk Level**: Low  
**ZAP Alert ID**: 10054

**Description**:  
ZAP detects cookies set with `SameSite=None` attribute, which can allow cross-site request forgery (CSRF) attacks if not properly managed.

**Findings**:
- Cookies with `SameSite=None` detected during authentication flows
- Specifically: `XSRF-TOKEN` cookie set by AWS Cognito Hosted UI
- Session cookies on `*.amazoncognito.com` domain

**Risk Assessment**:
- **Potential Risk**: Cookies with `SameSite=None` can be sent in cross-site requests, potentially enabling CSRF attacks
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **AWS Cognito Managed Cookies**: The cookies flagged by ZAP are set by AWS Cognito Hosted UI infrastructure, not by the application
2. **Required for OAuth/OIDC Flows**: `SameSite=None` is necessary for OAuth redirect flows across domains:
   - User initiates login on application domain
   - Redirected to `*.amazoncognito.com` for authentication
   - Redirected back to application domain with authentication tokens
3. **Application Cookies Use Lax**: All application-controlled cookies use `SameSite=Lax`:
   - Configured in `/frontend/src/index.tsx` via AWS Amplify CookieStorage
   - Provides CSRF protection for application cookies
4. **Properly Scoped**: Cognito cookies are:
   - Scoped to AWS infrastructure domain (`*.amazoncognito.com`)
   - Not accessible by application JavaScript
   - Protected by AWS security controls
   - Used only during authentication flows
5. **Secure Flag Required**: Modern browsers require `Secure=true` when using `SameSite=None`, which Cognito properly implements

**Mitigation**:
- Application cookies use `SameSite=Lax` (see [COOKIE_SECURITY.md](../COOKIE_SECURITY.md))
- CSRF protection via AWS Cognito's XSRF-TOKEN mechanism
- Authentication state managed securely via HttpOnly cookies where possible
- Regular security scans to monitor cookie configuration

**Configuration**:
- Application cookie configuration: `/frontend/src/index.tsx` (lines 24-32)
- Cognito cookies are not configurable by the application

**References**:
- [OWASP ZAP Alert 10054](https://www.zaproxy.org/docs/alerts/10054/)
- [Cookie Security Documentation](../COOKIE_SECURITY.md) - Detailed cookie security documentation
- [MDN SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

### 11. Insufficient Site Isolation Against Spectre Vulnerability (90004)

**Risk Level**: Low  
**ZAP Alert ID**: 90004

**Description**:  
ZAP detects that the site may not have adequate protections against the Spectre vulnerability, which can lead to unauthorized access to sensitive information through side-channel attacks.

**Status**: ✅ **Resolved/Mitigated**

**Implementation**:
- Cross-Origin-Opener-Policy (COOP): `same-origin-allow-popups`
- Cross-Origin-Embedder-Policy (COEP): `credentialless`
- Headers configured in both production (Caddyfile) and development (vite.config.ts) environments

**Configuration Details**:
1. **Production (Caddyfile)**: Lines 62-63
   ```
   Cross-Origin-Opener-Policy "same-origin-allow-popups"
   Cross-Origin-Embedder-Policy "credentialless"
   ```

2. **Development (vite.config.ts)**: Lines 36-39
   ```typescript
   headers: {
     'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
     'Cross-Origin-Embedder-Policy': 'credentialless'
   }
   ```

**Rationale for Header Choices**:
- **COOP: `same-origin-allow-popups`**: 
  - Provides site isolation benefits while maintaining compatibility with AWS Cognito authentication
  - Allows authentication flows that may use popup windows
  - More permissive than `same-origin` but still provides protection

- **COEP: `credentialless`**:
  - Allows cross-origin resources to be loaded without credentials
  - Compatible with CDN resources (Bootstrap from cdn.jsdelivr.net) that use `crossorigin="anonymous"`
  - Provides Spectre protection while being less restrictive than `require-corp`

**Verification**:
To verify cross-origin isolation is enabled:
```javascript
// In browser console:
console.log(self.crossOriginIsolated);
// Should return: true
```

**Note**: If this alert still appears in ZAP scans, verify that:
1. Scan is targeting the correct environment (production-like with Caddy or development with Vite)
2. Headers are present in response headers (check Network tab in DevTools)
3. No proxy or CDN is stripping the headers
4. Browser supports COOP/COEP (Chrome 83+, Firefox 79+, Safari 15+)

**Investigation Note (2025-12-15)**:
- Headers are configured in Caddyfile (lines 62-63)
- If ZAP still detects this alert, it may indicate:
  - OpenShift router or intermediate proxy stripping headers
  - Headers not applied to all response types (static files, etc.)
  - ZAP scanning before headers are applied
- Manual verification recommended: Check browser DevTools Network tab for actual response headers

**References**:
- [OWASP ZAP Alert 90004](https://www.zaproxy.org/docs/alerts/90004/)
- [COOP/COEP Implementation](../COOP-COEP-IMPLEMENTATION.md) - Detailed implementation documentation
- [Security Headers](../SECURITY-HEADERS.md) - Complete security headers documentation
- [Making your website "cross-origin isolated"](https://web.dev/cross-origin-isolation-guide/)

---

### 12. Proxy Disclosure (40025)

**Risk Level**: Low  
**ZAP Alert ID**: 40025

**Description**:  
ZAP detects HTTP response headers that reveal information about reverse proxy infrastructure, such as `Via`, `X-Forwarded-*`, or `Server` headers.

**Findings**:
- Proxy disclosure headers detected in responses
- Headers added by OpenShift HAProxy router (`Via`, `X-Forwarded-*`, `Server`)
- Headers present on multiple endpoints (root, assets, static files)

**Risk Assessment**:
- **Potential Risk**: Proxy information could aid attackers in infrastructure reconnaissance
- **Actual Risk**: ✅ **Low** (Mitigated)

**Mitigation Implemented**:
- Caddyfile configured to remove proxy disclosure headers from all responses:
  - `-Via`
  - `-X-Forwarded-For`
  - `-X-Forwarded-Host`
  - `-X-Forwarded-Port`
  - `-X-Forwarded-Proto`
  - `-Forwarded`
  - `-Server`
- Headers are necessary for backend processing but removed from client-facing responses
- See [SECURITY-HEADERS.md](../SECURITY-HEADERS.md) for detailed documentation

**Status**: ✅ **Resolved/Mitigated**

**Note**: If this alert still appears after deployment, verify:
1. Caddyfile changes are deployed
2. Headers are actually removed in production responses
3. No intermediate proxy is re-adding headers

**References**:
- [OWASP ZAP Alert 40025](https://www.zaproxy.org/docs/alerts/40025/)
- [Security Headers Documentation](../SECURITY-HEADERS.md) - Proxy disclosure mitigation

---

### 13. Cookie Slack Detector (90027)

**Risk Level**: Informational  
**ZAP Alert ID**: 90027

**Description**:  
ZAP detects cookies that, when omitted, do not affect the response size or content. This may indicate cookies that are not being properly enforced.

**Findings**:
- Cookies detected that don't affect responses when omitted
- Likely includes AWS Cognito OAuth cookies (`XSRF-TOKEN`, session cookies)
- May include application cookies during certain request flows

**Risk Assessment**:
- **Potential Risk**: Cookies not affecting responses could indicate missing authentication/session validation
- **Actual Risk**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
1. **OAuth Flow Cookies**: Cognito OAuth cookies (`XSRF-TOKEN`) are:
   - Only required during authentication flows
   - Not checked on every request (normal OAuth behavior)
   - Properly validated during critical operations (login, token exchange)
2. **Application Cookies**: Application authentication cookies are:
   - Validated on protected API endpoints (see `authMiddleware.js`)
   - Required for state-changing operations
   - May not affect static asset responses (expected behavior)
3. **Expected Behavior**: Not all cookies need to affect all responses:
   - Static assets don't require authentication
   - Public endpoints may not check cookies
   - Authentication is enforced at the API layer, not static file layer

**Mitigation**:
- Authentication middleware validates tokens on protected endpoints
- CSRF protection via Cognito's XSRF-TOKEN mechanism
- Session management properly implemented for authenticated requests

**References**:
- [OWASP ZAP Alert 90027](https://www.zaproxy.org/docs/alerts/90027/)

---

### 14. Non-Storable Content (10049)

**Risk Level**: Informational  
**ZAP Alert ID**: 10049

**Description**:  
ZAP detects HTTP responses that cannot be stored by caching components (proxy servers, browsers). This indicates content that cannot be cached.

**Findings**:
- Responses include `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
- Multiple endpoints return non-storable content (root, favicon, robots.txt, sitemap.xml)

**Risk Assessment**:
- **Potential Risk**: None - this is intentional security configuration
- **Actual Risk**: ✅ **Low** (Accepted - Intentional)

**Acceptance Rationale**:
1. **Intentional Security Configuration**: Application explicitly sets `Cache-Control: no-store` for:
   - HTML entry point (prevents stale authentication state)
   - Security-sensitive responses
   - Dynamic content that must be fresh
2. **Appropriate for Application Type**: Government exam application requires:
   - Fresh authentication checks
   - No cached sensitive data
   - Real-time content updates
3. **Performance Trade-off**: Acceptable trade-off for security:
   - Static assets (JS, CSS) are versioned and can be cached separately
   - HTML entry point is small and infrequently accessed
   - Security benefits outweigh minor performance impact

**Configuration**:
- Cache-Control headers set in Caddyfile (line 42)
- Intentional configuration to prevent caching of sensitive content

**References**:
- [OWASP ZAP Alert 10049](https://www.zaproxy.org/docs/alerts/10049/)
- [HTTP Caching - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

### 15. Session Management Response Identified (10112)

**Risk Level**: Informational  
**ZAP Alert ID**: 10112

**Description**:  
ZAP detects HTTP responses containing session management tokens. This is an informational alert to help configure ZAP's session management detection.

**Findings**:
- Session management tokens detected in responses
- Likely includes Authorization headers or session cookies
- Detected on root and main application endpoints

**Risk Assessment**:
- **Potential Risk**: None - this is informational only
- **Actual Risk**: ✅ **Informational** (Not a vulnerability)

**Acceptance Rationale**:
1. **Informational Alert**: This alert is not a vulnerability - it's ZAP identifying session tokens for its own session management configuration
2. **Expected Behavior**: Application uses:
   - AWS Cognito authentication tokens
   - JWT tokens in Authorization headers
   - Session cookies for authentication state
3. **Proper Implementation**: Session management is properly implemented:
   - Tokens validated on protected endpoints
   - Secure token storage and transmission
   - Proper session lifecycle management

**Action Required**: None - this is an informational alert for ZAP configuration purposes only.

**References**:
- [OWASP ZAP Alert 10112](https://www.zaproxy.org/docs/alerts/10112/)

---

### 16. Sec-Fetch-Mode Header is Missing (90005 variant)

**Risk Level**: Informational  
**ZAP Alert ID**: 90005

**Description**:  
ZAP detects that the `Sec-Fetch-Mode` header is not set or validated by the server. This is a variant of the Sec-Fetch header alerts.

**Risk Assessment**: ✅ **Low** (Accepted)

**Acceptance Rationale**:
- Same rationale as other Sec-Fetch headers (see alert #5)
- Browser-controlled header, not application-controlled
- Covered under existing Sec-Fetch header documentation

**References**:
- See [Sec-Fetch-Dest Header Not Set (90005)](#5-sec-fetch-dest-header-not-set-90005) above

---

## Risk Summary

| Alert Type | Risk Level | Status | Mitigation |
|------------|-----------|---------|------------|
| Base64 Disclosure | Informational | Accepted | No sensitive data in bundles; code review |
| Timestamp Disclosure | Informational | Accepted | Legitimate business function; non-sensitive |
| Suspicious Comments | Informational | Accepted | Open source context; production builds minimize |
| Modern Web Application | Informational | Accepted | Dependency management; security scanning |
| Sec-Fetch Headers | Informational | Accepted | Browser-controlled; other controls in place |
| Retrieved from Cache | Informational | Accepted | Intentional; appropriate cache headers |
| X-Content-Type-Options | Low | Resolved | Security headers configured |
| Cookie SameSite=None | Low | Accepted | AWS Cognito managed; application uses Lax |
| Spectre Site Isolation | Low | Resolved* | COOP/COEP headers configured (investigating detection) |
| Proxy Disclosure | Low | Resolved | Header removal configured in Caddyfile |
| Cookie Slack Detector | Informational | Accepted | OAuth cookies; authentication enforced at API layer |
| Non-Storable Content | Informational | Accepted | Intentional security configuration |
| Session Management Response | Informational | Accepted | Informational only; not a vulnerability |
| Sec-Fetch-Mode | Informational | Accepted | Covered under Sec-Fetch headers |

\* Headers configured but may not be detected by ZAP due to proxy/router behavior

---

## Overall Security Posture

The accepted alerts in this document represent informational findings that:

1. **Do not present exploitable vulnerabilities** in the current architecture
2. **Are inherent to modern web development** practices (React, bundling, caching)
3. **Are mitigated by other security controls** (authentication, network policies, CORS)
4. **Represent acceptable risk** given the application's threat model and risk tolerance

### Layered Security Approach

The application implements defense-in-depth with multiple security layers:

- **Network Level**: Backend isolated to internal OpenShift network only
- **Application Level**: Authentication (AWS Cognito), authorization, input validation
- **Transport Level**: HTTPS/TLS for all external communications
- **Headers Level**: Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- **Code Level**: Dependency scanning, static analysis, code review

### Related Documentation

- [ZAP Dangerous JS Functions Audit](./zap-dangerous-js-functions-audit.md) - Medium risk alert (eval) - RESOLVED
- [Security Headers](../SECURITY-HEADERS.md) - HTTP security header configuration
- [Cookie Security](../COOKIE_SECURITY.md) - Cookie handling and authentication
- [COOP/COEP Implementation](../COOP-COEP-IMPLEMENTATION.md) - Cross-origin isolation

---

## Maintenance and Review

### Review Process

1. **Quarterly Review**: Security team reviews this document and validates findings are still applicable
2. **Architecture Changes**: Document updated when significant changes affect security posture
3. **New Alerts**: New ZAP findings evaluated and added to this document with rationale
4. **Dependency Updates**: Major framework updates may require re-assessment

### When to Re-Evaluate

Re-evaluate accepted alerts if:
- Application becomes publicly accessible (no authentication)
- Backend becomes directly accessible from internet
- Sensitive data types change (PII, PHI, financial data)
- Threat model changes significantly
- Regulatory requirements change
- New attack vectors emerge for accepted risks

### Contact

For questions about security findings or this documentation:
- Open an issue in the repository
- Contact the development team via Rocket Chat (@jazz.grewal)
- Follow security incident reporting procedures in [SECURITY.md](../../SECURITY.md)

---

## Appendix: Common ZAP Alert Categories

### Informational Alerts
These alerts provide information about the application but typically don't represent vulnerabilities:
- Framework/technology detection
- Metadata disclosure (timestamps, versions)
- Development artifacts (comments, TODOs)
- Browser feature notices (Sec-Fetch headers)

### Low-Risk Alerts
These alerts identify potential improvements but don't represent immediate threats:
- Missing optional security headers
- Cache configuration notices
- Cookie attribute recommendations

### Medium/High-Risk Alerts
These require investigation and typically require remediation:
- Missing critical security headers
- Dangerous function usage (eval, innerHTML with user data)
- Injection vulnerabilities (XSS, SQL injection)
- Authentication/authorization issues

**Note**: Medium and high-risk alerts should not be "accepted" without thorough investigation and mitigation.

---

## Version History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-13 | 1.0 | Initial documentation of accepted ZAP alerts | GitHub Copilot |
| 2025-12-15 | 1.1 | Added Cookie SameSite=None (10054) and Spectre Site Isolation (90004) alerts | Auto |
| 2025-12-15 | 1.2 | Added Proxy Disclosure (40025), Cookie Slack (90027), Non-Storable Content (10049), Session Management (10112), and Sec-Fetch-Mode alerts. Fixed Proxy Disclosure mitigation. | Auto |

---

*This document is part of the Natural Resources RESULTS Exam Web Application security documentation.*
