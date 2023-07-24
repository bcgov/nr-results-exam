const express = require('express');
const cors = require('cors');
const indexRoutes = require("./routes/indexRoutes")

const app = express();

// Configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with the actual frontend domain
  methods: [ 'POST'], // Specify the allowed HTTP methods
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

app.use('/', indexRoutes);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
