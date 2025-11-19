const express = require('express');
const cors = require('cors');
const dotenv =require('dotenv');
const rateLimit = require('express-rate-limit');
const { resolveTrustProxy } = require('./config/trustProxy');
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

const trustProxy = resolveTrustProxy(process.env.TRUST_PROXY);
app.set('trust proxy', trustProxy);
console.log(`Express trust proxy set to: ${trustProxy}`);

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

const getCorsOptions = (req) => ({
  origin: function (origin, callback) {
    // All requests must come through Caddy proxy (defense-in-depth)
    // This validates that requests are proxied by Caddy, not direct access
    if (req.headers['x-forwarded-by'] === 'caddy-proxy') {
      return callback(null, true);
    }
    // Deny all requests that don't come through the trusted proxy
    return callback(new Error('Not allowed by CORS: Request must come through Caddy proxy'));
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
