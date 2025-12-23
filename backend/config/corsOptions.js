const frontendUrl = process.env.FRONTEND_URL;

/**
 * Build the default whitelist of allowed origins.
 * Used by the CORS configuration in backend/index.js.
 */
function getDefaultWhitelist() {
  return [
    'http://localhost:3000', // For local development
    frontendUrl, // Frontend URL from environment variable
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
        if (req.headers['x-forwarded-by'] === 'caddy-proxy') {
          return callback(null, true);
        }
        // Deny requests without origin and without the trusted proxy header
        return callback(new Error('CORS: Requests with no origin must come from trusted proxy'));
      }

      // Check if origin matches any whitelisted domain (by hostname)
      // Helper function to get effective port (handles default ports)
      const getEffectivePort = (url) => {
        if (url.port) return url.port;
        if (url.protocol === 'http:') return '80';
        if (url.protocol === 'https:') return '443';
        return '';
      };

      try {
        const originUrl = new URL(origin);
        const isAllowed = whitelist.some((allowed) => {
          try {
            const allowedUrl = new URL(allowed);
            // Match by hostname (and port if specified in whitelist)
            // Always compare effective ports (explicit or default)
            return (
              originUrl.hostname === allowedUrl.hostname &&
              getEffectivePort(originUrl) === getEffectivePort(allowedUrl)
            );
          } catch (error) {
            // If whitelist entry is not a valid URL (TypeError from new URL()),
            // fallback to string/host:port comparison
            // Support 'hostname' or 'hostname:port' in whitelist
            // Handle the exception by using fallback comparison logic
            if (error instanceof TypeError) {
              const [allowedHost, allowedPort] = allowed.split(':');
              if (allowedPort) {
                // Compare both hostname and port
                // Use getEffectivePort for consistent port comparison with URL-based logic
                return (
                  originUrl.hostname === allowedHost && getEffectivePort(originUrl) === allowedPort
                );
              }
              // Compare only hostname
              return originUrl.hostname === allowedHost;
            }
            // Re-throw if it's not a TypeError (unexpected error)
            throw error;
          }
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } catch (error) {
        // Invalid origin URL format - reject the request
        // The origin string cannot be parsed as a URL (TypeError from new URL()),
        // so we handle the exception by explicitly denying the request
        if (error instanceof TypeError) {
          callback(new Error('Not allowed by CORS'));
        } else {
          // Re-throw if it's not a TypeError (unexpected error)
          throw error;
        }
      }
    },
  };
}

module.exports = {
  getCorsOptions,
  getDefaultWhitelist,
};
