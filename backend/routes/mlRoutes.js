const express = require('express');
const router = express.Router();
const { getMlStatus, predictTenderBid, trainMlModel } = require('../controllers/mlController');
const { protect } = require('../middleware/auth');

// Public health & status endpoint
router.get('/status', getMlStatus);

// Authenticated prediction endpoint
router.post('/predict', protect, predictTenderBid);

// Authenticated retraining endpoint
router.post('/train', protect, trainMlModel);

module.exports = router;
