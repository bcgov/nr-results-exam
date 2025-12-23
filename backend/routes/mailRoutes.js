var express = require('express');
const { sendMail } = require('../controllers/mailControllers');
var router = express.Router();

/* GET home page. */
router.route('/').post(sendMail);
module.exports = router;
