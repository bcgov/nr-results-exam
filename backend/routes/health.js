const express = require("express");
const router = express.Router({});
router.get('/', async (_req, res, _next) => {
    const check = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now()
    };
    try {
        res.send(check);
    } catch (error) {
        check.message = error;
        res.status(503).send();
    }
});
// export router with all routes included
module.exports = router;
