const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getFullAnalysis,
  getRequirements,
  getMatching,
  getRisks,
  getDecision,
  getReport
} = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');
const { checkTenderOwnership } = require('../middleware/ownership');

router.use(protect);
router.use(checkTenderOwnership);

router.get('/', getFullAnalysis);
router.get('/requirements', getRequirements);
router.get('/matching', getMatching);
router.get('/risks', getRisks);
router.get('/decision', getDecision);
router.get('/report', getReport);

module.exports = router;
