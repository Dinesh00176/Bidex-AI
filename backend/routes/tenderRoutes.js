const express = require('express');
const router = express.Router();
const {
  getTenders,
  uploadTender,
  getTenderById,
  deleteTender,
  processTender,
  getTenderStatus
} = require('../controllers/tenderController');
const { protect } = require('../middleware/auth');
const { checkTenderOwnership } = require('../middleware/ownership');
const upload = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.get('/', getTenders);
router.post('/upload', upload.single('file'), uploadTender);
router.get('/:id', checkTenderOwnership, getTenderById);
router.delete('/:id', checkTenderOwnership, deleteTender);
router.post('/:id/process', checkTenderOwnership, aiLimiter, processTender);
router.get('/:id/status', checkTenderOwnership, getTenderStatus);

module.exports = router;
