# Security Headers Configuration

## Proxy Disclosure Header Mitigation

### Background
Security scanning tools (like OWASP ZAP) may report "Proxy Disclosure" alerts when HTTP response headers reveal information about the reverse proxy infrastructure. In OpenShift deployments, the HAProxy router automatically adds the following headers:

- `Via`: Indicates the protocol and recipient of a proxy
- `X-Forwarded-For`: Original client IP address
- `X-Forwarded-Host`: Original host requested by the client
- `X-Forwarded-Port`: Original port requested by the client  
- `X-Forwarded-Proto`: Original protocol (HTTP/HTTPS)
- `Forwarded`: Standardized version of X-Forwarded-* headers

### Why These Headers Exist
These headers are added by OpenShift's HAProxy router and serve important purposes:
1. **Request Routing**: Help backend services understand the original request context
2. **Protocol Detection**: Allow applications to detect if the original request was HTTPS
3. **IP Tracking**: Enable proper client IP logging and rate limiting

### Security Mitigation Strategy
While these headers are necessary for backend processing, they should not be exposed to end users in responses. Our mitigation strategy:

#### 1. Application-Level Header Removal (Caddy)
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

#### 2. OpenShift Route Configuration
The Route resources in `openshift.deploy.yml` files use edge TLS termination, which means:
- TLS is terminated at the router
- The router adds the X-Forwarded headers for backend communication
- These headers do not leak sensitive cluster-internal information

### Verification
To verify that proxy headers are removed:

1. **Local Testing**: Build and run the Caddy container locally, inspect response headers
2. **Deployed Environment**: Use browser developer tools or curl to inspect response headers:
   ```bash
   curl -I https://nr-results-exam-test-frontend.apps.silver.devops.gov.bc.ca
   ```

Response headers should NOT include Via or X-Forwarded-* headers.

### Risk Assessment
- **Risk Level**: Low
- **Justification**: The proxy headers added by OpenShift HAProxy are standard HTTP headers and do not expose sensitive cluster-internal information. The headers only indicate that a reverse proxy exists, which is expected for modern web applications.
- **Mitigation**: Headers are removed at the application level to prevent information disclosure while maintaining backend functionality.

### References
- [Caddy Header Directive](https://caddyserver.com/docs/caddyfile/directives/header)
- [OpenShift Routes Documentation](https://docs.openshift.com/container-platform/latest/networking/routes/route-configuration.html)
- [OWASP Proxy Disclosure](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url)
