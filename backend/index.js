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
    // Allow requests with no origin (like mobile apps, curl, Postman, or server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin exactly matches one of the whitelisted origins
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
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
