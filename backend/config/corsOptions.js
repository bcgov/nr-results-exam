const frontendUrl = process.env.FRONTEND_URL;

/**
 * Build the default whitelist of allowed origins.
 * This mirrors the configuration in backend/index.js.
 */
function getDefaultWhitelist() {
  return [
    'http://localhost:3000', // For local development
    frontendUrl // Frontend URL from environment variable
  ].filter(Boolean);
}

/**
 * Shared CORS options helper.
 * Given a request and a whitelist, returns the origin callback used by cors().
 */
function getCorsOptions(req, whitelist) {
  return {
    origin(origin, callback) {
      // Allow requests with no origin only if they come from the internal proxy
      // (validated by custom header set by Caddy)
      if (!origin) {
        // For server-to-server requests, require the X-Forwarded-By header
        // This adds defense-in-depth beyond network isolation
        if (req.headers[ 'x-forwarded-by' ] === 'caddy-proxy') {
          return callback(null, true);
        }
        // Deny requests without origin and without the trusted proxy header
        return callback(new Error('CORS: Requests with no origin must come from trusted proxy'));
      }

      // Check if origin matches any whitelisted domain (by hostname)
      try {
        const originUrl = new URL(origin);
        const isAllowed = whitelist.some((allowed) => {
          try {
            const allowedUrl = new URL(allowed);
            // Match by hostname (and port if specified in whitelist)
            // Always compare effective ports (explicit or default)
            const getEffectivePort = (url) => {
              if (url.port) return url.port;
              if (url.protocol === 'http:') return '80';
              if (url.protocol === 'https:') return '443';
              return '';
            };
            return (
              originUrl.hostname === allowedUrl.hostname
              && getEffectivePort(originUrl) === getEffectivePort(allowedUrl)
            );
          } catch (_error) {
            // If whitelist entry is not a valid URL, fallback to string/host:port comparison
            // Support 'hostname' or 'hostname:port' in whitelist
            // The error is expected when whitelist entry is not a full URL, so we handle it
            const [ allowedHost, allowedPort ] = allowed.split(':');
            if (allowedPort) {
              // Compare both hostname and port
              return (
                originUrl.hostname === allowedHost
                && originUrl.port === allowedPort
              );
            }
            // Compare only hostname
            return originUrl.hostname === allowedHost;
          }
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch (_error) {
        // Invalid origin URL format - reject the request
        // The error details are not needed, just reject with CORS error
        callback(new Error('Not allowed by CORS'));
      }
    }
  };
}

module.exports = {
  getCorsOptions,
  getDefaultWhitelist
};
