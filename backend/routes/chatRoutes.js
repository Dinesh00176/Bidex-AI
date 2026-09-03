const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  askTenderChat,
  getChatHistory,
  clearChatHistory
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { checkTenderOwnership } = require('../middleware/ownership');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(protect);
router.use(checkTenderOwnership);

router.post('/', aiLimiter, askTenderChat);
router.get('/', getChatHistory);
router.delete('/', clearChatHistory);

module.exports = router;
