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

// Configure CORS options
const corsOptions = {origin: '*'};
app.use(express.json());
app.use(cors(corsOptions));

app.use('/api/', indexRoutes);
app.use('/api/mail', mailRoutes);

app.use('/health', healthRoute);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
