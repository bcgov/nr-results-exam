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

// Define the array of whitelisted IP addresses , the loopback will be allowed automatically
const whitelist = ['192.168.1.89', '172.21.0.1'];

// Middleware to check if the request's IP is in the whitelist
const ipWhitelistMiddleware = (req, res, next) => {
  let clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log("request from IP = "+clientIp);
  // If the clientIp is in the IPv6 format "::ffff:", extract the IPv4 part
  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substr(7);
  }

  if (isLoopbackIp(clientIp) || (isValidIp(clientIp) && whitelist.includes(clientIp)) || isHealthCheck(req.url)) {
    // If the IP is the loopback address or in the whitelist, allow the request to proceed
    next();
  } else {
    // If the IP is not in the whitelist, send a 403 Forbidden response
    res.status(403).json({ error: 'Access denied. IP address not whitelisted.' });
  }
};

// Helper function to check if an IP address is the loopback address
function isLoopbackIp(ip) {
  return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
}

// Helper function to let health checks through
function isHealthCheck(path) {
  return path === '/health';
}

// Helper function to validate if an IP address is valid
function isValidIp(ip) {
  // Regular expression to validate IPv4 and IPv6 addresses, excluding loopback addresses
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

// Apply IP whitelist middleware before CORS middleware
app.use(ipWhitelistMiddleware);

// Configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with the actual frontend domain
  methods: ['GET','POST'], // Specify the allowed HTTP methods
};
app.use(express.json());
app.use(cors(corsOptions));

app.use('/api/', indexRoutes);
app.use('/api/mail', mailRoutes);

app.use('/health', healthRoute);

app.listen(5000, () => {
  console.log('Backend server is running on port 5000');
});
