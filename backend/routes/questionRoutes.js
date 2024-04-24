var express = require('express');
var router = express.Router();
const { getFileFromS3 } = require('../controllers/questionController');

// GET endpoint for fetching
router.get('/:fileName', getFileFromS3);

module.exports = router;
