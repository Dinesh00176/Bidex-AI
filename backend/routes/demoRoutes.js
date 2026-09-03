const express = require('express');
const router = express.Router();
const { seedDemoEnvironment } = require('../controllers/demoController');

router.post('/seed', seedDemoEnvironment);

module.exports = router;
