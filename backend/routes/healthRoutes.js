const express = require("express");
const router = express.Router({});

router.get('/', async (_req, res, _next) => {
    res.send({
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    });
});

module.exports = router;
