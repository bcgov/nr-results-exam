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
          return (
            originUrl.hostname === allowedUrl.hostname &&
            (allowedUrl.port ? originUrl.port === allowedUrl.port : true)
          );
        } catch (e) {
          // If whitelist entry is not a valid URL, fallback to string comparison
          return originUrl.hostname === allowed;
        }
      });
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } catch (e) {
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
