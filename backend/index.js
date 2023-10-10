const express = require('express');
const cors = require('cors');
const dotenv =require('dotenv');
const indexRoutes = require("./routes/indexRoutes");
const mailRoutes = require("./routes/mailRoutes");
const healthRoute = require('./routes/health');

dotenv.config({
  path: './.env'
})
const app = express();
app.use(express.json());

const whitelist = ['http://localhost:3000', 'https://nr-results-exam-test-frontend.apps.silver.devops.gov.bc.ca/', 'https://nr-results-exam-prod-frontend.apps.silver.devops.gov.bc.ca/' ];

const corsOptions = {
  origin: function (origin, callback) {
    if (origin && whitelist.some(domain => origin.startsWith(domain))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));


app.use('/api/', indexRoutes);
app.use('/api/mail', mailRoutes);

app.use('/health', healthRoute);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
