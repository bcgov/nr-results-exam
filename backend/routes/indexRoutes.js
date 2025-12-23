var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, _next) {
  res.json({
    status: 200,
    success: true,
  });
});

module.exports = router;
