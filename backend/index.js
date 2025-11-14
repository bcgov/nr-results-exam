const express = require('express');
const cors = require('cors');
const dotenv =require('dotenv');
const rateLimit = require('express-rate-limit');
const indexRoutes = require('./routes/indexRoutes');
const questionRoutes = require('./routes/questionRoutes');
const mailRoutes = require('./routes/mailRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

dotenv.config({
  path: './.env'
});
const app = express();
app.use(express.json());
app.set('trust proxy', 1);

// Rate limiter for /api/questions route
const questionsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

// Rate limiter for /api/mail route
const mailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

const frontendUrl = process.env.FRONTEND_URL;
const whitelist = [
  'http://localhost:3000', // For local development
  frontendUrl // Frontend URL from environment variable
].filter(Boolean); // Remove any undefined values

const getCorsOptions = (req) => ({
  origin: function (origin, callback) {
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
            originUrl.hostname === allowedUrl.hostname &&
            getEffectivePort(originUrl) === getEffectivePort(allowedUrl)
          );
        } catch (_e) {
          // If whitelist entry is not a valid URL, fallback to string/host:port comparison
          // Support 'hostname' or 'hostname:port' in whitelist
          const [allowedHost, allowedPort] = allowed.split(':');
          if (allowedPort) {
            // Compare both hostname and port
            return (
              originUrl.hostname === allowedHost &&
              originUrl.port === allowedPort
            );
          } else {
            // Compare only hostname
            return originUrl.hostname === allowedHost;
          }
        }
      });
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } catch (_e) {
      callback(new Error('Not allowed by CORS'));
    }
  }
});

// Let health check through before CORS
app.use('/health', healthRoutes);

// CORS, routes
app.use((req, res, next) => {
  cors(getCorsOptions(req))(req, res, next);
});

app.use('/api/', indexRoutes);
// Protected routes - require authentication
app.use('/api/questions', questionsRateLimiter, authenticateToken, questionRoutes);
app.use('/api/mail', mailRateLimiter, authenticateToken, mailRoutes);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
