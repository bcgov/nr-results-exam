const express = require('express');
const cors = require('cors');
const dotenv =require('dotenv');
const indexRoutes = require("./routes/indexRoutes");
const mailRoutes = require("./routes/mailRoutes");
const healthRoutes = require("./routes/healthRoutes");

dotenv.config({
  path: './.env'
})
const app = express();
app.use(express.json());
// positioning the health route before defining strict CORS, and allow * for health
app.use('/health',cors({origin:'*'}),healthRoutes);

const whitelist = ['http://localhost:3000', 'https://nr-results-exam-test-frontend.apps.silver.devops.gov.bc.ca', 'https://nr-results-exam-prod-frontend.apps.silver.devops.gov.bc.ca' ];

const corsOptions = {
  origin: function (origin, callback) {
    if (origin && whitelist.some(domain => origin.startsWith(domain))) {
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
app.use('/api/mail', mailRoutes);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
