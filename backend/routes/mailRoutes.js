const express = require('express')
const { sendMail } = require('../controllers/mailControllers')
const router = express.Router()

/* GET home page. */
router.route('/').post(sendMail)
module.exports = router
