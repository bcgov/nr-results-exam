const express = require('express');
const cors = require('cors');
const dotenv =require('dotenv');
const indexRoutes = require('./routes/indexRoutes');
const questionRoutes = require('./routes/questionRoutes');
const mailRoutes = require('./routes/mailRoutes');
const healthRoutes = require('./routes/healthRoutes');

dotenv.config({
  path: './.env'
});
const app = express();
app.use(express.json());

// Middleware to remove proxy disclosure headers
// These headers are added by OpenShift HAProxy router but should not be exposed to clients
app.use((req, res, next) => {
  res.removeHeader('Via');
  res.removeHeader('X-Forwarded-For');
  res.removeHeader('X-Forwarded-Host');
  res.removeHeader('X-Forwarded-Port');
  res.removeHeader('X-Forwarded-Proto');
  res.removeHeader('Forwarded');
  next();
});

const frontendUrl = process.env.FRONTEND_URL;
const whitelist = [
  'http://localhost:3000', // For local development
  frontendUrl // Frontend URL from environment variable
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Deny requests with no origin to avoid bypassing CORS protection
    if (!origin) {
      return callback(new Error('CORS: Requests with no origin are not allowed'));
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
};

// Let health check through before CORS
app.use('/health', healthRoutes);

// CORS, routes
app.use(cors(corsOptions));

app.use('/api/', indexRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/mail', mailRoutes);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
