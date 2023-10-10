const express = require("express");
const router = express.Router({});
router.get('/', async (_req, res, _next) => {
    const check = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        // Send CORS headers
        res.header('Access-Control-Allow-Origin', 'https://4d73-154-20-152-157.ngrok-free.app/');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.send(check);
    } catch (error) {
        check.message = error;
        res.status(503).send();
    }
});
// export router with all routes included
module.exports = router;
